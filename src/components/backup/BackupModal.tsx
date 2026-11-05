import React, { useRef, useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { JournalStorage } from '../../lib/storage';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, Download, Upload, CheckCircle, AlertTriangle, Database } from 'lucide-react';

export const BackupModal: React.FC = () => {
  const { isBackupModalOpen, setBackupModalOpen } = useJournalStore();
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackupModalOpen) return null;

  const handleExport = () => {
    try {
      const jsonBackup = JournalStorage.exportFullBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FxJournal_Database_${new Date().toISOString().slice(0, 10)}.fxbackup`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage({ text: 'Backup snapshot exported successfully.' });
    } catch (err) {
      setStatusMessage({ text: 'Failed to create backup export.', error: true });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = JournalStorage.importFullBackup(content);
      if (success) {
        setStatusMessage({ text: 'Database restored successfully! Reloading data...' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setStatusMessage({ text: 'Invalid backup file or corrupt format.', error: true });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadTestSnapshot = async () => {
    try {
      const res = await fetch('/test_sample_database.fxbackup');
      if (!res.ok) throw new Error('Test database file not found');
      const text = await res.text();
      const success = JournalStorage.importFullBackup(text);
      if (success) {
        setStatusMessage({ text: 'Institutional test database loaded! Reloading data...' });
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setStatusMessage({ text: 'Failed to import test database format.', error: true });
      }
    } catch (err) {
      setStatusMessage({ text: 'Could not load test snapshot file.', error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-[#131417] border border-[#26282f] rounded-[6px] w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#26282f] flex items-center justify-between bg-[#0f1013]">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#fafafa]">Database Backup & Snapshots</h3>
            <Badge variant="neutral" size="xs">OFFLINE</Badge>
          </div>
          <button
            onClick={() => setBackupModalOpen(false)}
            className="p-1 rounded-[4px] text-[#71717a] hover:text-[#ededed] hover:bg-[#181a1e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {statusMessage && (
            <div
              className={`p-2.5 rounded-[4px] border text-xs flex items-center gap-2 font-mono ${
                statusMessage.error
                  ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-[#10b981]'
              }`}
            >
              {statusMessage.error ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export Action */}
          <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-[#fafafa]">Export Full Database</h4>
              <p className="text-[11px] text-[#71717a] font-mono mt-0.5">
                Download .fxbackup with accounts, trades & markups
              </p>
            </div>
            <Button
              variant="primary"
              size="xs"
              onClick={handleExport}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
          </div>

          {/* Import Action */}
          <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-[#fafafa]">Restore Snapshot</h4>
              <p className="text-[11px] text-[#71717a] font-mono mt-0.5">
                Restore database from an existing .fxbackup file
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".fxbackup,.json"
                className="hidden"
              />
              <Button
                variant="secondary"
                size="xs"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                Select
              </Button>
            </div>
          </div>

          {/* Institutional Test Snapshot */}
          <div className="p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold text-[#fafafa]">Institutional Test Dataset</h4>
                <Badge variant="neutral" size="xs">EVALUATION</Badge>
              </div>
              <p className="text-[11px] text-[#71717a] font-mono mt-0.5">
                Sample Prop Firm & Personal accounts, trades, partials & open positions
              </p>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleLoadTestSnapshot}
              icon={<Database className="w-3.5 h-3.5 text-[#34d399]" />}
            >
              Load Test DB
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
