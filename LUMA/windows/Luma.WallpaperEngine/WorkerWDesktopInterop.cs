using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace Luma.WallpaperEngine
{
    /// <summary>
    /// Native Windows 10 / 11 Desktop WorkerW Host & Hardware-Accelerated Video Loop Coordinator.
    /// Locates "Progman", dispatches undocumented message 0x052C to spawn the WorkerW layer
    /// behind SHELLDLL_DefView (desktop icons), attaches per-monitor Direct3D11 / MediaFoundation
    /// child windows, and monitors power, lock state, and fullscreen Direct3D/Vulkan games.
    /// </summary>
    public sealed class WorkerWDesktopInterop : IDisposable
    {
        private const uint WM_SPAWN_WORKER = 0x052C;
        private const uint SMTO_NORMAL = 0x0000;
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int WS_EX_TOOLWINDOW = 0x00000080;

        public enum QUERY_USER_NOTIFICATION_STATE
        {
            QUNS_NOT_PRESENT = 1,
            QUNS_BUSY = 2,
            QUNS_RUNNING_D3D_FULL_SCREEN = 3,
            QUNS_PRESENTATION_MODE = 4,
            QUNS_ACCEPTS_NOTIFICATIONS = 5,
            QUNS_QUIET_TIME = 6,
            QUNS_APP = 7
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct SYSTEM_POWER_STATUS
        {
            public byte ACLineStatus;
            public byte BatteryFlag;
            public byte BatteryLifePercent;
            public byte SystemStatusFlag;
            public int BatteryLifeTime;
            public int BatteryFullLifeTime;
        }

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string lpClassName, string? lpWindowName);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, IntPtr windowTitle);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SendMessageTimeout(
            IntPtr hWnd,
            uint Msg,
            IntPtr wParam,
            IntPtr lParam,
            uint fuFlags,
            uint uTimeout,
            out IntPtr lpdwResult);

        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(
            IntPtr hWnd,
            IntPtr hWndInsertAfter,
            int X,
            int Y,
            int cx,
            int cy,
            uint uFlags);

        [DllImport("shell32.dll")]
        private static extern int SHQueryUserNotificationState(out QUERY_USER_NOTIFICATION_STATE pquns);

        [DllImport("kernel32.dll")]
        private static extern bool GetSystemPowerStatus(out SYSTEM_POWER_STATUS lpSystemPowerStatus);

        private IntPtr _workerWHandle = IntPtr.Zero;
        private readonly Dictionary<string, IntPtr> _monitorHostWindows = new();
        private CancellationTokenSource? _watchdogCts;
        private bool _isLocked;
        private bool _disposed;

        public event EventHandler<EngineRuntimeStateChangedEventArgs>? RuntimeStateChanged;

        /// <summary>
        /// Resolves the WorkerW window situated directly behind SHELLDLL_DefView on Windows 10 & Windows 11 (including 24H2).
        /// Includes safe fallback recovery if Explorer restarts.
        /// </summary>
        public IntPtr AcquireDesktopWorkerW()
        {
            IntPtr progman = FindWindow("Progman", null);
            if (progman == IntPtr.Zero)
            {
                throw new InvalidOperationException("Unable to locate Windows Explorer Progman host window.");
            }

            SendMessageTimeout(
                progman,
                WM_SPAWN_WORKER,
                new IntPtr(0xD),
                new IntPtr(0x1),
                SMTO_NORMAL,
                1000,
                out _);

            IntPtr workerW = IntPtr.Zero;

            EnumWindows((topHandle, _) =>
            {
                IntPtr shellDefView = FindWindowEx(topHandle, IntPtr.Zero, "SHELLDLL_DefView", IntPtr.Zero);
                if (shellDefView != IntPtr.Zero)
                {
                    workerW = FindWindowEx(IntPtr.Zero, topHandle, "WorkerW", IntPtr.Zero);
                }
                return true;
            }, IntPtr.Zero);

            // Windows 11 24H2 raised desktop child fallback
            if (workerW == IntPtr.Zero)
            {
                workerW = FindWindowEx(progman, IntPtr.Zero, "WorkerW", IntPtr.Zero);
            }

            _workerWHandle = workerW != IntPtr.Zero ? workerW : progman;
            return _workerWHandle;
        }

        public void AttachMonitorPlayerWindow(string monitorDeviceName, IntPtr playerHwnd, int x, int y, int width, int height)
        {
            if (_workerWHandle == IntPtr.Zero)
            {
                AcquireDesktopWorkerW();
            }

            int exStyle = GetWindowLong(playerHwnd, GWL_EXSTYLE);
            SetWindowLong(playerHwnd, GWL_EXSTYLE, exStyle | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW);
            SetParent(playerHwnd, _workerWHandle);
            SetWindowPos(playerHwnd, IntPtr.Zero, x, y, width, height, 0x0040 /* SWP_SHOWWINDOW */);
            _monitorHostWindows[monitorDeviceName] = playerHwnd;
        }

        public void DetachAllAndRestoreDesktop()
        {
            foreach (var kvp in _monitorHostWindows)
            {
                if (kvp.Value != IntPtr.Zero)
                {
                    SetParent(kvp.Value, IntPtr.Zero);
                }
            }
            _monitorHostWindows.Clear();
        }

        public void NotifySessionLockState(bool isLocked)
        {
            _isLocked = isLocked;
        }

        public void StartPolicyWatchdog(TimeSpan pollInterval)
        {
            _watchdogCts?.Cancel();
            _watchdogCts = new CancellationTokenSource();
            var token = _watchdogCts.Token;

            Task.Run(async () =>
            {
                while (!token.IsCancellationRequested)
                {
                    SHQueryUserNotificationState(out var notificationState);
                    GetSystemPowerStatus(out var powerStatus);

                    bool isFullscreenGame =
                        notificationState == QUERY_USER_NOTIFICATION_STATE.QUNS_RUNNING_D3D_FULL_SCREEN ||
                        notificationState == QUERY_USER_NOTIFICATION_STATE.QUNS_PRESENTATION_MODE;

                    bool isOnBattery = powerStatus.ACLineStatus == 0;
                    bool isBatterySaver = powerStatus.SystemStatusFlag == 1;

                    RuntimeStateChanged?.Invoke(this, new EngineRuntimeStateChangedEventArgs(
                        isFullscreenGame,
                        isOnBattery,
                        isBatterySaver,
                        _isLocked));

                    await Task.Delay(pollInterval, token).ConfigureAwait(false);
                }
            }, token);
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _watchdogCts?.Cancel();
            DetachAllAndRestoreDesktop();
        }
    }

    public sealed class EngineRuntimeStateChangedEventArgs : EventArgs
    {
        public bool IsFullscreenGameRunning { get; }
        public bool IsOnBatteryPower { get; }
        public bool IsBatterySaverActive { get; }
        public bool IsSessionLocked { get; }

        public EngineRuntimeStateChangedEventArgs(
            bool isFullscreenGameRunning,
            bool isOnBatteryPower,
            bool isBatterySaverActive,
            bool isSessionLocked)
        {
            IsFullscreenGameRunning = isFullscreenGameRunning;
            IsOnBatteryPower = isOnBatteryPower;
            IsBatterySaverActive = isBatterySaverActive;
            IsSessionLocked = isSessionLocked;
        }
    }
}
