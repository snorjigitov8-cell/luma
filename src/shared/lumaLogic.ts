import { WALLPAPER_CATEGORIES } from './localization';

export type ResolutionOption = '1920x1080' | '2560x1440' | '3840x2160' | '7680x4320';
export type WallpaperFormat = 'MP4' | 'WebM' | 'GIF' | 'JPG' | 'PNG' | 'WebP';
export type DisplayScalingMode = 'Fill' | 'Fit' | 'Stretch' | 'Center' | 'Crop';
export type VisualShaderPreset =
  | 'cyberpunk-rain'
  | 'anime-sky-islands'
  | 'cosmic-nebula'
  | 'magical-forest'
  | 'dragon-caldera'
  | 'ocean-bioluminescence'
  | 'solarpunk-citadel'
  | 'abstract-silk'
  | 'interactive-matrix'
  | 'dark-eclipse';

export interface WallpaperItem {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  resolution: ResolutionOption;
  format: WallpaperFormat;
  durationSeconds: number;
  fileSizeMb: number;
  isPremium: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isPublished: boolean;
  downloadsCount: number;
  createdAt: string;
  style: 'Anime' | 'Fantasy' | 'Realistic' | 'Cyberpunk' | 'Cinematic' | '3D' | 'Space' | 'Nature';
  previewImageUrl: string;
  videoUrl?: string;
  shaderPreset: VisualShaderPreset;
  accentColor: string;
  sha256Checksum: string;
  isPersonalUpload?: boolean;
  trimStart?: number;
  trimEnd?: number;
  playbackSpeed?: number;
  displayMode?: DisplayScalingMode;
  muted?: boolean;
}

export interface WallpaperFilterQuery {
  search?: string;
  categorySlug?: string;
  resolution?: ResolutionOption | 'ALL';
  style?: string | 'ALL';
  tier?: 'ALL' | 'FREE' | 'PREMIUM';
  sortBy?: 'popular' | 'newest' | 'size_asc' | 'size_desc';
  onlyPublished?: boolean;
}

export interface LumaSettings {
  general: {
    language: 'en' | 'uz' | 'ru';
    theme: 'dark' | 'light';
    startWithWindows: boolean;
    minimizeToTray: boolean;
  };
  wallpaper: {
    loopSeamless: boolean;
    playbackSpeed: number;
    videoQuality: '1080p' | '1440p' | '4K' | '8K';
    monitorMode: 'per-monitor' | 'span-all' | 'clone';
    displayMode: DisplayScalingMode;
  };
  performance: {
    batterySavingMode: boolean;
    pauseDuringGaming: boolean;
    pauseWhenFullscreen: boolean;
    pauseWhenOnBattery: boolean;
    hardwareAcceleration: boolean;
    reduceOnHeavyLoad: boolean;
  };
  audio: {
    enableAudio: boolean;
    volume: number;
    mute: boolean;
  };
  storage: {
    cacheLocation: string;
    downloadLocation: string;
    maxCacheMb: number;
  };
}

export interface SystemRuntimeState {
  platform: 'windows' | 'android';
  isFullscreenGameActive: boolean;
  isFullscreenAppActive: boolean;
  isOnBattery: boolean;
  isSystemLocked: boolean;
  isWallpaperVisible: boolean;
  heavyApplicationsRunning: boolean;
}

export interface EngineEvaluationResult {
  playbackStatus:
    | 'PLAYING_OPTIMAL'
    | 'PAUSED_GAMING'
    | 'PAUSED_FULLSCREEN'
    | 'PAUSED_BATTERY'
    | 'STOPPED_LOCKED'
    | 'RELEASED_INVISIBLE'
    | 'THROTTLED_POWER_SAVE';
  targetFps: number;
  decoderPipeline: 'D3D11_MEDIA_FOUNDATION_HW' | 'ANDROID_MEDIACODEC_SURFACE_HW' | 'SOFTWARE_FALLBACK';
  effectiveAudioVolume: number;
  estimatedCpuPercent: number;
  estimatedGpuPercent: number;
  estimatedRamMb: number;
  reason: string;
}

