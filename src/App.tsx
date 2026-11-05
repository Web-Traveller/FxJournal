import React, { useEffect } from 'react';
import { useJournalStore } from './stores/useJournalStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TradeTable } from './components/trades/TradeTable';
import { OpenPositionsView } from './components/trades/OpenPositionsView';
import { PropFirmGuards } from './components/propfirm/PropFirmGuards';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { TradeDialog } from './components/trades/TradeDialog';
import { CloseTradeModal } from './components/trades/CloseTradeModal';
import { AccountModal } from './components/accounts/AccountModal';
import { LightboxModal } from './components/screenshots/LightboxModal';
import { BackupModal } from './components/backup/BackupModal';
import { KillSwitchModal } from './components/hub/KillSwitchModal';
import { UpdateBanner } from './components/updater/UpdateBanner';

export const App: React.FC = () => {
  const { 
    initialize, 
    activeTab, 
    openTradeDialog, 
    closeTradeDialog, 
    closeLightbox, 
    closeAccountModal,
    closeCloseTradeModal,
    setBackupModalOpen 
  } = useJournalStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openTradeDialog();
      } else if (e.key === 'Escape') {
        closeTradeDialog();
        closeLightbox();
        closeAccountModal();
        closeCloseTradeModal();
        setBackupModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openTradeDialog, 
    closeTradeDialog, 
    closeLightbox, 
    closeAccountModal, 
    closeCloseTradeModal, 
    setBackupModalOpen
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-obsidian-950 text-slate-100 font-sans select-none">
      {/* Smart In-App Update Banner */}
      <UpdateBanner />

      {/* Main App Navigation Header */}
      <Header />

      {/* Body with Sidebar & Content Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 bg-obsidian-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'journal' && <TradeTable />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'open-trades' && <OpenPositionsView />}
            {activeTab === 'propfirm' && <PropFirmGuards />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Application Modals */}
      <TradeDialog />
      <CloseTradeModal />
      <AccountModal />
      <LightboxModal />
      <BackupModal />
      <KillSwitchModal />
    </div>
  );
};

export default App;
