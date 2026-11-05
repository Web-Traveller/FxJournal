import React, { useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { ArrowDownCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

export const UpdateBanner: React.FC = () => {
  const { updateAvailable, latestVersion } = useJournalStore();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  if (!updateAvailable || dismissed) return null;

  const handleInstallNow = () => {
    setInstalling(true);
    setTimeout(() => {
      setInstalling(false);
      setInstalledNotice(true);
    }, 1500);
  };

  return (
    <div className="bg-[#131417] border-b border-[#26282f] px-4 py-2 flex items-center justify-between text-xs select-none z-40 font-mono">
      <div className="flex items-center gap-2.5">
        <ArrowDownCircle className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
        <span className="text-[#a1a1aa]">
          <strong className="text-[#fafafa]">FxJournal v{latestVersion}</strong> is ready. Update staged for next launch.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {installedNotice ? (
          <span className="text-[#10b981] flex items-center gap-1 text-[11px]">
            <CheckCircle className="w-3.5 h-3.5" />
            Update will apply upon next launch
          </span>
        ) : (
          <button
            onClick={handleInstallNow}
            disabled={installing}
            className="px-2.5 py-1 bg-[#fafafa] hover:bg-[#ededed] text-[#0c0d0e] rounded-[4px] font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {installing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Preparing...</span>
              </>
            ) : (
              <span>Restart & Install Now</span>
            )}
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-[#71717a] hover:text-[#fafafa] p-1 rounded-[4px] transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
