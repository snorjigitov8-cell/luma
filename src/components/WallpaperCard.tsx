import React from 'react';
import { Heart, Download, Monitor, Check, Lock } from 'lucide-react';
import type { WallpaperItem } from '../shared/lumaLogic';
import { getCategoryName, t, type LanguageCode } from '../shared/localization';
import { LiveWallpaperCanvas } from './LiveWallpaperCanvas';

interface WallpaperCardProps {
  wallpaper: WallpaperItem;
  lang: LanguageCode;
  isApplied: boolean;
  isFavorited: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  onApply: (wallpaper: WallpaperItem) => void;
  onToggleFavorite: (wallpaper: WallpaperItem) => void;
  onDownload: (wallpaper: WallpaperItem) => void;
  onPreviewSelect: (wallpaper: WallpaperItem) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  lang,
  isApplied,
  isFavorited,
  isDownloaded,
  isDownloading,
  onApply,
  onToggleFavorite,
  onDownload,
  onPreviewSelect
}) => {
  const categoryLabel = getCategoryName(wallpaper.categorySlug, lang);
  const tierLabel = wallpaper.isPremium ? t(lang, 'badge_premium') : t(lang, 'badge_free');

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      {/* Interactive Preview Surface */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        <LiveWallpaperCanvas
          imageUrl={wallpaper.previewImageUrl}
          videoUrl={wallpaper.videoUrl}
          shaderPreset={wallpaper.shaderPreset}
          accentColor={wallpaper.accentColor}
          isPlaying={true}
          playbackSpeed={wallpaper.playbackSpeed ?? 1.0}
          displayMode={wallpaper.displayMode ?? 'Fill'}
          title={wallpaper.title}
          className="w-full h-full"
        />

        {/* Scrim overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

        {/* Preview trigger button */}
        <button
          type="button"
          onClick={() => onPreviewSelect(wallpaper)}
          aria-label={`${t(lang, 'btn_preview')} ${wallpaper.title}`}
          className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium text-white bg-black/60 hover:bg-black/80 rounded-md transition-opacity whitespace-nowrap shrink-0"
        >
          {t(lang, 'btn_preview')}
        </button>

        {/* Favorite button */}
        <button
          type="button"
          onClick={() => onToggleFavorite(wallpaper)}
          aria-label={`${t(lang, 'btn_favorite')} ${wallpaper.title}`}
          className={`absolute top-3 right-3 p-2 rounded-md transition-colors ${
            isFavorited
              ? 'bg-rose-600 text-white'
              : 'bg-black/60 text-slate-200 hover:bg-black/80 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {/* Bottom inline unboxed technical metadata over scrim */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-200 font-mono tabular-nums pointer-events-none">
          <div className="flex items-center gap-1.5 truncate">
            <span>{wallpaper.resolution}</span>
            <span aria-hidden="true">·</span>
            <span>{wallpaper.durationSeconds}s</span>
            <span aria-hidden="true">·</span>
            <span>{wallpaper.fileSizeMb.toFixed(1)} MB</span>
          </div>
          <span className={wallpaper.isPremium ? 'text-amber-300 font-semibold' : 'text-sky-300'}>
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Card Body: Leads directly with quiet category kicker + Title (Zero-Pill Discipline) */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{wallpaper.format}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{wallpaper.downloadsCount.toLocaleString()} DL</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
            {wallpaper.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {wallpaper.description}
          </p>
        </div>

        {/* Action Buttons: Every button performs a real action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onApply(wallpaper)}
            aria-label={`${t(lang, 'btn_apply')} ${wallpaper.title}`}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              isApplied
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {isApplied ? <Check className="w-3.5 h-3.5" /> : wallpaper.isPremium ? <Lock className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span>{isApplied ? t(lang, 'btn_applied') : t(lang, 'btn_apply')}</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(wallpaper)}
            disabled={isDownloading}
            aria-label={`${t(lang, 'btn_download')} ${wallpaper.title}`}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              isDownloaded
                ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isDownloading
                ? t(lang, 'btn_downloading')
                : isDownloaded
                ? t(lang, 'btn_downloaded')
                : t(lang, 'btn_download')}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};
