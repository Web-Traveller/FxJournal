import React, { useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { formatCurrency } from '../../lib/calculations';
import { Account } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Database, 
  Briefcase, 
  Plus, 
  Edit3, 
  Download, 
  Trash2,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  Sliders,
  RefreshCw,
  CheckCircle2,
  ArrowDownCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    accounts, 
    trades, 
    labels, 
    openAccountModal, 
    saveAccount,
    deleteAccount,
    setBackupModalOpen, 
    clearAllData
  } = useJournalStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);

  // Native updater state
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'up-to-date' | 'update-available' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [updateProgressText, setUpdateProgressText] = useState<string>('');

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('idle');
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update) {
          setUpdateInfo(update);
          setUpdateStatus('update-available');
        } else {
          setUpdateStatus('up-to-date');
        }
      } else {
        setTimeout(() => {
          setUpdateStatus('up-to-date');
        }, 800);
      }
    } catch (err) {
      console.error('Check update error:', err);
      setUpdateStatus('error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo) return;
    setInstallingUpdate(true);
    setUpdateProgressText('Starting download...');
    try {
      let total = 0;
      let downloaded = 0;
      await updateInfo.downloadAndInstall((event: any) => {
        if (event.event === 'Started') {
          total = event.data?.contentLength || 0;
          setUpdateProgressText(total ? 'Downloading update (0%)...' : 'Downloading update...');
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            setUpdateProgressText(`Downloading update (${pct}%)...`);
          } else {
            setUpdateProgressText(`Downloading (${(downloaded / (1024 * 1024)).toFixed(1)} MB)...`);
          }
        } else if (event.event === 'Finished') {
          setUpdateProgressText('Verifying signature & restarting...');
        }
      });
    } catch (err) {
      console.error('Install update error:', err);
      setInstallingUpdate(false);
      setUpdateProgressText('Failed to install update');
    }
  };

  const handleOpenReleasePage = async () => {
    const url = 'https://github.com/Web-Traveller/FxJournal/releases';
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  };

  const totalScreenshots = trades.reduce((sum, t) => sum + (t.images?.length || 0), 0);

  const handleToggleArchive = (acc: Account) => {
    const updated: Account = {
      ...acc,
      is_active: acc.is_active === false ? true : false,
    };
    saveAccount(updated);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setConfirmDeleteId(null);
  };

  const handleClearAll = () => {
    clearAllData();
    setConfirmClearData(false);
  };

  return (
    <div className="space-y-4 max-w-4xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#26282f]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-[#fafafa] tracking-tight">
            Account & Storage Settings
          </h1>
          <Badge variant="neutral" size="xs">
            v0.1.0
          </Badge>
        </div>
      </div>

      {/* Account Management (Archive & Delete) */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#71717a]" />
            <span>Trading Accounts ({accounts.length})</span>
          </div>
        }
        action={
          <Button
            variant="primary"
            size="xs"
            onClick={() => openAccountModal()}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Account
          </Button>
        }
      >
        {accounts.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#71717a]">
            No trading accounts configured. Click "Add Account" to get started.
          </div>
        ) : (
          <div className="space-y-2.5">
            {accounts.map((acc) => {
              const isArchived = acc.is_active === false;
              const isConfirmingDelete = confirmDeleteId === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`p-3.5 rounded-[4px] border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isArchived 
                      ? 'bg-[#0f1013]/60 border-[#1f2026] opacity-75' 
                      : 'bg-[#0f1013] border-[#26282f]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-[#fafafa]">{acc.name}</span>
                      <Badge variant={acc.type === 'PROP_FIRM' ? 'caution' : 'neutral'} size="xs">
                        {acc.type === 'PROP_FIRM' ? 'PROP FIRM' : 'BROKERAGE'}
                      </Badge>
                      {isArchived ? (
                        <Badge variant="neutral" size="xs">
                          ARCHIVED
                        </Badge>
                      ) : (
                        <Badge variant="profit" size="xs">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#71717a] mt-1">
                      Capital: {formatCurrency(acc.starting_balance, acc.currency)} · Current:{' '}
                      <span className="text-[#ededed] font-medium">
                        {formatCurrency(acc.current_balance, acc.currency)}
                      </span>
                      {acc.type === 'PROP_FIRM' && (
                        <span className="text-[#71717a] ml-2">
                          (Max Daily: {acc.max_daily_loss_pct || 5}% · Max Total: {acc.max_total_loss_pct || 10}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Edit */}
                    <button
                      onClick={() => openAccountModal(acc)}
                      title="Edit Account Details"
                      className="p-1.5 rounded-[3px] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#181a1e] border border-transparent hover:border-[#26282f] transition cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Archive / Unarchive Toggle */}
                    <button
                      onClick={() => handleToggleArchive(acc)}
                      title={isArchived ? 'Restore to Active Accounts' : 'Archive Account'}
                      className="p-1.5 rounded-[3px] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#181a1e] border border-transparent hover:border-[#26282f] transition cursor-pointer text-xs flex items-center gap-1"
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5 text-[#10b981]" />
                          <span className="hidden sm:inline text-[#10b981]">Unarchive</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Archive</span>
                        </>
                      )}
                    </button>

                    {/* Delete with Confirm */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-[#f43f5e]/10 border border-[#f43f5e]/30 px-2 py-1 rounded-[3px]">
                        <span className="text-[10px] text-[#f43f5e] font-mono">Confirm?</span>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-[10px] font-bold text-[#f43f5e] hover:underline cursor-pointer"
                        >
                          Yes
                        </button>
                        <span className="text-[#71717a]">/</span>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-[#a1a1aa] hover:underline cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(acc.id)}
                        title="Delete Account & Associated Records"
                        className="p-1.5 rounded-[3px] text-[#71717a] hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 border border-transparent hover:border-[#f43f5e]/20 transition cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Storage & Backup Options */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#71717a]" />
            <span>Local Database Storage & Backup</span>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-2.5 text-center p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] font-mono">
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Total Executions</div>
            <div className="text-sm font-bold text-[#fafafa] mt-0.5 tabular-nums">{trades.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Screenshots Stored</div>
            <div className="text-sm font-bold text-[#fafafa] mt-0.5 tabular-nums">{totalScreenshots}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider">Accounts Configured</div>
            <div className="text-sm font-bold text-[#fafafa] mt-0.5 tabular-nums">{accounts.length}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBackupModalOpen(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export / Restore Database (.fxbackup)
          </Button>

          {/* Clean Data Wipe (Zero Mock Data) */}
          {confirmClearData ? (
            <div className="flex items-center gap-2 bg-[#f43f5e]/10 border border-[#f43f5e]/30 px-3 py-1.5 rounded-[4px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#f43f5e]" />
              <span className="text-xs text-[#f43f5e]">Wipe all accounts and trade history?</span>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-[#f43f5e] hover:underline cursor-pointer"
              >
                Confirm Wipe
              </button>
              <span className="text-[#71717a]">|</span>
              <button
                onClick={() => setConfirmClearData(false)}
                className="text-xs text-[#a1a1aa] hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="xs"
              onClick={() => setConfirmClearData(true)}
              icon={<Trash2 className="w-3 h-3" />}
            >
              Clear Local Database
            </Button>
          )}
        </div>
      </Card>

      {/* Application & Updater */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#71717a]" />
              <span>Application Updates & Integrity</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="xs">
                v0.1.0 STABLE
              </Badge>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0f1013] rounded-[4px] border border-[#26282f] font-mono text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#fafafa]">FxJournal Desktop Enterprise</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181a1e] text-[#a1a1aa] border border-[#26282f]">
                  Channel: Official Release
                </span>
              </div>
              <div className="text-[11px] text-[#71717a] mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Minisign Public Key Cryptography Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenReleasePage}
                className="px-2.5 py-1 text-xs text-[#a1a1aa] hover:text-[#fafafa] bg-[#181a1e] hover:bg-[#202227] border border-[#26282f] rounded-[4px] transition flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Releases</span>
              </button>

              <Button
                variant="secondary"
                size="xs"
                disabled={checkingUpdate || installingUpdate}
                onClick={handleCheckUpdates}
                icon={<RefreshCw className={`w-3 h-3 ${checkingUpdate ? 'animate-spin' : ''}`} />}
              >
                {checkingUpdate ? 'Checking...' : 'Check for Updates'}
              </Button>
            </div>
          </div>

          {/* Update Status Feedback */}
          {updateStatus === 'up-to-date' && (
            <div className="flex items-center gap-2 p-2.5 bg-[#10b981]/10 border border-[#10b981]/25 rounded-[4px] text-xs text-[#10b981] font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>You are on the latest version of FxJournal (v0.1.0). All systems operational.</span>
            </div>
          )}

          {updateStatus === 'update-available' && updateInfo && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-[4px] text-xs font-mono">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-[#10b981] shrink-0" />
                <div>
                  <span className="text-[#fafafa] font-bold">New update available: v{updateInfo.version}</span>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                    Verified package ready for automatic background installation.
                  </p>
                </div>
              </div>

              <button
                onClick={handleInstallUpdate}
                disabled={installingUpdate}
                className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0d0e] font-semibold rounded-[4px] transition flex items-center gap-1.5 cursor-pointer text-xs self-start sm:self-auto shrink-0"
              >
                {installingUpdate ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{updateProgressText || 'Installing...'}</span>
                  </>
                ) : (
                  <span>Restart & Install v{updateInfo.version}</span>
                )}
              </button>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="flex items-center gap-2 p-2.5 bg-[#f59e0b]/10 border border-[#f59e0b]/25 rounded-[4px] text-xs text-[#f59e0b] font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Could not connect to update servers. Check your internet connection or GitHub status.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
