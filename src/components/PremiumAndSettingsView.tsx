import React, { useState } from 'react';
import { Crown, Check, RefreshCw, Sliders, Volume2, HardDrive, UserCheck, Shield } from 'lucide-react';
import {
  SUPPORTED_DISPLAY_MODES,
  type LumaSettings,
  type UserProfile
} from '../shared/lumaLogic';
import { t, type LanguageCode } from '../shared/localization';

interface PremiumAndSettingsViewProps {
  mode: 'premium' | 'settings';
  lang: LanguageCode;
  settings: LumaSettings;
  onUpdateSettings: (updater: (prev: LumaSettings) => LumaSettings) => void;
  user: UserProfile | null;
  onActivateSubscription: (plan: 'FREE' | 'MONTHLY' | 'ANNUAL') => Promise<void>;
  onRestorePurchases: () => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  onResetPassword: (email: string, newPassword: string) => Promise<string | null>;
  onSignOut: () => void;
  onQuickSwitchAccount: (role: 'USER' | 'ADMIN') => void;
  cachedBytesMb: number;
  onClearCache: () => void;
}

export const PremiumAndSettingsView: React.FC<PremiumAndSettingsViewProps> = ({
  mode,
  lang,
  settings,
  onUpdateSettings,
  user,
  onActivateSubscription,
  onRestorePurchases,
  onSignIn,
  onSignUp,
  onResetPassword,
  onSignOut,
  onQuickSwitchAccount,
  cachedBytesMb,
  onClearCache
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [subFeedback, setSubFeedback] = useState<string | null>(null);

  // Auth form states
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const handleSubscriptionAction = async (plan: 'FREE' | 'MONTHLY' | 'ANNUAL') => {
    setSubFeedback(null);
    await onActivateSubscription(plan);
    setSubFeedback(
      plan === 'FREE'
        ? 'Switched account tier to LUMA Free.'
        : `Activated ${plan} LUMA Premium entitlement via server verification.`
    );
  };

  const handleRestore = async () => {
    setSubFeedback(null);
    await onRestorePurchases();
    setSubFeedback('Verified platform store receipts and synchronized entitlements.');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    if (authTab === 'signin') {
      const err = await onSignIn(email, password);
      if (err) setAuthMessage({ type: 'error', text: err });
      else setAuthMessage({ type: 'success', text: 'Signed in and synchronized profile.' });
    } else if (authTab === 'signup') {
      const err = await onSignUp(email, password, displayName);
      if (err) setAuthMessage({ type: 'error', text: err });
      else setAuthMessage({ type: 'success', text: 'Account created and signed in.' });
    } else {
      const err = await onResetPassword(email, password);
      if (err) setAuthMessage({ type: 'error', text: err });
      else setAuthMessage({ type: 'success', text: 'Password updated securely. You can now sign in.' });
    }
  };

  if (mode === 'premium') {
    return (
      <div className="space-y-8">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>{t(lang, 'premium_title')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(lang, 'premium_subtitle')}
              </p>
            </div>

            {/* Billing cadence selector + Restore Purchases */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t(lang, 'premium_monthly')}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t(lang, 'premium_annual')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRestore}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t(lang, 'premium_restore')}</span>
              </button>
            </div>
          </div>

          {subFeedback && (
            <div role="status" className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400">
              {subFeedback}
            </div>
          )}

          {/* Tier Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* FREE Tier */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500">For standard desktop & mobile personalization</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {t(lang, 'premium_free_tier')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Standard access via guest or registered account. No payment required.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Full Free Live Wallpaper Library (1080p, 1440p & selected 4K loops)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited Personal Local Video Import (MP4, WebM, GIF, WebP)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Hardware-Accelerated Windows WorkerW & Android ExoPlayer Engines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automatic Gaming Pause, Battery Throttling & Favorites</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscriptionAction('FREE')}
                className="mt-6 w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                {user && !user.isPremium ? 'Current Active Tier (Free)' : 'Switch to Free Tier'}
              </button>
            </div>

            {/* PREMIUM Tier */}
            <div className="p-6 rounded-xl border-2 border-sky-500 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-sky-500">
                  For multi-monitor enthusiasts & 8K creators · {billingCycle} billing via official platform store
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {t(lang, 'premium_pro_tier')} ({billingCycle})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pricing is retrieved dynamically from Microsoft Store / Google Play Billing / Stripe checkout for your region.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Unlocks All Premium Collections (Dragons, Dark Fantasy, Interactive & 8K Masters)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Interactive Cursor-Reactive Shaders & Real-Time Audio Spectrum Visualizers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Cross-Device Cloud Sync for Favorites, Settings & Download History</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Authorized AI Wallpaper Studio Synthesis Access</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscriptionAction(billingCycle)}
                className="mt-6 w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              >
                {user?.isPremium
                  ? `Active Entitlement (${user.subscriptionPlan || billingCycle}) — Renew / Update`
                  : t(lang, 'premium_upgrade_btn')}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // SETTINGS VIEW (General, Wallpaper, Performance, Audio, Storage, Account)
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t(lang, 'settings_title')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t(lang, 'settings_saved_notice')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* 1. GENERAL SETTINGS */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span>1. {t(lang, 'settings_general')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interface Language
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, language: e.target.value as LanguageCode }
                    }))
                  }
                  aria-label="Interface Language"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="en">English (EN)</option>
                  <option value="uz">O‘zbekcha (UZ)</option>
                  <option value="ru">Русский (RU)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Color Theme
                </label>
                <select
                  value={settings.general.theme}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, theme: e.target.value as 'dark' | 'light' }
                    }))
                  }
                  aria-label="Color Theme"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="dark">Premium Dark Mode</option>
                  <option value="light">High-Contrast Daylight</option>
                </select>
              </div>
            </div>

            <label className="flex items-center justify-between text-xs cursor-pointer pt-1">
              <span className="text-slate-700 dark:text-slate-300">Start Automatically with Windows Boot</span>
              <input
                type="checkbox"
                checked={settings.general.startWithWindows}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    general: { ...prev.general, startWithWindows: e.target.checked }
                  }))
                }
                className="h-4 w-4 accent-sky-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">Minimize to System Tray on Close</span>
              <input
                type="checkbox"
                checked={settings.general.minimizeToTray}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    general: { ...prev.general, minimizeToTray: e.target.checked }
                  }))
                }
                className="h-4 w-4 accent-sky-600 rounded"
              />
            </label>
          </div>

          {/* 2. WALLPAPER PLAYBACK SETTINGS */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. {t(lang, 'settings_wallpaper')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Video Quality
                </label>
                <select
                  value={settings.wallpaper.videoQuality}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      wallpaper: { ...prev.wallpaper, videoQuality: e.target.value as any }
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                >
                  <option value="1080p">1080p (FHD)</option>
                  <option value="1440p">1440p (QHD)</option>
                  <option value="4K">4K (UHD)</option>
                  <option value="8K">8K (Master)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monitor Topology
                </label>
                <select
                  value={settings.wallpaper.monitorMode}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      wallpaper: { ...prev.wallpaper, monitorMode: e.target.value as any }
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="per-monitor">Independent Per-Monitor</option>
                  <option value="span-all">Span Across Displays</option>
                  <option value="clone">Clone Primary Display</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Wallpaper Positioning
                </label>
                <select
                  value={settings.wallpaper.displayMode}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      wallpaper: { ...prev.wallpaper, displayMode: e.target.value as any }
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {SUPPORTED_DISPLAY_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                Global Playback Speed: {settings.wallpaper.playbackSpeed}x
              </span>
              <input
                type="range"
                min={0.25}
                max={2.0}
                step={0.25}
                value={settings.wallpaper.playbackSpeed}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    wallpaper: { ...prev.wallpaper, playbackSpeed: Number(e.target.value) }
                  }))
                }
                className="w-40 accent-sky-600"
              />
            </div>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                Zero-Black-Frame Double-Buffered Seamless Looping
              </span>
              <input
                type="checkbox"
                checked={settings.wallpaper.loopSeamless}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    wallpaper: { ...prev.wallpaper, loopSeamless: e.target.checked }
                  }))
                }
                className="h-4 w-4 accent-sky-600 rounded"
              />
            </label>
          </div>

          {/* 3. PERFORMANCE & POWER SETTINGS */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-500" />
              <span>3. {t(lang, 'settings_performance')}</span>
            </h3>

            {[
              { key: 'pauseDuringGaming', label: 'Pause Wallpaper Playback During Fullscreen Games (D3D/Vulkan)' },
              { key: 'pauseWhenFullscreen', label: 'Pause When Maximized Application Covers Desktop' },
              { key: 'batterySavingMode', label: 'Enable Battery-Saving Mode (Throttle to 24 FPS on Battery)' },
              { key: 'pauseWhenOnBattery', label: 'Completely Pause Playback When Disconnected from AC Power' },
              { key: 'hardwareAcceleration', label: 'Hardware-Accelerated Video Decoding (D3D11VA / MediaCodec)' }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                <input
                  type="checkbox"
                  checked={(settings.performance as any)[item.key]}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      performance: { ...prev.performance, [item.key]: e.target.checked }
                    }))
                  }
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>
            ))}
          </div>

          {/* 4. AUDIO & STORAGE SETTINGS */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-500" />
              <span>4. {t(lang, 'settings_audio')} & {t(lang, 'settings_storage')}</span>
            </h3>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.audio.enableAudio}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, enableAudio: e.target.checked }
                    }))
                  }
                  className="h-4 w-4 accent-sky-600 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">Enable Wallpaper Audio Output</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.audio.mute}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, mute: e.target.checked }
                    }))
                  }
                  className="h-4 w-4 accent-sky-600 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">Mute All</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Cache Path: {settings.storage.cacheLocation}</span>
                </span>
                <span className="tabular-nums font-semibold">{cachedBytesMb.toFixed(1)} MB used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Download Path: {settings.storage.downloadLocation}</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearCache();
                    setCacheNotice('Local wallpaper cache cleared.');
                  }}
                  className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Clear Cache
                </button>
              </div>
              {cacheNotice && <p className="text-emerald-500 text-[11px]">{cacheNotice}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 5. USER ACCOUNT & SYNCHRONIZATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              <span>5. {t(lang, 'settings_account')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guest mode is always active for free wallpapers. Sign in to synchronize favorites, downloads, and Premium entitlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickSwitchAccount('USER')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Demo Standard User
            </button>
            <button
              type="button"
              onClick={() => onQuickSwitchAccount('ADMIN')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
            >
              Demo Lead Admin (Pro)
            </button>
            {user && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-500"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Active Profile Status */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            {user ? (
              <div className="space-y-2 text-xs">
                <div className="text-slate-500">Authenticated Session</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">{user.displayName}</div>
                <div className="font-mono text-slate-600 dark:text-slate-400">{user.email}</div>
                <div className="pt-2 flex items-center gap-2 font-mono">
                  <span>Role: <strong>{user.role}</strong></span>
                  <span>·</span>
                  <span>Tier: <strong>{user.isPremium ? 'LUMA PREMIUM' : 'LUMA FREE'}</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">Guest Mode Active</div>
                <p className="text-slate-500">
                  You can browse, preview, download, and apply all Free wallpapers and import personal videos without an account.
                </p>
              </div>
            )}
          </div>

          {/* Sign In / Sign Up / Reset Password Form */}
          <div className="lg:col-span-7">
            <div className="flex gap-2 mb-4">
              {(['signin', 'signup', 'reset'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setAuthTab(tab);
                    setAuthMessage(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${
                    authTab === tab
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab === 'signin' ? 'Sign In' : tab === 'signup' ? 'Sign Up' : 'Reset Password'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuthSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {authTab === 'signup' && (
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              )}
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
              <input
                type="password"
                placeholder={authTab === 'reset' ? 'New Password (min 6 chars)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
              <button
                type="submit"
                className="py-2 px-4 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg"
              >
                {authTab === 'signin' ? 'Sign In' : authTab === 'signup' ? 'Create Account' : 'Reset Password'}
              </button>
            </form>

            {authMessage && (
              <p
                className={`mt-3 text-xs ${
                  authMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {authMessage.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
