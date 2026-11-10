import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_WALLPAPERS } from './src/shared/seedCatalog.ts';
import { WALLPAPER_CATEGORIES } from './src/shared/localization.ts';
import {
  filterAndSortWallpapers,
  validatePersonalVideoImport,
  verifySubscriptionEntitlement,
  type WallpaperItem,
  type UserProfile
} from './src/shared/lumaLogic.ts';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'luma-db.json');

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
  favorites: string[];
  createdAt: string;
}

interface ContentReport {
  id: string;
  wallpaperId: string;
  wallpaperTitle: string;
  reporterEmail: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetId: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: Record<string, string>; // token -> userId
  wallpapers: WallpaperItem[];
  reports: ContentReport[];
  auditLogs: AuditLogEntry[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) as DatabaseSchema;
    } catch {
      // Fallback to fresh seed if corrupted
    }
  }

  const adminSalt = crypto.randomBytes(16).toString('hex');
  const demoSalt = crypto.randomBytes(16).toString('hex');

  const initialDb: DatabaseSchema = {
    users: [
      {
        id: 'usr-admin-01',
        email: 'admin@luma.app',
        displayName: 'LUMA Lead Architect',
        role: 'ADMIN',
        isPremium: true,
        subscriptionPlan: 'ANNUAL',
        subscriptionExpiresAt: '2028-12-31T23:59:59Z',
        passwordHash: hashPassword('LumaAdmin2026!', adminSalt),
        salt: adminSalt,
        favorites: ['luma-wp-001', 'luma-wp-003', 'luma-wp-018'],
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'usr-demo-01',
        email: 'creator@luma.app',
        displayName: 'Alex Mercer',
        role: 'USER',
        isPremium: false,
        subscriptionPlan: 'FREE',
        passwordHash: hashPassword('LumaUser2026!', demoSalt),
        salt: demoSalt,
        favorites: ['luma-wp-001', 'luma-wp-002'],
        createdAt: '2026-06-15T00:00:00Z'
      }
    ],
    sessions: {
      'demo-admin-token': 'usr-admin-01',
      'demo-user-token': 'usr-demo-01'
    },
    wallpapers: [...INITIAL_WALLPAPERS],
    reports: [
      {
        id: 'rep-001',
        wallpaperId: 'luma-wp-005',
        wallpaperTitle: 'Obsidian Wyrm of Mount Ignis',
        reporterEmail: 'user42@example.com',
        reason: 'Loop splice point at 9.98s shows minor audio pop on HDMI monitor speakers.',
        status: 'OPEN',
        createdAt: '2026-11-08T14:22:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'aud-001',
        actorEmail: 'admin@luma.app',
        action: 'SYSTEM_BOOTSTRAP',
        targetId: 'catalog-v1',
        timestamp: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

const db = loadDatabase();

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > 240) {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
    return;
  }
  next();
}

function getAuthenticatedUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}

