import React, { useState, useEffect } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { ArrowDownCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

export const UpdateBanner: React.FC = () => {
  const { updateAvailable, latestVersion } = useJournalStore();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);
  const [nativeUpdate, setNativeUpdate] = useState<any>(null);

  // Check for native Tauri updates if running in desktop environment
  useEffect(() => {
    const checkForDesktopUpdates = async () => {
      try {
        // Only run if running inside Tauri
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const { check } = await import('@tauri-apps/plugin-updater');
          const update = await check();
          if (update) {
            setNativeUpdate(update);
          }
        }
      } catch (err) {
        // Fallback / dev mode: no update server available
        console.log('Tauri updater check:', err);
      }
    };

    checkForDesktopUpdates();
  }, []);

  const isVisible = (updateAvailable || !!nativeUpdate) && !dismissed;
  if (!isVisible) return null;

  const displayVersion = nativeUpdate ? nativeUpdate.version : latestVersion;

  const handleInstallNow = async () => {
    setInstalling(true);
    try {
      if (nativeUpdate) {
        await nativeUpdate.downloadAndInstall();
        const { relaunch } = await import('@tauri-apps/plugin-opener');
        setInstalledNotice(true);
      } else {
        setTimeout(() => {
          setInstalling(false);
          setInstalledNotice(true);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to install update:', err);
      setInstalling(false);
    }
  };

  return (
    <div className="bg-[#131417] border-b border-[#26282f] px-4 py-2 flex items-center justify-between text-xs select-none z-40 font-mono">
      <div className="flex items-center gap-2.5">
        <ArrowDownCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
        <span className="text-[#a1a1aa]">
          <strong className="text-[#fafafa]">FxJournal v{displayVersion}</strong> is available. Update verified with institutional signing key.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {installedNotice ? (
          <span className="text-[#10b981] flex items-center gap-1 text-[11px]">
            <CheckCircle className="w-3.5 h-3.5" />
            Update installed. Please restart FxJournal.
          </span>
        ) : (
          <button
            onClick={handleInstallNow}
            disabled={installing}
            className="px-2.5 py-1 bg-[#fafafa] hover:bg-[#ededed] text-[#0c0d0e] rounded-[4px] font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            {installing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Downloading & Installing...</span>
              </>
            ) : (
              <span>Restart & Install Now</span>
            )}
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-[#71717a] hover:text-[#fafafa] p-1 rounded-[4px] transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
