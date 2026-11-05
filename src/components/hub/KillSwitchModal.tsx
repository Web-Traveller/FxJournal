import React from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { HubClient } from '../../lib/hub';
import { AlertOctagon } from 'lucide-react';

export const KillSwitchModal: React.FC = () => {
  const { isKillSwitched, killSwitchMessage } = useJournalStore();

  if (!isKillSwitched) return null;

  const handleClose = () => {
    HubClient.setSimulatedBlocked(false);
    useJournalStore.setState({ isKillSwitched: false, killSwitchMessage: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-red-900/60 rounded-xl w-full max-w-md shadow-2xl p-6 text-slate-200 font-sans">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              FxJournal Fatal System Exception
            </h2>
            <p className="text-xs text-red-400 font-mono mt-1">
              STATUS_CRITICAL_INIT_FAILURE (0x8004100E)
            </p>
          </div>
        </div>

        <div className="mt-5 p-3.5 bg-black/50 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 leading-relaxed">
          {killSwitchMessage || 'Application Error: The software encountered an unexpected initialization failure (Error 0x8004100E). Please contact developer support.'}
          <div className="mt-2 text-[11px] text-neutral-500">
            Fault Module: fxjournal_core.dll | Workstation validation rejected by server policy.
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 font-mono">
            Support: admin@fxjournal.internal
          </span>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg border border-neutral-700 transition"
          >
            Dismiss Test Screen
          </button>
        </div>
      </div>
    </div>
  );
};
