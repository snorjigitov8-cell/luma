/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Home,
  Compass,
  Grid,
  Heart,
  Film,
  Crown,
  Settings,
  Shield,
  Code2,
  X,
  Check,
  Monitor,
  Download
} from 'lucide-react';
import {
  WALLPAPER_CATEGORIES,
  getCategoryName,
  t,
  type LanguageCode
} from './shared/localization';
import {
  canEnqueueDownload,
  filterAndSortWallpapers,
  verifySubscriptionEntitlement,
  type DownloadTask,
  type LumaSettings,
  type ResolutionOption,
  type SystemRuntimeState,
  type UserProfile,
  type WallpaperItem
} from './shared/lumaLogic';
import { INITIAL_WALLPAPERS } from './shared/seedCatalog';
import { WallpaperCard } from './components/WallpaperCard';
import { PlatformSimulatorPanel } from './components/PlatformSimulatorModal';
import { MyWallpapersStudio } from './components/MyWallpapersStudio';
import { PremiumAndSettingsView } from './components/PremiumAndSettingsView';
import { AdminAndSourceView } from './components/AdminAndSourceView';
import { LiveWallpaperCanvas } from './components/LiveWallpaperCanvas';

type NavSection =
  | 'HOME'
  | 'EXPLORE'
  | 'CATEGORIES'
  | 'FAVORITES'
  | 'MY_WALLPAPERS'
  | 'PREMIUM'
  | 'SETTINGS'
  | 'ADMIN'
  | 'ARCHITECTURE';

const SETTINGS_STORAGE_KEY = 'luma_persisted_settings_v1';
const FAVORITES_STORAGE_KEY = 'luma_persisted_favorites_v1';
const RECENT_STORAGE_KEY = 'luma_persisted_recent_v1';
const PERSONAL_STORAGE_KEY = 'luma_persisted_personal_v1';

const DEFAULT_SETTINGS: LumaSettings = {
  general: {
    language: 'en',
    theme: 'dark',
    startWithWindows: true,
    minimizeToTray: true
  },
  wallpaper: {
    loopSeamless: true,
    playbackSpeed: 1.0,
    videoQuality: '4K',
    monitorMode: 'per-monitor',
    displayMode: 'Fill'
  },
  performance: {
    batterySavingMode: true,
    pauseDuringGaming: true,
    pauseWhenFullscreen: true,
    pauseWhenOnBattery: false,
    hardwareAcceleration: true,
    reduceOnHeavyLoad: true
  },
  audio: {
    enableAudio: true,
    volume: 70,
    mute: true
  },
  storage: {
    cacheLocation: 'C:\\Users\\Public\\AppData\\Local\\LUMA\\Cache',
    downloadLocation: 'C:\\Users\\Public\\Videos\\LUMA',
    maxCacheMb: 8192
  }
};

