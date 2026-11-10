import React from 'react';
import { Monitor, Smartphone, Volume2, VolumeX, Cpu, ShieldCheck } from 'lucide-react';
import {
  evaluateEnginePowerState,
  type LumaSettings,
  type SystemRuntimeState,
  type WallpaperItem
} from '../shared/lumaLogic';
import { t, type LanguageCode } from '../shared/localization';
import { LiveWallpaperCanvas } from './LiveWallpaperCanvas';

interface PlatformSimulatorProps {
  lang: LanguageCode;
  settings: LumaSettings;
  runtime: SystemRuntimeState;
  onUpdateRuntime: (patch: Partial<SystemRuntimeState>) => void;
  onUpdateSettings: (updater: (prev: LumaSettings) => LumaSettings) => void;
  monitor1Wallpaper: WallpaperItem;
  monitor2Wallpaper: WallpaperItem;
  androidWallpaper: WallpaperItem;
  activeTargetMonitor: 1 | 2 | 'android';
  onSelectTargetMonitor: (target: 1 | 2 | 'android') => void;
}

export const PlatformSimulatorPanel: React.FC<PlatformSimulatorProps> = ({
  lang,
  settings,
  runtime,
  onUpdateRuntime,
  onUpdateSettings,
  monitor1Wallpaper,
  monitor2Wallpaper,
  androidWallpaper,
  activeTargetMonitor,
  onSelectTargetMonitor
}) => {
  const evaluation = evaluateEnginePowerState(runtime, settings);
  const isPlaying = evaluation.targetFps > 0;
  const effectiveMon2 =
    settings.wallpaper.monitorMode === 'span-all' || settings.wallpaper.monitorMode === 'clone'
      ? monitor1Wallpaper
      : monitor2Wallpaper;

  return (
    <section
      aria-label={t(lang, 'simulator_title')}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            {t(lang, 'hero_kicker')}
          </p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {t(lang, 'simulator_title')}
          </h2>
        </div>

        {/* Platform Switcher & Multi-Monitor Mode */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => onUpdateRuntime({ platform: 'windows' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                runtime.platform === 'windows'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{t(lang, 'simulator_win_mode')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateRuntime({ platform: 'android' });
                onSelectTargetMonitor('android');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                runtime.platform === 'android'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t(lang, 'simulator_android_mode')}</span>
            </button>
          </div>

          {runtime.platform === 'windows' && (
            <button
              type="button"
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  wallpaper: {
                    ...prev.wallpaper,
                    monitorMode: prev.wallpaper.monitorMode === 'per-monitor' ? 'span-all' : 'per-monitor'
                  }
                }))
              }
              className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {settings.wallpaper.monitorMode === 'per-monitor'
                ? t(lang, 'simulator_per_monitor')
                : t(lang, 'simulator_span_monitors')}
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Live Hardware Display Simulator + System Policy Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        {/* Left 8 cols: Multi-Monitor Windows WorkerW or Android WallpaperService Surface */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
          {runtime.platform === 'windows' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Monitor 1 */}
              <div
                onClick={() => onSelectTargetMonitor(1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectTargetMonitor(1)}
                aria-label="Select Windows Monitor 1"
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                  activeTargetMonitor === 1 ? 'border-sky-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <LiveWallpaperCanvas
                  imageUrl={monitor1Wallpaper.previewImageUrl}
                  videoUrl={monitor1Wallpaper.videoUrl}
                  shaderPreset={monitor1Wallpaper.shaderPreset}
                  accentColor={monitor1Wallpaper.accentColor}
                  isPlaying={isPlaying}
                  playbackSpeed={settings.wallpaper.playbackSpeed}
                  displayMode={settings.wallpaper.displayMode}
                  interactive={true}
                  title={monitor1Wallpaper.title}
                  className="w-full h-full"
                />

                {/* Simulated Desktop Icons behind WorkerW */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none text-[10px] text-white font-mono">
                  <div className="px-2 py-0.5 bg-black/70 backdrop-blur-xs rounded">
                    Display 1 (Primary) · {monitor1Wallpaper.resolution}
                  </div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-black/65 rounded w-fit">[This PC]</span>
                    <span className="px-1.5 py-0.5 bg-black/65 rounded w-fit">[Recycle Bin]</span>
                    <span className="px-1.5 py-0.5 bg-black/65 rounded w-fit">[LUMA Studio]</span>
                  </div>
                </div>

                {/* Simulated Windows 11 Taskbar & System Tray */}
                <div className="absolute bottom-0 inset-x-0 h-7 bg-slate-950/90 backdrop-blur-md border-t border-white/10 px-3 flex items-center justify-between gap-2 text-[10px] text-slate-200 font-mono tabular-nums whitespace-nowrap">
                  <span className="shrink-0">Win11 WorkerW (0x052C)</span>
                  <span className="truncate text-slate-300">{monitor1Wallpaper.title}</span>
                  <span className="shrink-0 text-sky-400">Tray: {evaluation.targetFps} FPS</span>
                </div>
              </div>

              {/* Secondary Monitor 2 */}
              <div
                onClick={() => onSelectTargetMonitor(2)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectTargetMonitor(2)}
                aria-label="Select Windows Monitor 2"
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                  activeTargetMonitor === 2 ? 'border-sky-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <LiveWallpaperCanvas
                  imageUrl={effectiveMon2.previewImageUrl}
                  videoUrl={effectiveMon2.videoUrl}
                  shaderPreset={effectiveMon2.shaderPreset}
                  accentColor={effectiveMon2.accentColor}
                  isPlaying={isPlaying}
                  playbackSpeed={settings.wallpaper.playbackSpeed}
                  displayMode={settings.wallpaper.displayMode}
                  interactive={true}
                  title={effectiveMon2.title}
                  className="w-full h-full"
                />
                <div className="absolute top-3 left-3 pointer-events-none text-[10px] text-white font-mono">
                  <div className="px-2 py-0.5 bg-black/70 backdrop-blur-xs rounded">
                    Display 2 ({settings.wallpaper.monitorMode === 'per-monitor' ? 'Independent' : 'Spanned'}) · {effectiveMon2.resolution}
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-7 bg-slate-950/90 backdrop-blur-md border-t border-white/10 px-3 flex items-center justify-between gap-2 text-[10px] text-slate-200 font-mono tabular-nums whitespace-nowrap">
                  <span className="shrink-0">DXGI Output 2</span>
                  <span className="truncate text-slate-300">{effectiveMon2.title}</span>
                  <span className="shrink-0 text-sky-400">{evaluation.targetFps} FPS</span>
                </div>
              </div>
            </div>
          ) : (
            /* Android Live Wallpaper Previewer (Home Screen + Lock Screen) */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-52 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-sky-500 bg-slate-900">
                <LiveWallpaperCanvas
                  imageUrl={androidWallpaper.previewImageUrl}
                  videoUrl={androidWallpaper.videoUrl}
                  shaderPreset={androidWallpaper.shaderPreset}
                  accentColor={androidWallpaper.accentColor}
                  isPlaying={isPlaying}
                  playbackSpeed={settings.wallpaper.playbackSpeed}
                  displayMode={settings.wallpaper.displayMode}
                  title={androidWallpaper.title}
                  className="w-full h-full"
                />
                <div className="absolute inset-x-0 top-3 px-4 flex justify-between text-[10px] text-white font-mono tabular-nums">
                  <span>09:41</span>
                  <span>5G · 94%</span>
                </div>
                <div className="absolute inset-x-3 bottom-4 bg-black/70 backdrop-blur-md rounded-lg p-2 text-center text-[11px] text-white font-medium">
                  Android Home Screen · ExoPlayer Surface
                </div>
              </div>

              <div className="relative w-52 aspect-[9/16] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
                <LiveWallpaperCanvas
                  imageUrl={androidWallpaper.previewImageUrl}
                  videoUrl={androidWallpaper.videoUrl}
                  shaderPreset={androidWallpaper.shaderPreset}
                  accentColor={androidWallpaper.accentColor}
                  isPlaying={isPlaying}
                  playbackSpeed={settings.wallpaper.playbackSpeed}
                  displayMode={settings.wallpaper.displayMode}
                  title={androidWallpaper.title}
                  className="w-full h-full"
                />
                <div className="absolute inset-x-0 top-8 text-center text-white drop-shadow">
                  <div className="text-2xl font-bold font-mono tabular-nums">09:41</div>
                  <div className="text-[11px] text-slate-200">Lock Screen WallpaperService</div>
                </div>
              </div>
            </div>
          )}

          {/* Hardware Decoder & Swapchain Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 font-mono tabular-nums text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Decoder Pipeline</span>
              <strong className="text-slate-100 text-[11px] truncate block">{evaluation.decoderPipeline}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">CPU / GPU Decode</span>
              <strong className="text-slate-100 text-[11px]">
                {evaluation.estimatedCpuPercent}% CPU · {evaluation.estimatedGpuPercent}% GPU
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Loop Transition</span>
              <strong className="text-emerald-400 text-[11px]">0ms Double-Buffered</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Display Scaling</span>
              <strong className="text-slate-100 text-[11px]">
                {settings.wallpaper.displayMode} · {settings.wallpaper.videoQuality}
              </strong>
            </div>
          </div>

          {/* Active Engine Reason Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{evaluation.reason}</span>
            </div>
            <div className="text-slate-400">
              Target Click Assignment:{' '}
              <strong className="text-white">
                {runtime.platform === 'android' ? 'Android Device' : `Windows Monitor ${activeTargetMonitor}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Real-Time Engine Policy Simulators & Telemetry */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              <span>System Event & Power Simulation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Toggle real-world OS events to verify automatic wallpaper pause, battery throttling, and lock suspension.
            </p>

            <div className="mt-3 space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {t(lang, 'simulator_fullscreen_game')}
                </span>
                <input
                  type="checkbox"
                  checked={runtime.isFullscreenGameActive}
                  onChange={(e) => onUpdateRuntime({ isFullscreenGameActive: e.target.checked })}
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {t(lang, 'simulator_battery_power')}
                </span>
                <input
                  type="checkbox"
                  checked={runtime.isOnBattery}
                  onChange={(e) => onUpdateRuntime({ isOnBattery: e.target.checked })}
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {t(lang, 'simulator_lock_screen')}
                </span>
                <input
                  type="checkbox"
                  checked={runtime.isSystemLocked}
                  onChange={(e) => onUpdateRuntime({ isSystemLocked: e.target.checked })}
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {t(lang, 'simulator_heavy_load')}
                </span>
                <input
                  type="checkbox"
                  checked={runtime.heavyApplicationsRunning}
                  onChange={(e) => onUpdateRuntime({ heavyApplicationsRunning: e.target.checked })}
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Hardware Telemetry & Audio Volume */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Engine State</span>
                <strong className="text-slate-900 dark:text-slate-100">{evaluation.playbackStatus}</strong>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px]">Frame Rate / RAM</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {evaluation.targetFps} FPS · {evaluation.estimatedRamMb} MB
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, mute: !prev.audio.mute }
                  }))
                }
                aria-label="Toggle Wallpaper Audio Mute"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {settings.audio.mute || evaluation.effectiveAudioVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-500" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 mb-1">
                  <span>Independent Audio Mixer</span>
                  <span>{evaluation.effectiveAudioVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.audio.volume}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, volume: Number(e.target.value), mute: false }
                    }))
                  }
                  aria-label="Wallpaper Audio Volume"
                  className="w-full accent-sky-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
