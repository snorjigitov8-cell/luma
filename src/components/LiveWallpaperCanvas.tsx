import React, { useEffect, useRef, useState } from 'react';
import type { DisplayScalingMode, VisualShaderPreset } from '../shared/lumaLogic';

interface LiveWallpaperCanvasProps {
  imageUrl: string;
  videoUrl?: string;
  shaderPreset: VisualShaderPreset;
  accentColor: string;
  isPlaying?: boolean;
  playbackSpeed?: number;
  displayMode?: DisplayScalingMode;
  trimStart?: number;
  trimEnd?: number;
  muted?: boolean;
  volume?: number;
  interactive?: boolean;
  className?: string;
  title?: string;
}

export const LiveWallpaperCanvas: React.FC<LiveWallpaperCanvasProps> = ({
  imageUrl,
  videoUrl,
  shaderPreset,
  accentColor,
  isPlaying = true,
  playbackSpeed = 1.0,
  displayMode = 'Fill',
  trimStart = 0,
  trimEnd = 10,
  muted = true,
  volume = 70,
  interactive = false,
  className = '',
  title = 'Live Wallpaper'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0.5, y: 0.5, active: false });
  const [imgError, setImgError] = useState(false);

  const objectFitClass =
    displayMode === 'Fill' || displayMode === 'Crop'
      ? 'object-cover'
      : displayMode === 'Fit'
      ? 'object-contain'
      : displayMode === 'Stretch'
      ? 'object-fill'
      : 'object-none object-center';

  // Handle custom imported video playback and seamless trim loop
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !videoUrl) return;
    vid.playbackRate = Math.max(0.25, Math.min(2.0, playbackSpeed));
    vid.muted = muted;
    vid.volume = muted ? 0 : Math.max(0, Math.min(1, volume / 100));

    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }

    const handleTimeUpdate = () => {
      if (trimEnd > trimStart && vid.currentTime >= trimEnd) {
        vid.currentTime = trimStart;
        if (isPlaying) vid.play().catch(() => {});
      }
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    return () => vid.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoUrl, isPlaying, playbackSpeed, trimStart, trimEnd, muted, volume]);

  // Procedural particle & atmospheric overlay loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const particles = Array.from({ length: 42 }, (_, idx) => ({
      x: ((idx * 73) % 100) / 100,
      y: ((idx * 41) % 100) / 100,
      size: 1.2 + (idx % 4) * 0.9,
      speedY: 0.04 + (idx % 5) * 0.02,
      speedX: ((idx % 3) - 1) * 0.015,
      phase: idx * 0.6
    }));

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000) * playbackSpeed;
      lastTime = now;
      if (isPlaying) {
        elapsed += dt;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (shaderPreset === 'cyberpunk-rain') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 1.2;
        for (const p of particles) {
          const py = ((p.y + elapsed * (p.speedY * 5.5)) % 1.1) * h;
          const px = ((p.x + elapsed * 0.05) % 1.0) * w;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 3, py + 18);
          ctx.stroke();
        }
      } else if (shaderPreset === 'cosmic-nebula' || shaderPreset === 'dark-eclipse') {
        const cx = w * 0.5;
        const cy = h * 0.5;
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.42);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        grad.addColorStop(0.5, shaderPreset === 'dark-eclipse' ? 'rgba(225, 29, 72, 0.22)' : 'rgba(245, 158, 11, 0.24)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (const p of particles) {
          const angle = p.phase + elapsed * 0.35;
          const radius = (0.14 + p.x * 0.32) * Math.min(w, h);
          const px = cx + Math.cos(angle) * radius * 1.3;
          const py = cy + Math.sin(angle) * radius * 0.55;
          ctx.fillStyle = 'rgba(253, 224, 71, 0.65)';
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shaderPreset === 'interactive-matrix') {
        const mx = mouseRef.current.x * w;
        const my = mouseRef.current.y * h;
        for (const p of particles) {
          const px = ((p.x + Math.sin(elapsed + p.phase) * 0.04 + 1) % 1) * w;
          const py = ((p.y + Math.cos(elapsed * 0.8 + p.phase) * 0.04 + 1) % 1) * h;
          const dist = Math.hypot(px - mx, py - my);
          ctx.fillStyle = dist < 110 ? accentColor : 'rgba(148, 163, 184, 0.45)';
          ctx.beginPath();
          ctx.arc(px, py, dist < 110 ? p.size * 1.8 : p.size, 0, Math.PI * 2);
          ctx.fill();
          if (dist < 110) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }
        }
      } else {
        // Floating bioluminescent / blossom / ember particles
        for (const p of particles) {
          const px = ((p.x + Math.sin(elapsed * 0.7 + p.phase) * 0.05 + 1) % 1) * w;
          const py = ((1 - ((p.y + elapsed * p.speedY) % 1)) + 1) % 1 * h;
          const alpha = 0.35 + 0.35 * Math.sin(elapsed * 2 + p.phase);
          ctx.fillStyle =
            shaderPreset === 'dragon-caldera'
              ? `rgba(249, 115, 22, ${alpha.toFixed(2)})`
              : shaderPreset === 'anime-sky-islands'
              ? `rgba(251, 191, 36, ${alpha.toFixed(2)})`
              : `rgba(52, 211, 153, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame(performance.now());
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [shaderPreset, accentColor, isPlaying, playbackSpeed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / Math.max(1, rect.width),
      y: (e.clientY - rect.top) / Math.max(1, rect.height),
      active: true
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden bg-slate-900 select-none ${className}`}
      data-state={isPlaying ? 'playing' : 'paused'}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className={`w-full h-full ${objectFitClass}`}
          playsInline
          loop
          muted={muted}
        />
      ) : !imgError && imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-full h-full ${objectFitClass} transition-transform duration-300`}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-400 text-xs font-mono"
        >
          <span>{title}</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
