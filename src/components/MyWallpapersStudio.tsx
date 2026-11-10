import React, { useState } from 'react';
import { Upload, Play, Pause, RotateCcw, Trash2, Sparkles, CheckCircle2, AlertTriangle, Film } from 'lucide-react';
import {
  SUPPORTED_DISPLAY_MODES,
  SUPPORTED_FORMATS,
  validatePersonalVideoImport,
  type DisplayScalingMode,
  type DownloadTask,
  type ResolutionOption,
  type WallpaperItem
} from '../shared/lumaLogic';
import { WALLPAPER_CATEGORIES, t, type LanguageCode } from '../shared/localization';
import { IMG_ANIME, IMG_CYBERPUNK } from '../shared/seedCatalog';
import { LiveWallpaperCanvas } from './LiveWallpaperCanvas';

interface MyWallpapersStudioProps {
  lang: LanguageCode;
  personalWallpapers: WallpaperItem[];
  onSavePersonalWallpaper: (wp: WallpaperItem) => void;
  onApplyWallpaper: (wp: WallpaperItem) => void;
  downloads: DownloadTask[];
  onPauseResumeDownload: (taskId: string) => void;
  onCancelDownload: (taskId: string) => void;
  onRetryDownload: (taskId: string) => void;
  onClearCompletedDownloads: () => void;
  aiConfigured: boolean;
  onAiWallpaperCreated: (wp: WallpaperItem) => void;
}

