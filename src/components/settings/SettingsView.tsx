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
  Sliders
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
    </div>
  );
};