export default function App() {
  // Navigation & Persisted Settings
  const [activeNav, setActiveNav] = useState<NavSection>('HOME');
  const [settings, setSettings] = useState<LumaSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const lang: LanguageCode = settings.general.language;

  // Sync Dark / Light theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.general.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Catalog, Personal Wallpapers, Favorites, Recently Applied
  const [catalog, setCatalog] = useState<WallpaperItem[]>(INITIAL_WALLPAPERS);
  const [personalWallpapers, setPersonalWallpapers] = useState<WallpaperItem[]>(() => {
    try {
      const raw = localStorage.getItem(PERSONAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['luma-wp-001', 'luma-wp-002', 'luma-wp-004'];
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['luma-wp-001', 'luma-wp-002'];
  });

  // Active Monitor Assignments & Engine Runtime State
  const allWallpapers = useMemo(
    () => [...personalWallpapers, ...catalog],
    [personalWallpapers, catalog]
  );

  const [monitor1Id, setMonitor1Id] = useState<string>('luma-wp-001');
  const [monitor2Id, setMonitor2Id] = useState<string>('luma-wp-002');
  const [androidId, setAndroidId] = useState<string>('luma-wp-004');
  const [activeTargetMonitor, setActiveTargetMonitor] = useState<1 | 2 | 'android'>(1);

  const [runtime, setRuntime] = useState<SystemRuntimeState>({
    platform: 'windows',
    isFullscreenGameActive: false,
    isFullscreenAppActive: false,
    isOnBattery: false,
    isSystemLocked: false,
    isWallpaperVisible: true,
    heavyApplicationsRunning: false
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedResolution, setSelectedResolution] = useState<ResolutionOption | 'ALL'>('ALL');
  const [selectedStyle, setSelectedStyle] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'size_asc' | 'size_desc'>('popular');

  // Downloads Manager Queue
  const [downloads, setDownloads] = useState<DownloadTask[]>([
    {
      id: 'dl-initial-1',
      wallpaperId: 'luma-wp-001',
      title: 'Neo-Kyoto Rain Sector 09',
      fileSizeMb: 48.4,
      downloadedMb: 48.4,
      progressPercent: 100,
      status: 'COMPLETED',
      sha256Expected: INITIAL_WALLPAPERS[0].sha256Checksum,
      sha256Verified: true,
      startedAt: '2026-11-09T08:00:00Z',
      completedAt: '2026-11-09T08:00:12Z'
    }
  ]);

  // Auth & AI Capabilities
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'info' | 'warning'; message: string } | null>(null);
  const [previewModalWallpaper, setPreviewModalWallpaper] = useState<WallpaperItem | null>(null);

  const fetchServerCatalog = () => {
    fetch('/api/wallpapers?includeUnpublished=true', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.wallpapers) && data.wallpapers.length > 0) {
          setCatalog(data.wallpapers);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiConfigured(Boolean(d.aiStudioConfigured)))
      .catch(() => {});
    fetchServerCatalog();
  }, [authToken]);

  // Simulate active download progress ticks
  useEffect(() => {
    const active = downloads.some((d) => d.status === 'DOWNLOADING');
    if (!active) return;

    const timer = setInterval(() => {
      setDownloads((prev) =>
        prev.map((task) => {
          if (task.status !== 'DOWNLOADING') return task;
          const nextMb = Math.min(task.fileSizeMb, Number((task.downloadedMb + task.fileSizeMb * 0.35).toFixed(1)));
          const pct = Math.min(100, Math.round((nextMb / task.fileSizeMb) * 100));
          const done = pct >= 100;
          return {
            ...task,
            downloadedMb: nextMb,
            progressPercent: pct,
            status: done ? 'COMPLETED' : 'DOWNLOADING',
            sha256Verified: done,
            completedAt: done ? new Date().toISOString() : undefined
          };
        })
      );
    }, 450);

    return () => clearInterval(timer);
  }, [downloads]);

  const monitor1Wallpaper = useMemo(
    () => allWallpapers.find((w) => w.id === monitor1Id) || allWallpapers[0],
    [allWallpapers, monitor1Id]
  );
  const monitor2Wallpaper = useMemo(
    () => allWallpapers.find((w) => w.id === monitor2Id) || allWallpapers[1] || allWallpapers[0],
    [allWallpapers, monitor2Id]
  );
  const androidWallpaper = useMemo(
    () => allWallpapers.find((w) => w.id === androidId) || allWallpapers[0],
    [allWallpapers, androidId]
  );

  // Handlers
  const handleApplyWallpaper = (wp: WallpaperItem) => {
    const entitlement = verifySubscriptionEntitlement(user, wp);
    if (!entitlement.allowed) {
      setStatusBanner({
        type: 'warning',
        message: `${wp.title}: ${entitlement.reason} Redirecting to LUMA Premium options.`
      });
      setActiveNav('PREMIUM');
      return;
    }

    if (runtime.platform === 'android' || activeTargetMonitor === 'android') {
      setAndroidId(wp.id);
    } else if (activeTargetMonitor === 2 && settings.wallpaper.monitorMode === 'per-monitor') {
      setMonitor2Id(wp.id);
    } else {
      setMonitor1Id(wp.id);
    }

    const updatedRecent = [wp.id, ...recentIds.filter((id) => id !== wp.id)].slice(0, 6);
    setRecentIds(updatedRecent);
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updatedRecent));
    } catch {}

    setStatusBanner({
      type: 'info',
      message: `Applied "${wp.title}" (${wp.resolution}) to ${
        runtime.platform === 'android' ? 'Android Home & Lock Screen' : `Windows Display ${activeTargetMonitor}`
      }.`
    });
  };

  const handleToggleFavorite = (wp: WallpaperItem) => {
    const exists = favorites.includes(wp.id);
    const next = exists ? favorites.filter((id) => id !== wp.id) : [wp.id, ...favorites];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {}

    if (authToken) {
      fetch('/api/auth/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ wallpaperId: wp.id })
      }).catch(() => {});
    }
  };

  const handleDownloadWallpaper = async (wp: WallpaperItem) => {
    const entitlement = verifySubscriptionEntitlement(user, wp);
    if (!entitlement.allowed) {
      setStatusBanner({
        type: 'warning',
        message: `${wp.title}: ${entitlement.reason}`
      });
      setActiveNav('PREMIUM');
      return;
    }

    const usedMb = downloads.reduce((acc, d) => acc + d.downloadedMb, 0);
    const availableMb = Math.max(0, settings.storage.maxCacheMb - usedMb);
    const check = canEnqueueDownload(downloads, wp, availableMb);

    if (!check.canStart) {
      setStatusBanner({ type: 'warning', message: check.message });
      return;
    }

    const newTask: DownloadTask = {
      id: `dl-${Date.now()}`,
      wallpaperId: wp.id,
      title: wp.title,
      fileSizeMb: wp.fileSizeMb,
      downloadedMb: 0,
      progressPercent: 0,
      status: 'DOWNLOADING',
      sha256Expected: wp.sha256Checksum,
      sha256Verified: false,
      startedAt: new Date().toISOString()
    };

    setDownloads((prev) => [newTask, ...prev]);
    setStatusBanner({
      type: 'info',
      message: `Downloading "${wp.title}" (${wp.fileSizeMb.toFixed(1)} MB) with SHA-256 verification...`
    });

    fetch(`/api/wallpapers/${wp.id}/download`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
      .then(() => fetchServerCatalog())
      .catch(() => {});
  };

  const handleSavePersonalWallpaper = (wp: WallpaperItem) => {
    const next = [wp, ...personalWallpapers];
    setPersonalWallpapers(next);
    try {
      localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleQuickSwitchAccount = (role: 'USER' | 'ADMIN') => {
    const token = role === 'ADMIN' ? 'demo-admin-token' : 'demo-user-token';
    setAuthToken(token);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          if (Array.isArray(d.user.favorites)) setFavorites(d.user.favorites);
          setStatusBanner({
            type: 'info',
            message: `Signed in as ${d.user.displayName} (${d.user.role} · ${d.user.isPremium ? 'LUMA Premium' : 'Free'}).`
          });
        }
      })
      .catch(() => {});
  };

  // Filtered Wallpapers for Explore / Home search
  const filteredWallpapers = useMemo(
    () =>
      filterAndSortWallpapers(allWallpapers, {
        search: searchQuery,
        categorySlug: selectedCategory,
        resolution: selectedResolution,
        style: selectedStyle,
        tier: selectedTier,
        sortBy
      }),
    [allWallpapers, searchQuery, selectedCategory, selectedResolution, selectedStyle, selectedTier, sortBy]
  );

  const featuredList = useMemo(() => allWallpapers.filter((w) => w.isFeatured && w.isPublished), [allWallpapers]);
  const trendingList = useMemo(() => allWallpapers.filter((w) => w.isTrending && w.isPublished), [allWallpapers]);
  const newReleasesList = useMemo(
    () => filterAndSortWallpapers(allWallpapers, { sortBy: 'newest' }).slice(0, 6),
    [allWallpapers]
  );
  const premiumList = useMemo(() => allWallpapers.filter((w) => w.isPremium && w.isPublished), [allWallpapers]);
  const recommendedList = useMemo(
    () => allWallpapers.filter((w) => w.resolution === '3840x2160' && w.isPublished).slice(0, 6),
    [allWallpapers]
  );
  const recentWallpapers = useMemo(
    () =>
      recentIds
        .map((id) => allWallpapers.find((w) => w.id === id))
        .filter((w): w is WallpaperItem => Boolean(w)),
    [recentIds, allWallpapers]
  );

  const isWallpaperApplied = (id: string) =>
    monitor1Id === id || monitor2Id === id || androidId === id;

  const renderCardGrid = (items: WallpaperItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((wp) => {
        const dlTask = downloads.find((d) => d.wallpaperId === wp.id);
        return (
          <WallpaperCard
            key={wp.id}
            wallpaper={wp}
            lang={lang}
            isApplied={isWallpaperApplied(wp.id)}
            isFavorited={favorites.includes(wp.id)}
            isDownloaded={dlTask?.status === 'COMPLETED'}
            isDownloading={dlTask?.status === 'DOWNLOADING'}
            onApply={handleApplyWallpaper}
            onToggleFavorite={handleToggleFavorite}
            onDownload={handleDownloadWallpaper}
            onPreviewSelect={(w) => setPreviewModalWallpaper(w)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('HOME');
          }}
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0"
        >
          LUMA
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary Top Navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setActiveNav('HOME')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'HOME' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            {t(lang, 'nav_home')}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('EXPLORE')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'EXPLORE' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            {t(lang, 'nav_explore')}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('CATEGORIES')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'CATEGORIES' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            {t(lang, 'nav_categories')}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('MY_WALLPAPERS')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'MY_WALLPAPERS' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            {t(lang, 'nav_my_wallpapers')}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('ARCHITECTURE')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'ARCHITECTURE' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
            }`}
          >
            {t(lang, 'nav_architecture')}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveNav('MY_WALLPAPERS')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
          >
            {t(lang, 'btn_import_video')}
          </button>
        </div>
      </header>

      {/* Main Workspace Container: Sidebar + Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Left Sidebar Navigation (All 7 Primary Views + Admin & Native Source) */}
        <aside
          aria-label="Workspace Sidebar Navigation"
          className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 flex flex-col justify-between gap-6"
        >
          <div className="space-y-6">
            {/* Primary Navigation */}
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {(
                [
                  { id: 'HOME', label: t(lang, 'nav_home'), icon: Home },
                  { id: 'EXPLORE', label: t(lang, 'nav_explore'), icon: Compass },
                  { id: 'CATEGORIES', label: t(lang, 'nav_categories'), icon: Grid },
                  { id: 'FAVORITES', label: `${t(lang, 'nav_favorites')} (${favorites.length})`, icon: Heart },
                  { id: 'MY_WALLPAPERS', label: t(lang, 'nav_my_wallpapers'), icon: Film },
                  { id: 'PREMIUM', label: t(lang, 'nav_premium'), icon: Crown },
                  { id: 'SETTINGS', label: t(lang, 'nav_settings'), icon: Settings },
                  { id: 'ADMIN', label: t(lang, 'nav_admin'), icon: Shield },
                  { id: 'ARCHITECTURE', label: t(lang, 'nav_architecture'), icon: Code2 }
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Multilingual Switcher (English, Uzbek, Russian) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                Language / Til / Язык
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    { code: 'en', label: 'EN' },
                    { code: 'uz', label: 'UZ' },
                    { code: 'ru', label: 'RU' }
                  ] as const
                ).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    aria-label={`Switch language to ${l.label}`}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, language: l.code }
                      }))
                    }
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      lang === l.code
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Account Summary Box in Sidebar */}
          <div className="hidden lg:block p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-500">{user ? user.displayName : 'Guest Mode'}</span>
              <span className={user?.isPremium ? 'text-amber-500 font-semibold' : 'text-sky-500'}>
                {user?.isPremium ? 'PRO' : 'FREE'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSwitchAccount('ADMIN')}
                className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Switch to Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('SETTINGS')}
                className="py-1.5 px-2 text-[11px] font-medium rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                Account
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 space-y-8 min-w-0">
          {/* Global Search & Quick Filter Bar */}
          {(activeNav === 'HOME' || activeNav === 'EXPLORE') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeNav === 'HOME' && e.target.value.trim().length > 0) {
                      setActiveNav('EXPLORE');
                    }
                  }}
                  placeholder={t(lang, 'search_placeholder')}
                  aria-label={t(lang, 'search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (activeNav === 'HOME' && e.target.value !== 'ALL') setActiveNav('EXPLORE');
                  }}
                  aria-label="Filter by Category"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">{t(lang, 'filter_all_categories')}</option>
                  {WALLPAPER_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.names[lang]}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedResolution}
                  onChange={(e) => {
                    setSelectedResolution(e.target.value as any);
                    if (activeNav === 'HOME' && e.target.value !== 'ALL') setActiveNav('EXPLORE');
                  }}
                  aria-label="Filter by Resolution"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono"
                >
                  <option value="ALL">{t(lang, 'filter_all_resolutions')}</option>
                  <option value="1920x1080">1920 × 1080 (FHD)</option>
                  <option value="2560x1440">2560 × 1440 (QHD)</option>
                  <option value="3840x2160">3840 × 2160 (4K)</option>
                  <option value="7680x4320">7680 × 4320 (8K)</option>
                </select>

                <select
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value as any);
                    if (activeNav === 'HOME' && e.target.value !== 'ALL') setActiveNav('EXPLORE');
                  }}
                  aria-label="Filter by Tier"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">{t(lang, 'filter_all_tiers')}</option>
                  <option value="FREE">{t(lang, 'filter_free_only')}</option>
                  <option value="PREMIUM">{t(lang, 'filter_premium_only')}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort Wallpapers"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="popular">{t(lang, 'sort_popular')}</option>
                  <option value="newest">{t(lang, 'sort_newest')}</option>
                  <option value="size_asc">{t(lang, 'sort_size_asc')}</option>
                  <option value="size_desc">{t(lang, 'sort_size_desc')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Feedback Banner */}
          {statusBanner && (
            <div
              role="status"
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                statusBanner.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
              }`}
            >
              <span>{statusBanner.message}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                aria-label="Dismiss notification"
                className="p-1 hover:opacity-75"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ==================== HOME SCREEN ==================== */}
          {activeNav === 'HOME' && (
            <div className="space-y-10">
              {/* Interactive Multi-Platform Live Engine Simulator (Windows WorkerW + Android ExoPlayer) */}
              <PlatformSimulatorPanel
                lang={lang}
                settings={settings}
                runtime={runtime}
                onUpdateRuntime={(patch) => setRuntime((prev) => ({ ...prev, ...patch }))}
                onUpdateSettings={setSettings}
                monitor1Wallpaper={monitor1Wallpaper}
                monitor2Wallpaper={monitor2Wallpaper}
                androidWallpaper={androidWallpaper}
                activeTargetMonitor={activeTargetMonitor}
                onSelectTargetMonitor={setActiveTargetMonitor}
              />

              {/* Category Navigation Strip (All 18 Categories) */}
              <section aria-label={t(lang, 'section_categories')}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {t(lang, 'section_categories')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveNav('CATEGORIES')}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    View All 18 Categories
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {WALLPAPER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setActiveNav('EXPLORE');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-500 transition-colors whitespace-nowrap shrink-0"
                    >
                      {cat.names[lang]}
                    </button>
                  ))}
                </div>
              </section>

              {/* 1. Featured Wallpapers */}
              <section aria-label={t(lang, 'section_featured')}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  01. {t(lang, 'section_featured')}
                </h2>
                {renderCardGrid(featuredList)}
              </section>

              {/* 2. Trending Wallpapers */}
              <section aria-label={t(lang, 'section_trending')}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  02. {t(lang, 'section_trending')}
                </h2>
                {renderCardGrid(trendingList.slice(0, 6))}
              </section>

              {/* 3. New Wallpapers */}
              <section aria-label={t(lang, 'section_new')}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  03. {t(lang, 'section_new')}
                </h2>
                {renderCardGrid(newReleasesList)}
              </section>

              {/* 4. Premium Collection */}
              <section aria-label={t(lang, 'section_premium')}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    04. {t(lang, 'section_premium')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveNav('PREMIUM')}
                    className="text-xs font-medium text-amber-500 hover:underline"
                  >
                    Manage Premium Entitlement
                  </button>
                </div>
                {renderCardGrid(premiumList)}
              </section>

              {/* 5. Recommended Wallpapers */}
              <section aria-label={t(lang, 'section_recommended')}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  05. {t(lang, 'section_recommended')}
                </h2>
                {renderCardGrid(recommendedList)}
              </section>

              {/* 6. Recently Used Wallpapers */}
              <section aria-label={t(lang, 'section_recent')}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  06. {t(lang, 'section_recent')}
                </h2>
                {renderCardGrid(recentWallpapers)}
              </section>
            </div>
          )}

          {/* ==================== EXPLORE SCREEN ==================== */}
          {activeNav === 'EXPLORE' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t(lang, 'nav_explore')} ({filteredWallpapers.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filter by category, target resolution (1080p–8K), visual style, or Free/Premium entitlement.
                  </p>
                </div>

                {/* Style Filter Tabs */}
                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {['ALL', 'Cyberpunk', 'Anime', 'Fantasy', 'Space', 'Nature', '3D', 'Cinematic'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStyle(st)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedStyle === st
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL' ? 'All Styles' : st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWallpapers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No wallpapers matched your current filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedResolution('ALL');
                      setSelectedStyle('ALL');
                      setSelectedTier('ALL');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                renderCardGrid(filteredWallpapers)
              )}
            </div>
          )}

          {/* ==================== CATEGORIES SCREEN (ALL 18 CATEGORIES) ==================== */}
          {activeNav === 'CATEGORIES' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t(lang, 'section_categories')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select any of the 18 categories below to filter the live wallpaper catalog.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {WALLPAPER_CATEGORIES.map((cat, index) => {
                  const count = allWallpapers.filter((w) => w.categorySlug === cat.slug && w.isPublished).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setActiveNav('EXPLORE');
                      }}
                      className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 tabular-nums">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <span>
                            {count} {count === 1 ? 'Wallpaper' : 'Wallpapers'}
                            {cat.isPremiumDefault ? ' · Pro Collection' : ''}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {cat.names[lang]}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {cat.descriptions[lang]}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        Explore Category →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== FAVORITES SCREEN ==================== */}
          {activeNav === 'FAVORITES' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t(lang, 'nav_favorites')} ({favorites.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your saved collection for instant desktop or mobile application.
                </p>
              </div>
              {favorites.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You have not favorited any wallpapers yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNav('EXPLORE')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                renderCardGrid(allWallpapers.filter((w) => favorites.includes(w.id)))
              )}
            </div>
          )}

          {/* ==================== MY WALLPAPERS, DOWNLOAD MANAGER & AI STUDIO ==================== */}
          {activeNav === 'MY_WALLPAPERS' && (
            <MyWallpapersStudio
              lang={lang}
              personalWallpapers={personalWallpapers}
              onSavePersonalWallpaper={handleSavePersonalWallpaper}
              onApplyWallpaper={handleApplyWallpaper}
              downloads={downloads}
              onPauseResumeDownload={(taskId) =>
                setDownloads((prev) =>
                  prev.map((d) =>
                    d.id === taskId
                      ? { ...d, status: d.status === 'DOWNLOADING' ? 'PAUSED' : 'DOWNLOADING' }
                      : d
                  )
                )
              }
              onCancelDownload={(taskId) =>
                setDownloads((prev) => prev.filter((d) => d.id !== taskId))
              }
              onRetryDownload={(taskId) =>
                setDownloads((prev) =>
                  prev.map((d) =>
                    d.id === taskId ? { ...d, status: 'DOWNLOADING', downloadedMb: 0, progressPercent: 0 } : d
                  )
                )
              }
              onClearCompletedDownloads={() =>
                setDownloads((prev) => prev.filter((d) => d.status !== 'COMPLETED'))
              }
              aiConfigured={aiConfigured}
              onAiWallpaperCreated={(wp) => {
                setCatalog((prev) => [wp, ...prev]);
                handleApplyWallpaper(wp);
              }}
            />
          )}

          {/* ==================== PREMIUM & SETTINGS SCREENS ==================== */}
          {(activeNav === 'PREMIUM' || activeNav === 'SETTINGS') && (
            <PremiumAndSettingsView
              mode={activeNav === 'PREMIUM' ? 'premium' : 'settings'}
              lang={lang}
              settings={settings}
              onUpdateSettings={setSettings}
              user={user}
              onActivateSubscription={async (plan) => {
                if (!authToken) {
                  handleQuickSwitchAccount('ADMIN');
                  return;
                }
                const res = await fetch('/api/subscriptions/activate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                  },
                  body: JSON.stringify({ plan })
                });
                const data = await res.json();
                if (data.user) setUser(data.user);
              }}
              onRestorePurchases={async () => {
                if (authToken) {
                  const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${authToken}` }
                  });
                  const d = await res.json();
                  if (d.user) setUser(d.user);
                }
              }}
              onSignIn={async (email, password) => {
                const res = await fetch('/api/auth/signin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                const d = await res.json();
                if (!res.ok) return d.error || 'Sign in failed';
                setAuthToken(d.token);
                setUser(d.user);
                return null;
              }}
              onSignUp={async (email, password, displayName) => {
                const res = await fetch('/api/auth/signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password, displayName })
                });
                const d = await res.json();
                if (!res.ok) return d.error || 'Sign up failed';
                setAuthToken(d.token);
                setUser(d.user);
                return null;
              }}
              onResetPassword={async (email, newPassword) => {
                const res = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, newPassword })
                });
                const d = await res.json();
                if (!res.ok) return d.error || 'Password reset failed';
                return null;
              }}
              onSignOut={() => {
                setAuthToken(null);
                setUser(null);
              }}
              onQuickSwitchAccount={handleQuickSwitchAccount}
              cachedBytesMb={downloads.reduce((acc, d) => acc + d.downloadedMb, 0)}
              onClearCache={() => setDownloads([])}
            />
          )}

          {/* ==================== ADMIN & NATIVE SOURCE SCREENS ==================== */}
          {(activeNav === 'ADMIN' || activeNav === 'ARCHITECTURE') && (
            <AdminAndSourceView
              mode={activeNav === 'ADMIN' ? 'admin' : 'architecture'}
              user={user}
              authToken={authToken}
              wallpapers={catalog}
              onRefreshWallpapers={fetchServerCatalog}
              onQuickSwitchAdmin={() => handleQuickSwitchAccount('ADMIN')}
            />
          )}
        </main>
      </div>

      {/* Interactive High-Resolution Wallpaper Preview Modal */}
      {previewModalWallpaper && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewModalWallpaper.title}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl">
            <div className="relative aspect-video bg-slate-950">
              <LiveWallpaperCanvas
                imageUrl={previewModalWallpaper.previewImageUrl}
                videoUrl={previewModalWallpaper.videoUrl}
                shaderPreset={previewModalWallpaper.shaderPreset}
                accentColor={previewModalWallpaper.accentColor}
                isPlaying={true}
                interactive={true}
                title={previewModalWallpaper.title}
                className="w-full h-full"
              />
              <button
                type="button"
                onClick={() => setPreviewModalWallpaper(null)}
                aria-label="Close Live Preview"
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/70 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">
                  {getCategoryName(previewModalWallpaper.categorySlug, lang)} · {previewModalWallpaper.resolution} ·{' '}
                  {previewModalWallpaper.durationSeconds}s · {previewModalWallpaper.fileSizeMb} MB · SHA-256:{' '}
                  {previewModalWallpaper.sha256Checksum.slice(0, 12)}...
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {previewModalWallpaper.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {previewModalWallpaper.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadWallpaper(previewModalWallpaper);
                    setPreviewModalWallpaper(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  <span>{t(lang, 'btn_download')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyWallpaper(previewModalWallpaper);
                    setPreviewModalWallpaper(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg"
                >
                  {isWallpaperApplied(previewModalWallpaper.id) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                  <span>{t(lang, 'btn_apply')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