export interface PersonalVideoImportInput {
  fileName: string;
  format: string;
  fileSizeMb: number;
  durationSeconds: number;
  trimStart: number;
  trimEnd: number;
  playbackSpeed: number;
  displayMode: DisplayScalingMode;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  normalizedTrimDuration: number;
}

export interface DownloadTask {
  id: string;
  wallpaperId: string;
  title: string;
  fileSizeMb: number;
  downloadedMb: number;
  progressPercent: number;
  status: 'QUEUED' | 'DOWNLOADING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  sha256Expected: string;
  sha256Verified: boolean;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  isPremium: boolean;
  subscriptionPlan?: 'FREE' | 'MONTHLY' | 'ANNUAL';
  subscriptionExpiresAt?: string;
}

export const SUPPORTED_FORMATS: WallpaperFormat[] = ['MP4', 'WebM', 'GIF', 'JPG', 'PNG', 'WebP'];
export const SUPPORTED_DISPLAY_MODES: DisplayScalingMode[] = ['Fill', 'Fit', 'Stretch', 'Center', 'Crop'];

export function filterAndSortWallpapers(
  wallpapers: WallpaperItem[],
  query: WallpaperFilterQuery
): WallpaperItem[] {
  const searchLower = (query.search ?? '').trim().toLowerCase();
  const onlyPub = query.onlyPublished ?? true;

  const filtered = wallpapers.filter((item) => {
    if (onlyPub && !item.isPublished) return false;
    if (query.categorySlug && query.categorySlug !== 'ALL' && item.categorySlug !== query.categorySlug) {
      return false;
    }
    if (query.resolution && query.resolution !== 'ALL' && item.resolution !== query.resolution) {
      return false;
    }
    if (query.style && query.style !== 'ALL' && item.style !== query.style) {
      return false;
    }
    if (query.tier === 'FREE' && item.isPremium) return false;
    if (query.tier === 'PREMIUM' && !item.isPremium) return false;

    if (searchLower.length > 0) {
      const catInfo = WALLPAPER_CATEGORIES.find((c) => c.slug === item.categorySlug);
      const catNames = catInfo
        ? `${catInfo.names.en} ${catInfo.names.uz} ${catInfo.names.ru}`.toLowerCase()
        : '';
      const haystack = `${item.title} ${item.description} ${item.categorySlug} ${item.style} ${item.resolution} ${catNames}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  const sortMode = query.sortBy ?? 'popular';
  sorted.sort((a, b) => {
    if (sortMode === 'popular') {
      return b.downloadsCount - a.downloadsCount;
    }
    if (sortMode === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortMode === 'size_asc') {
      return a.fileSizeMb - b.fileSizeMb;
    }
    if (sortMode === 'size_desc') {
      return b.fileSizeMb - a.fileSizeMb;
    }
    return 0;
  });

  return sorted;
}

export function evaluateEnginePowerState(
  runtime: SystemRuntimeState,
  settings: LumaSettings
): EngineEvaluationResult {
  const hwDecoder =
    settings.performance.hardwareAcceleration
      ? runtime.platform === 'windows'
        ? 'D3D11_MEDIA_FOUNDATION_HW'
        : 'ANDROID_MEDIACODEC_SURFACE_HW'
      : 'SOFTWARE_FALLBACK';

  const baseVolume =
    !settings.audio.enableAudio || settings.audio.mute
      ? 0
      : Math.max(0, Math.min(100, settings.audio.volume));

  // 1. OS Locked -> Stop rendering immediately on both Windows and Android
  if (runtime.isSystemLocked) {
    return {
      playbackStatus: 'STOPPED_LOCKED',
      targetFps: 0,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: 0,
      estimatedCpuPercent: 0.1,
      estimatedGpuPercent: 0.0,
      estimatedRamMb: 28,
      reason: 'OS session locked (WTS_SESSION_LOCK / KeyguardManager): rendering suspended.'
    };
  }

  // 2. Android or Windows wallpaper surface not visible
  if (!runtime.isWallpaperVisible) {
    return {
      playbackStatus: 'RELEASED_INVISIBLE',
      targetFps: 0,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: 0,
      estimatedCpuPercent: 0.1,
      estimatedGpuPercent: 0.0,
      estimatedRamMb: 24,
      reason: 'Surface visibility false (onVisibilityChanged(false)): decoder surface paused.'
    };
  }

  // 3. Fullscreen Game running
  if (runtime.isFullscreenGameActive && settings.performance.pauseDuringGaming) {
    return {
      playbackStatus: 'PAUSED_GAMING',
      targetFps: 0,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: 0,
      estimatedCpuPercent: 0.2,
      estimatedGpuPercent: 0.0,
      estimatedRamMb: 36,
      reason: 'Fullscreen DirectX/Vulkan game detected (SHQueryUserNotificationState): zero GPU contention mode.'
    };
  }

  // 4. Fullscreen normal application running
  if (runtime.isFullscreenAppActive && settings.performance.pauseWhenFullscreen) {
    return {
      playbackStatus: 'PAUSED_FULLSCREEN',
      targetFps: 0,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: 0,
      estimatedCpuPercent: 0.2,
      estimatedGpuPercent: 0.0,
      estimatedRamMb: 36,
      reason: 'Maximized/Fullscreen foreground window occluding desktop.'
    };
  }

  // 5. On battery power with pauseWhenOnBattery enabled
  if (runtime.isOnBattery && settings.performance.pauseWhenOnBattery) {
    return {
      playbackStatus: 'PAUSED_BATTERY',
      targetFps: 0,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: 0,
      estimatedCpuPercent: 0.2,
      estimatedGpuPercent: 0.0,
      estimatedRamMb: 34,
      reason: 'AC power disconnected: playback paused per battery policy.'
    };
  }

  // 6. Battery saving mode or Heavy background applications running
  if (
    (runtime.isOnBattery && settings.performance.batterySavingMode) ||
    (runtime.heavyApplicationsRunning && settings.performance.reduceOnHeavyLoad)
  ) {
    return {
      playbackStatus: 'THROTTLED_POWER_SAVE',
      targetFps: 24,
      decoderPipeline: hwDecoder,
      effectiveAudioVolume: Math.round(baseVolume * 0.5),
      estimatedCpuPercent: 0.8,
      estimatedGpuPercent: 2.1,
      estimatedRamMb: 64,
      reason: runtime.heavyApplicationsRunning
        ? 'Heavy workstation workload detected: frame pacing throttled to 24 FPS.'
        : 'Battery-saving profile active: frame pacing throttled to 24 FPS.'
    };
  }

  // 7. Optimal hardware-accelerated playback
  const qualityMultiplier =
    settings.wallpaper.videoQuality === '8K'
      ? 2.2
      : settings.wallpaper.videoQuality === '4K'
      ? 1.4
      : settings.wallpaper.videoQuality === '1440p'
      ? 1.1
      : 0.8;

  return {
    playbackStatus: 'PLAYING_OPTIMAL',
    targetFps: 60,
    decoderPipeline: hwDecoder,
    effectiveAudioVolume: baseVolume,
    estimatedCpuPercent: Number((1.1 * qualityMultiplier).toFixed(1)),
    estimatedGpuPercent: Number((3.8 * qualityMultiplier).toFixed(1)),
    estimatedRamMb: Math.round(82 * qualityMultiplier),
    reason: 'Hardware-accelerated zero-copy swapchain loop active.'
  };
}

export function validatePersonalVideoImport(input: PersonalVideoImportInput): ValidationResult {
  const errors: string[] = [];
  const trimmedName = input.fileName.trim();

  if (!trimmedName) {
    errors.push('File name is required.');
  }
  if (trimmedName.includes('..') || trimmedName.includes('/') || trimmedName.includes('\\')) {
    errors.push('Path traversal sequences are prohibited in media file names.');
  }

  const normalizedFormat = SUPPORTED_FORMATS.find(
    (f) => f.toLowerCase() === input.format.trim().toLowerCase()
  );
  if (!normalizedFormat) {
    errors.push(`Unsupported format "${input.format}". Supported: ${SUPPORTED_FORMATS.join(', ')}.`);
  }

  if (input.fileSizeMb <= 0 || input.fileSizeMb > 2048) {
    errors.push('File size must be between 0.1 MB and 2048 MB.');
  }

  if (input.trimStart < 0) {
    errors.push('Trim start time cannot be negative.');
  }
  if (input.trimEnd <= input.trimStart) {
    errors.push('Trim end time must be greater than trim start time.');
  }
  if (input.durationSeconds > 0 && input.trimEnd > input.durationSeconds) {
    errors.push('Trim end time cannot exceed total media duration.');
  }

  if (input.playbackSpeed < 0.25 || input.playbackSpeed > 2.0) {
    errors.push('Playback speed must be between 0.25x and 2.0x.');
  }

  if (!SUPPORTED_DISPLAY_MODES.includes(input.displayMode)) {
    errors.push(`Invalid display scaling mode "${input.displayMode}".`);
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedTrimDuration: Math.max(0, Number((input.trimEnd - input.trimStart).toFixed(1)))
  };
}

export function verifySubscriptionEntitlement(
  user: UserProfile | null,
  wallpaper: Pick<WallpaperItem, 'isPremium'>
): { allowed: boolean; reason: string } {
  if (!wallpaper.isPremium) {
    return { allowed: true, reason: 'Free tier wallpaper accessible to all users including guests.' };
  }
  if (!user) {
    return { allowed: false, reason: 'Authentication and active LUMA Premium subscription required.' };
  }
  if (user.role === 'ADMIN') {
    return { allowed: true, reason: 'Administrator override granted.' };
  }
  if (!user.isPremium) {
    return { allowed: false, reason: 'Active LUMA Premium subscription required.' };
  }
  if (user.subscriptionExpiresAt) {
    const expiry = new Date(user.subscriptionExpiresAt).getTime();
    if (Number.isFinite(expiry) && expiry < Date.now()) {
      return { allowed: false, reason: 'LUMA Premium subscription has expired.' };
    }
  }
  return { allowed: true, reason: 'Valid LUMA Premium entitlement verified.' };
}

export function canEnqueueDownload(
  existingTasks: DownloadTask[],
  wallpaper: WallpaperItem,
  availableStorageMb: number
): { canStart: boolean; code: 'OK' | 'DUPLICATE' | 'INSUFFICIENT_STORAGE'; message: string } {
  const duplicate = existingTasks.find(
    (t) =>
      t.wallpaperId === wallpaper.id &&
      (t.status === 'DOWNLOADING' || t.status === 'QUEUED' || t.status === 'PAUSED' || t.status === 'COMPLETED')
  );
  if (duplicate) {
    return {
      canStart: false,
      code: 'DUPLICATE',
      message: `Wallpaper "${wallpaper.title}" is already ${duplicate.status.toLowerCase()} in the download manager.`
    };
  }
  if (wallpaper.fileSizeMb + 50 > availableStorageMb) {
    return {
      canStart: false,
      code: 'INSUFFICIENT_STORAGE',
      message: `Insufficient free disk space (${availableStorageMb} MB available, ${wallpaper.fileSizeMb} MB + 50 MB buffer required).`
    };
  }
  return {
    canStart: true,
    code: 'OK',
    message: 'Storage and uniqueness verified.'
  };
}