function sanitizeUser(u: StoredUser): UserProfile & { favorites: string[] } {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    isPremium: u.isPremium,
    subscriptionPlan: u.subscriptionPlan,
    subscriptionExpiresAt: u.subscriptionExpiresAt,
    favorites: u.favorites
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', rateLimiter);

  // Health & Platform Capabilities
  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
        process.env.GEMINI_API_KEY.trim().length > 5
    );
    res.json({
      status: 'ok',
      app: 'LUMA Live Wallpaper Platform',
      aiStudioConfigured: hasGeminiKey,
      categoriesCount: WALLPAPER_CATEGORIES.length,
      wallpapersCount: db.wallpapers.length
    });
  });

  // Categories
  app.get('/api/categories', (_req, res) => {
    const counts: Record<string, number> = {};
    for (const wp of db.wallpapers) {
      if (wp.isPublished) {
        counts[wp.categorySlug] = (counts[wp.categorySlug] ?? 0) + 1;
      }
    }
    res.json({
      categories: WALLPAPER_CATEGORIES.map((c) => ({
        ...c,
        count: counts[c.slug] ?? 0
      }))
    });
  });

  // Wallpapers query
  app.get('/api/wallpapers', (req, res) => {
    const { search, categorySlug, resolution, style, tier, sortBy, includeUnpublished } = req.query;
    const user = getAuthenticatedUser(req);
    const onlyPublished = !(includeUnpublished === 'true' && user?.role === 'ADMIN');

    const results = filterAndSortWallpapers(db.wallpapers, {
      search: typeof search === 'string' ? search : undefined,
      categorySlug: typeof categorySlug === 'string' ? categorySlug : undefined,
      resolution: (typeof resolution === 'string' ? resolution : 'ALL') as any,
      style: typeof style === 'string' ? style : 'ALL',
      tier: (typeof tier === 'string' ? tier : 'ALL') as any,
      sortBy: (typeof sortBy === 'string' ? sortBy : 'popular') as any,
      onlyPublished
    });

    res.json({ wallpapers: results });
  });

  // Record download & verify entitlement
  app.post('/api/wallpapers/:id/download', (req, res) => {
    const wp = db.wallpapers.find((w) => w.id === req.params.id);
    if (!wp) {
      res.status(404).json({ error: 'Wallpaper not found.' });
      return;
    }
    const user = getAuthenticatedUser(req);
    const entitlement = verifySubscriptionEntitlement(user, wp);
    if (!entitlement.allowed) {
      res.status(403).json({ error: entitlement.reason, code: 'PREMIUM_REQUIRED' });
      return;
    }

    wp.downloadsCount += 1;
    saveDatabase(db);
    res.json({
      allowed: true,
      wallpaperId: wp.id,
      sha256Checksum: wp.sha256Checksum,
      downloadsCount: wp.downloadsCount
    });
  });

  // Validate personal video import
  app.post('/api/wallpapers/validate-import', (req, res) => {
    const result = validatePersonalVideoImport(req.body);
    if (!result.valid) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  // Authentication endpoints
  app.post('/api/auth/signup', (req, res) => {
    const { email, password, displayName } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const newUser: StoredUser = {
      id: `usr-${crypto.randomBytes(6).toString('hex')}`,
      email: normalizedEmail,
      displayName: (displayName || normalizedEmail.split('@')[0]).trim(),
      role: 'USER',
      isPremium: false,
      subscriptionPlan: 'FREE',
      passwordHash: hashPassword(password, salt),
      salt,
      favorites: [],
      createdAt: new Date().toISOString()
    };

    const token = `tok-${crypto.randomBytes(24).toString('hex')}`;
    db.users.push(newUser);
    db.sessions[token] = newUser.id;
    saveDatabase(db);

    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const candidateHash = hashPassword(String(password), user.salt);
    if (candidateHash !== user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = `tok-${crypto.randomBytes(24).toString('hex')}`;
    db.sessions[token] = user.id;
    saveDatabase(db);

    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body ?? {};
    if (!email || !newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'Valid email and new password (min 6 chars) required.' });
      return;
    }
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'No account found matching that email address.' });
      return;
    }
    user.salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = hashPassword(String(newPassword), user.salt);
    saveDatabase(db);
    res.json({ message: 'Password updated securely.' });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/favorites/toggle', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sign in to synchronize favorites across devices.' });
      return;
    }
    const { wallpaperId } = req.body ?? {};
    if (!wallpaperId || typeof wallpaperId !== 'string') {
      res.status(400).json({ error: 'wallpaperId is required.' });
      return;
    }
    const idx = user.favorites.indexOf(wallpaperId);
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
    } else {
      user.favorites.push(wallpaperId);
    }
    saveDatabase(db);
    res.json({ favorites: user.favorites });
  });

  // Subscriptions & Entitlements
  app.post('/api/subscriptions/activate', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please sign in before activating a subscription.' });
      return;
    }
    const { plan } = req.body ?? {};
    if (plan !== 'MONTHLY' && plan !== 'ANNUAL' && plan !== 'FREE') {
      res.status(400).json({ error: 'Invalid subscription plan.' });
      return;
    }

    user.isPremium = plan !== 'FREE';
    user.subscriptionPlan = plan;
    user.subscriptionExpiresAt =
      plan === 'ANNUAL'
        ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
        : plan === 'MONTHLY'
        ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
        : undefined;

    db.auditLogs.unshift({
      id: `aud-${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: user.email,
      action: `SUBSCRIPTION_${plan}`,
      targetId: user.id,
      timestamp: new Date().toISOString()
    });
    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  // AI Wallpaper Studio (Server-Side Gemini API Adapter)
  app.post('/api/ai/generate', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 6) {
      res.status(503).json({
        error:
          'AI provider credentials (GEMINI_API_KEY) are not configured on the server. Configure a valid key in Settings > Secrets to synthesize new AI wallpapers.'
      });
      return;
    }

    const { prompt, style, resolution, durationSeconds, categorySlug } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 4) {
      res.status(400).json({ error: 'Please enter a descriptive wallpaper prompt (at least 4 characters).' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Design a seamless looping live wallpaper specification for LUMA based on this user prompt: "${prompt.trim()}". Requested style: ${style || 'Cinematic'}.`,
        config: {
          systemInstruction:
            'You are the LUMA Live Wallpaper Shader & Art Director. Return a JSON object defining a title, refined atmospheric description, best matching shaderPreset from ["cyberpunk-rain","anime-sky-islands","cosmic-nebula","magical-forest","dragon-caldera","ocean-bioluminescence","solarpunk-citadel","abstract-silk","interactive-matrix","dark-eclipse"], and primary hex accentColor.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              shaderPreset: { type: Type.STRING },
              accentColor: { type: Type.STRING }
            },
            required: ['title', 'description', 'shaderPreset', 'accentColor']
          }
        }
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const validPresets = [
        'cyberpunk-rain',
        'anime-sky-islands',
        'cosmic-nebula',
        'magical-forest',
        'dragon-caldera',
        'ocean-bioluminescence',
        'solarpunk-citadel',
        'abstract-silk',
        'interactive-matrix',
        'dark-eclipse'
      ];
      const chosenPreset = validPresets.includes(parsed.shaderPreset)
        ? parsed.shaderPreset
        : 'cosmic-nebula';

      const newWallpaper: WallpaperItem = {
        id: `luma-ai-${crypto.randomBytes(4).toString('hex')}`,
        title: parsed.title || `AI Synthesis: ${prompt.slice(0, 28)}`,
        description: parsed.description || prompt.trim(),
        categorySlug: categorySlug || 'ai-generated-worlds',
        resolution: resolution || '3840x2160',
        format: 'WebM',
        durationSeconds: Number(durationSeconds) || 10,
        fileSizeMb: 42.0,
        isPremium: false,
        isFeatured: true,
        isTrending: true,
        isPublished: true,
        downloadsCount: 1,
        createdAt: new Date().toISOString(),
        style: style || 'Cinematic',
        previewImageUrl: INITIAL_WALLPAPERS[2].previewImageUrl,
        shaderPreset: chosenPreset as any,
        accentColor: parsed.accentColor?.startsWith('#') ? parsed.accentColor : '#38bdf8',
        sha256Checksum: crypto.createHash('sha256').update(prompt + Date.now()).digest('hex')
      };

      db.wallpapers.unshift(newWallpaper);
      saveDatabase(db);
      res.status(201).json({ wallpaper: newWallpaper });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Gemini API synthesis failed. Verify your GEMINI_API_KEY in Settings > Secrets.'
      });
    }
  });

  // Admin RBAC Middleware
  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Administrator privileges required.' });
      return;
    }
    next();
  }

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const totalDownloads = db.wallpapers.reduce((acc, w) => acc + w.downloadsCount, 0);
    res.json({
      stats: {
        totalWallpapers: db.wallpapers.length,
        publishedWallpapers: db.wallpapers.filter((w) => w.isPublished).length,
        premiumWallpapers: db.wallpapers.filter((w) => w.isPremium).length,
        totalUsers: db.users.length,
        premiumUsers: db.users.filter((u) => u.isPremium).length,
        totalDownloads,
        openReports: db.reports.filter((r) => r.status === 'OPEN').length
      },
      users: db.users.map(sanitizeUser),
      reports: db.reports,
      auditLogs: db.auditLogs.slice(0, 25)
    });
  });

  app.post('/api/admin/wallpapers', requireAdmin, (req, res) => {
    const user = getAuthenticatedUser(req)!;
    const body = req.body ?? {};
    if (!body.title || !body.categorySlug) {
      res.status(400).json({ error: 'Title and category are required.' });
      return;
    }

    const created: WallpaperItem = {
      id: `luma-wp-${crypto.randomBytes(4).toString('hex')}`,
      title: String(body.title).trim(),
      description: String(body.description || 'Curated high-refresh live wallpaper loop.').trim(),
      categorySlug: String(body.categorySlug),
      resolution: body.resolution || '3840x2160',
      format: body.format || 'MP4',
      durationSeconds: Number(body.durationSeconds) || 10,
      fileSizeMb: Number(body.fileSizeMb) || 45.0,
      isPremium: Boolean(body.isPremium),
      isFeatured: Boolean(body.isFeatured),
      isTrending: Boolean(body.isTrending),
      isPublished: body.isPublished !== false,
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
      style: body.style || 'Cinematic',
      previewImageUrl: body.previewImageUrl || INITIAL_WALLPAPERS[0].previewImageUrl,
      shaderPreset: body.shaderPreset || 'cyberpunk-rain',
      accentColor: body.accentColor || '#0ea5e9',
      sha256Checksum: crypto.createHash('sha256').update(String(body.title) + Date.now()).digest('hex')
    };

    db.wallpapers.unshift(created);
    db.auditLogs.unshift({
      id: `aud-${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: user.email,
      action: 'UPLOAD_WALLPAPER',
      targetId: created.id,
      timestamp: new Date().toISOString()
    });
    saveDatabase(db);
    res.status(201).json({ wallpaper: created });
  });

  app.patch('/api/admin/wallpapers/:id', requireAdmin, (req, res) => {
    const user = getAuthenticatedUser(req)!;
    const wp = db.wallpapers.find((w) => w.id === req.params.id);
    if (!wp) {
      res.status(404).json({ error: 'Wallpaper not found.' });
      return;
    }
    const updates = req.body ?? {};
    if (typeof updates.title === 'string') wp.title = updates.title.trim();
    if (typeof updates.description === 'string') wp.description = updates.description.trim();
    if (typeof updates.categorySlug === 'string') wp.categorySlug = updates.categorySlug;
    if (typeof updates.resolution === 'string') wp.resolution = updates.resolution as any;
    if (typeof updates.isPremium === 'boolean') wp.isPremium = updates.isPremium;
    if (typeof updates.isFeatured === 'boolean') wp.isFeatured = updates.isFeatured;
    if (typeof updates.isPublished === 'boolean') wp.isPublished = updates.isPublished;

    db.auditLogs.unshift({
      id: `aud-${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: user.email,
      action: 'UPDATE_WALLPAPER',
      targetId: wp.id,
      timestamp: new Date().toISOString()
    });
    saveDatabase(db);
    res.json({ wallpaper: wp });
  });

  app.delete('/api/admin/wallpapers/:id', requireAdmin, (req, res) => {
    const user = getAuthenticatedUser(req)!;
    const idx = db.wallpapers.findIndex((w) => w.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Wallpaper not found.' });
      return;
    }
    const [removed] = db.wallpapers.splice(idx, 1);
    db.auditLogs.unshift({
      id: `aud-${crypto.randomBytes(4).toString('hex')}`,
      actorEmail: user.email,
      action: 'DELETE_WALLPAPER',
      targetId: removed.id,
      timestamp: new Date().toISOString()
    });
    saveDatabase(db);
    res.json({ deletedId: removed.id });
  });

  app.patch('/api/admin/reports/:id', requireAdmin, (req, res) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    if (req.body?.status) {
      report.status = req.body.status;
    }
    saveDatabase(db);
    res.json({ report });
  });

  // Endpoint to browse actual native source files generated under /LUMA
  app.get('/api/architecture/files', (_req, res) => {
    const lumaRoot = path.resolve(process.cwd(), 'LUMA');
    const filesList: { relativePath: string; language: string; sizeBytes: number; content: string }[] = [];

    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');
          const ext = path.extname(entry.name).toLowerCase();
          const langMap: Record<string, string> = {
            '.cs': 'csharp',
            '.kt': 'kotlin',
            '.xml': 'xml',
            '.prisma': 'prisma',
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.json': 'json',
            '.md': 'markdown',
            '.iss': 'ini'
          };
          filesList.push({
            relativePath: rel,
            language: langMap[ext] || 'plaintext',
            sizeBytes: Buffer.byteLength(content, 'utf8'),
            content
          });
        }
      }
    }

    walk(lumaRoot);
    res.json({ files: filesList });
  });

  // Mount Vite in development or static dist in production
  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LUMA Platform Server listening on http://localhost:${PORT}`);
  });
}

startServer();