export const MyWallpapersStudio: React.FC<MyWallpapersStudioProps> = ({
  lang,
  personalWallpapers,
  onSavePersonalWallpaper,
  onApplyWallpaper,
  downloads,
  onPauseResumeDownload,
  onCancelDownload,
  onRetryDownload,
  onClearCompletedDownloads,
  aiConfigured,
  onAiWallpaperCreated
}) => {
  // Personal Video Import State
  const [customTitle, setCustomTitle] = useState('Custom Horizon Loop');
  const [fileName, setFileName] = useState('my_desktop_loop.mp4');
  const [format, setFormat] = useState('MP4');
  const [fileSizeMb, setFileSizeMb] = useState(34.5);
  const [durationSeconds, setDurationSeconds] = useState(15);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [displayMode, setDisplayMode] = useState<DisplayScalingMode>('Fill');
  const [muted, setMuted] = useState(true);
  const [localObjectUrl, setLocalObjectUrl] = useState<string | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // AI Studio State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState<'Anime' | 'Fantasy' | 'Realistic' | 'Cyberpunk' | 'Cinematic' | '3D' | 'Space' | 'Nature'>('Cyberpunk');
  const [aiResolution, setAiResolution] = useState<ResolutionOption>('3840x2160');
  const [aiDuration, setAiDuration] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'MP4';
    setFormat(ext);
    setFileSizeMb(Number((file.size / (1024 * 1024)).toFixed(2)) || 12.4);
    if (customTitle === 'Custom Horizon Loop') {
      setCustomTitle(file.name.replace(/\.[^.]+$/, ''));
    }
    const url = URL.createObjectURL(file);
    setLocalObjectUrl(url);
  };

  const handleCreatePersonalWallpaper = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(null);
    const validation = validatePersonalVideoImport({
      fileName,
      format,
      fileSizeMb,
      durationSeconds,
      trimStart,
      trimEnd,
      playbackSpeed,
      displayMode
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    const newPersonal: WallpaperItem = {
      id: `personal-${Date.now()}`,
      title: customTitle.trim() || fileName,
      description: `Personal local wallpaper (${displayMode} mode, ${trimStart}s–${trimEnd}s loop at ${playbackSpeed}x speed). Stored strictly on device.`,
      categorySlug: 'interactive-wallpapers',
      resolution: '3840x2160',
      format: (SUPPORTED_FORMATS.find((f) => f.toLowerCase() === format.toLowerCase()) || 'MP4') as any,
      durationSeconds: validation.normalizedTrimDuration,
      fileSizeMb,
      isPremium: false,
      isFeatured: false,
      isTrending: false,
      isPublished: true,
      downloadsCount: 1,
      createdAt: new Date().toISOString(),
      style: 'Cinematic',
      previewImageUrl: IMG_ANIME,
      videoUrl: localObjectUrl,
      shaderPreset: 'anime-sky-islands',
      accentColor: '#38bdf8',
      sha256Checksum: `local-sha256-${Date.now()}`,
      isPersonalUpload: true,
      trimStart,
      trimEnd,
      playbackSpeed,
      displayMode,
      muted
    };

    onSavePersonalWallpaper(newPersonal);
    onApplyWallpaper(newPersonal);
    setSaveSuccessMsg(`Saved "${newPersonal.title}" to My Wallpapers and applied to active display.`);
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt to synthesize a live wallpaper.');
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          resolution: aiResolution,
          durationSeconds: aiDuration,
          categorySlug: 'ai-generated-worlds'
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAiError(data.error || 'AI generation failed.');
      } else if (data.wallpaper) {
        onAiWallpaperCreated(data.wallpaper);
        setAiPrompt('');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Network error contacting AI Studio endpoint.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Personal Video Wallpaper Import & Studio */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Film className="w-5 h-5 text-sky-500" />
              <span>{t(lang, 'personal_title')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t(lang, 'personal_subtitle')}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0">
            <Upload className="w-4 h-4" />
            <span>{t(lang, 'btn_import_video')}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,image/gif,image/jpeg,image/png,image/webp"
              onChange={handleLocalFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <form onSubmit={handleCreatePersonalWallpaper} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Live Preview of Personal Video with Scaling Mode & Speed */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800">
              <LiveWallpaperCanvas
                imageUrl={IMG_CYBERPUNK}
                videoUrl={localObjectUrl}
                shaderPreset="cyberpunk-rain"
                accentColor="#38bdf8"
                isPlaying={true}
                playbackSpeed={playbackSpeed}
                displayMode={displayMode}
                trimStart={trimStart}
                trimEnd={trimEnd}
                muted={muted}
                title={customTitle}
                className="w-full h-full"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-300">
              <span>File: {fileName} ({format})</span>
              <span>
                Loop Window: {trimStart}s – {trimEnd}s ({Math.max(0, trimEnd - trimStart)}s) · {playbackSpeed}x · {displayMode}
              </span>
            </div>
          </div>

          {/* Controls: Trim, Speed, Display Mode, Validation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Wallpaper Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Source File Name & Format
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    aria-label="Source File Name"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    aria-label="Media Format"
                    className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    {SUPPORTED_FORMATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Trim Start / End & Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'personal_trim_start')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'personal_trim_end')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'personal_speed')} ({playbackSpeed}x)
                </label>
                <input
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.25}
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="w-full accent-sky-600 mt-2"
                />
              </div>
            </div>

            {/* Display Mode & Audio Mute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t(lang, 'personal_display_mode')}
                </label>
                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {SUPPORTED_DISPLAY_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDisplayMode(mode)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        displayMode === mode
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer text-xs mt-4 sm:mt-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t(lang, 'personal_mute')}
                </span>
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e) => setMuted(e.target.checked)}
                  className="h-4 w-4 accent-sky-600 rounded"
                />
              </label>
            </div>

            {validationErrors.length > 0 && (
              <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {saveSuccessMsg && (
              <div role="status" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
            >
              {t(lang, 'personal_save_apply')}
            </button>
          </div>
        </form>

        {/* Personal Library List */}
        {personalWallpapers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Saved Personal Collection ({personalWallpapers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personalWallpapers.map((wp) => (
                <div
                  key={wp.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {wp.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {wp.format} · {wp.durationSeconds}s · {wp.displayMode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyWallpaper(wp)}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-md hover:bg-sky-500 whitespace-nowrap shrink-0"
                  >
                    {t(lang, 'btn_apply')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 2. Wallpaper Download Manager */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t(lang, 'downloads_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(lang, 'downloads_subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearCompletedDownloads}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {t(lang, 'downloads_clear_completed')}
          </button>
        </div>

        {downloads.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No downloads in queue. Click "{t(lang, 'btn_download')}" on any wallpaper card to cache it locally with SHA-256 verification.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
            {downloads.map((task) => (
              <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>{task.title}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {task.downloadedMb.toFixed(1)} / {task.fileSizeMb.toFixed(1)} MB ({task.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : task.status === 'FAILED'
                          ? 'bg-rose-500'
                          : task.status === 'PAUSED'
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500 flex items-center gap-2">
                    <span>Status: {task.status}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      SHA-256: {task.sha256Expected.slice(0, 16)}...{' '}
                      {task.sha256Verified ? '(Verified OK)' : '(Pending)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(task.status === 'DOWNLOADING' || task.status === 'PAUSED') && (
                    <button
                      type="button"
                      onClick={() => onPauseResumeDownload(task.id)}
                      aria-label={task.status === 'DOWNLOADING' ? `Pause ${task.title}` : `Resume ${task.title}`}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {task.status === 'DOWNLOADING' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {task.status === 'FAILED' && (
                    <button
                      type="button"
                      onClick={() => onRetryDownload(task.id)}
                      aria-label={`Retry ${task.title}`}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onCancelDownload(task.id)}
                    aria-label={`Remove ${task.title}`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Optional AI Wallpaper Studio */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              <span>{t(lang, 'ai_studio_title')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(lang, 'ai_studio_subtitle')}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Adapter Status: {aiConfigured ? 'Authorized (Gemini API Ready)' : 'Standby (Awaiting Server Secret)'}
          </span>
        </div>

        <form onSubmit={handleAiGenerate} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Wallpaper Scene Prompt
              </label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Bioluminescent orbital library overlooking Saturn's rings in gentle rain..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Style
              </label>
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {['Anime', 'Fantasy', 'Realistic', 'Cyberpunk', 'Cinematic', '3D', 'Space', 'Nature'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Resolution
              </label>
              <select
                value={aiResolution}
                onChange={(e) => setAiResolution(e.target.value as ResolutionOption)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
              >
                <option value="1920x1080">1920x1080</option>
                <option value="2560x1440">2560x1440</option>
                <option value="3840x2160">3840x2160</option>
                <option value="7680x4320">7680x4320</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {aiLoading ? 'Synthesizing...' : t(lang, 'ai_generate_btn')}
              </button>
            </div>
          </div>

          {/* Prompt Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Presets:</span>
            {[
              'Cyberpunk Neo-Tashkent monorail at twilight in gentle neon rain',
              'Ancient Samarkand astral observatory under a relativistic galaxy',
              'Floating anime shrine above golden sunset clouds with cherry blossoms'
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAiPrompt(preset)}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {aiError && (
            <div role="alert" className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
              {aiError}
            </div>
          )}
        </form>
      </section>
    </div>
  );
};
