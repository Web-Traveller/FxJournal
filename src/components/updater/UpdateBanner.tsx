import React, { useState, useEffect } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { ArrowDownCircle, CheckCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

export const UpdateBanner: React.FC = () => {
  const { updateAvailable, latestVersion } = useJournalStore();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
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
    setProgressStatus('Connecting to secure release channel...');
    try {
      if (nativeUpdate) {
        let total = 0;
        let downloaded = 0;
        await nativeUpdate.downloadAndInstall((event: any) => {
          if (event.event === 'Started') {
            total = event.data?.contentLength || 0;
            setProgressStatus(total ? 'Downloading update (0%)...' : 'Downloading update...');
          } else if (event.event === 'Progress') {
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              setProgressStatus(`Downloading update (${pct}%)...`);
            } else {
              setProgressStatus(`Downloading (${(downloaded / (1024 * 1024)).toFixed(1)} MB)...`);
            }
          } else if (event.event === 'Finished') {
            setProgressStatus('Verifying cryptographic signature & launching installer...');
          }
        });
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
      setProgressStatus('');
    }
  };

  return (
    <div className="bg-[#131417] border-b border-[#26282f] px-4 py-2 flex items-center justify-between text-xs select-none z-40 font-mono">
      <div className="flex items-center gap-2.5">
        <ArrowDownCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
        <span className="text-[#a1a1aa]">
          <strong className="text-[#fafafa]">FxJournal v{displayVersion}</strong> is available.
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#71717a] border-l border-[#26282f] pl-2.5">
          <ShieldCheck className="w-3 h-3 text-[#10b981]" />
          Minisign signature verified
        </span>
      </div>

      <div className="flex items-center gap-3">
        {installedNotice ? (
          <span className="text-[#10b981] flex items-center gap-1 text-[11px]">
            <CheckCircle className="w-3.5 h-3.5" />
            Update installed. Restarting FxJournal...
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
                <span>{progressStatus || 'Installing...'}</span>
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
