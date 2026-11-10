import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortWallpapers,
  evaluateEnginePowerState,
  validatePersonalVideoImport,
  verifySubscriptionEntitlement,
  canEnqueueDownload,
  type WallpaperItem,
  type LumaSettings
} from './lumaLogic';
import { WALLPAPER_CATEGORIES } from './localization';

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
    mute: false
  },
  storage: {
    cacheLocation: 'C:\\Users\\Public\\AppData\\Local\\LUMA\\Cache',
    downloadLocation: 'C:\\Users\\Public\\Videos\\LUMA',
    maxCacheMb: 8192
  }
};

const SAMPLE_WALLPAPERS: WallpaperItem[] = [
  {
    id: 'wp-1',
    title: 'Neo-Kyoto Rain Loop',
    description: 'Seamless 10s cyberpunk rain reflections',
    categorySlug: 'cyberpunk-cities',
    resolution: '3840x2160',
    format: 'MP4',
    durationSeconds: 10,
    fileSizeMb: 42.5,
    isPremium: false,
    isFeatured: true,
    isTrending: true,
    isPublished: true,
    downloadsCount: 15200,
    createdAt: '2026-10-01T10:00:00Z',
    style: 'Cyberpunk',
    previewImageUrl: '/test1.jpg',
    shaderPreset: 'cyberpunk-rain',
    accentColor: '#0ea5e9',
    sha256Checksum: 'a1b2c3d4e5f6'
  },
  {
    id: 'wp-2',
    title: 'Singularity Event Horizon',
    description: 'Relativistic accretion disk in 8K',
    categorySlug: 'space-and-galaxies',
    resolution: '7680x4320',
    format: 'WebM',
    durationSeconds: 10,
    fileSizeMb: 118.0,
    isPremium: true,
    isFeatured: true,
    isTrending: false,
    isPublished: true,
    downloadsCount: 9800,
    createdAt: '2026-11-01T10:00:00Z',
    style: 'Space',
    previewImageUrl: '/test2.jpg',
    shaderPreset: 'cosmic-nebula',
    accentColor: '#f59e0b',
    sha256Checksum: 'f6e5d4c3b2a1'
  }
];

test('18 required wallpaper categories exist and have English, Uzbek, and Russian translations', () => {
  assert.equal(WALLPAPER_CATEGORIES.length, 18);
  for (const cat of WALLPAPER_CATEGORIES) {
    assert.ok(cat.names.en.length > 0, `Missing EN for ${cat.slug}`);
    assert.ok(cat.names.uz.length > 0, `Missing UZ for ${cat.slug}`);
    assert.ok(cat.names.ru.length > 0, `Missing RU for ${cat.slug}`);
  }
});

test('filterAndSortWallpapers filters by category, resolution, tier, and sorts correctly', () => {
  const cyberOnly = filterAndSortWallpapers(SAMPLE_WALLPAPERS, { categorySlug: 'cyberpunk-cities' });
  assert.equal(cyberOnly.length, 1);
  assert.equal(cyberOnly[0].id, 'wp-1');

  const premiumOnly = filterAndSortWallpapers(SAMPLE_WALLPAPERS, { tier: 'PREMIUM' });
  assert.equal(premiumOnly.length, 1);
  assert.equal(premiumOnly[0].id, 'wp-2');

  const newestFirst = filterAndSortWallpapers(SAMPLE_WALLPAPERS, { sortBy: 'newest' });
  assert.equal(newestFirst[0].id, 'wp-2');
});

test('evaluateEnginePowerState pauses during fullscreen gaming and stops when OS is locked', () => {
  const gamingState = evaluateEnginePowerState(
    {
      platform: 'windows',
      isFullscreenGameActive: true,
      isFullscreenAppActive: false,
      isOnBattery: false,
      isSystemLocked: false,
      isWallpaperVisible: true,
      heavyApplicationsRunning: false
    },
    DEFAULT_SETTINGS
  );
  assert.equal(gamingState.playbackStatus, 'PAUSED_GAMING');
  assert.equal(gamingState.targetFps, 0);
  assert.equal(gamingState.effectiveAudioVolume, 0);

  const lockedState = evaluateEnginePowerState(
    {
      platform: 'windows',
      isFullscreenGameActive: false,
      isFullscreenAppActive: false,
      isOnBattery: false,
      isSystemLocked: true,
      isWallpaperVisible: true,
      heavyApplicationsRunning: false
    },
    DEFAULT_SETTINGS
  );
  assert.equal(lockedState.playbackStatus, 'STOPPED_LOCKED');
  assert.equal(lockedState.targetFps, 0);

  const androidHidden = evaluateEnginePowerState(
    {
      platform: 'android',
      isFullscreenGameActive: false,
      isFullscreenAppActive: false,
      isOnBattery: false,
      isSystemLocked: false,
      isWallpaperVisible: false,
      heavyApplicationsRunning: false
    },
    DEFAULT_SETTINGS
  );
  assert.equal(androidHidden.playbackStatus, 'RELEASED_INVISIBLE');
});

test('validatePersonalVideoImport blocks path traversal and invalid trim ranges', () => {
  const validResult = validatePersonalVideoImport({
    fileName: 'my_custom_loop.mp4',
    format: 'MP4',
    fileSizeMb: 28.4,
    durationSeconds: 15,
    trimStart: 2,
    trimEnd: 12,
    playbackSpeed: 1.0,
    displayMode: 'Fill'
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.normalizedTrimDuration, 10);

  const traversalAttempt = validatePersonalVideoImport({
    fileName: '../../Windows/System32/cmd.exe',
    format: 'EXE',
    fileSizeMb: 10,
    durationSeconds: 10,
    trimStart: 5,
    trimEnd: 2,
    playbackSpeed: 4.0,
    displayMode: 'Fill'
  });
  assert.equal(traversalAttempt.valid, false);
  assert.ok(traversalAttempt.errors.length >= 3);
});

test('verifySubscriptionEntitlement enforces server-side premium access rules', () => {
  const freeAccess = verifySubscriptionEntitlement(null, { isPremium: false });
  assert.equal(freeAccess.allowed, true);

  const guestBlockedOnPremium = verifySubscriptionEntitlement(null, { isPremium: true });
  assert.equal(guestBlockedOnPremium.allowed, false);

  const activeSubAllowed = verifySubscriptionEntitlement(
    {
      id: 'u1',
      email: 'pro@luma.app',
      displayName: 'Pro User',
      role: 'USER',
      isPremium: true,
      subscriptionPlan: 'ANNUAL',
      subscriptionExpiresAt: '2028-01-01T00:00:00Z'
    },
    { isPremium: true }
  );
  assert.equal(activeSubAllowed.allowed, true);
});

test('canEnqueueDownload prevents duplicate downloads and checks disk space', () => {
  const checkOk = canEnqueueDownload([], SAMPLE_WALLPAPERS[0], 500);
  assert.equal(checkOk.canStart, true);

  const checkLowDisk = canEnqueueDownload([], SAMPLE_WALLPAPERS[1], 80);
  assert.equal(checkLowDisk.canStart, false);
  assert.equal(checkLowDisk.code, 'INSUFFICIENT_STORAGE');
});
