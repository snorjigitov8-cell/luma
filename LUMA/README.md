# LUMA — Production Architecture, Benchmark Plan, Installation & Testing Guide

## 1. Platform Architecture Overview

- **Windows 10 & Windows 11 (`LUMA/windows/`)**:
  - `.NET 8` + `WPF/WinUI` + `WorkerWDesktopInterop.cs` (`0x052C` `Progman` message dispatch to locate `SHELLDLL_DefView` and attach hardware-accelerated Direct3D11/MediaFoundation swapchains behind desktop icons).
  - Supports multi-monitor independent assignments or single-wallpaper span mode.
  - Automatic `SHQueryUserNotificationState` polling to pause when fullscreen Direct3D/Vulkan games run, `GetSystemPowerStatus` battery detection, and `WTSRegisterSessionNotification` OS lock suspension.
- **Android (`LUMA/android/`)**:
  - `Kotlin` + `Jetpack Compose` + `LumaVideoWallpaperService.kt` (`WallpaperService` + `Media3 ExoPlayer`).
  - Zero-black-frame seamless loops with `Player.REPEAT_MODE_ONE` and `C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING`.
  - Releases and pauses decoding immediately inside `onVisibilityChanged(false)` and `onSurfaceDestroyed`.
- **Shared Backend & Web Studio (`server.ts`, `LUMA/backend/prisma/schema.prisma`)**:
  - Node.js + TypeScript + Express + PostgreSQL/Prisma schema + persistent local JSON store for immediate zero-config execution.
  - Server-side `@google/genai` adapter for AI Wallpaper Studio.

## 2. Performance Benchmark Methodology (1080p / 1440p / 4K / 8K)

No unverified performance numbers are claimed without running hardware benchmarks on target rigs. Run the following benchmark matrix before release sign-off:

1. **1920×1080 (60 FPS H.264 / VP9 10s loop)**:
   - Measure steady-state GPU Video Decode engine utilization via Windows Performance Recorder (`WPR`) / `adb shell dumpsys gfxinfo`.
   - Target budget: `< 2%` CPU, hardware NVDEC/D3D11VA zero-copy texture binding, zero frame drops across 1,000 loop iterations.
2. **2560×1440 (60 FPS HEVC / WebM)**:
   - Verify dual-monitor independent playback memory ceiling stays flat over 12 hours (no handle or unmanaged COM reference leaks).
3. **3840×2160 (4K 60 FPS)**:
   - Measure transition latency (< 150ms) when launching a fullscreen DirectX 12 title (`QUNS_RUNNING_D3D_FULL_SCREEN` -> decoder paused, GPU 3D/Video utilization drops to `0.0%`).
4. **7680×4320 (8K 60 FPS, where hardware decoder supports AV1/HEVC 8K)**:
   - Validate automatic fallback to 4K proxy stream if `MediaCodecInfo.CodecCapabilities` or DXVA2 reports max resolution `< 7680x4320`.

## 3. Windows Installer & Android Release Packaging

- **Windows Installer (`Inno Setup / MSIX`)**:
  - Build: `dotnet publish LUMA/windows/Luma.Desktop/Luma.Desktop.csproj -c Release -r win-x64 --self-contained false`
  - Preserves `%LOCALAPPDATA%\LUMA\settings.json` and cached wallpapers across upgrades and uninstallations unless user selects "Remove personal cache".
- **Android Release APK / AAB**:
  - Debug build: `./gradlew :app:assembleDebug`
  - Release bundle: `./gradlew :app:bundleRelease` with `signingConfigs.release` reading keystore credentials from environment variables (`LUMA_KEYSTORE_PATH`, `LUMA_KEY_ALIAS`).
