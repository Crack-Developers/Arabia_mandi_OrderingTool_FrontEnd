import { useEffect } from 'react';
import { useERPStore } from './stores/erp.store';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { BranchConfig } from './components/admin/BranchConfig';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OrderManagementPage } from './components/admin/OrderManagementPage';
import { SyncQueueScreen } from './components/admin/SyncQueueScreen';
import { DishSummaryPage } from './components/admin/DishSummaryPage';
import { PrintModal } from './components/pos/PrintModal';
import { PrinterMenuRoutingPage } from './components/printers/PrinterMenuRoutingPage';
import { PrinterManagementDashboard } from './components/printers/PrinterManagementDashboard';
import { initCloudSocket, disconnectCloudSocket } from './services/socket.service';

export function App() {
  const {
    isAuthenticated,
    activeScreen,
    currentUser,
    fetchBranches,
    fetchTables,
    fetchMenuData,
    fetchStaffList,
    fetchPrinters,
    checkSyncStatus,
    logout,
  } = useERPStore();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('erp_token');
      if (!token) {
        logout();
        return;
      }
      fetchBranches();
      if (currentUser?.branchId && currentUser.branchAccess !== 'All Branches') {
        fetchTables(currentUser.branchId);
      } else {
        fetchTables();
      }
      fetchMenuData();
      fetchStaffList();
      fetchPrinters();
      checkSyncStatus();
      initCloudSocket();

      const syncInterval = setInterval(() => {
        checkSyncStatus();
      }, 10_000);
      return () => {
        clearInterval(syncInterval);
        disconnectCloudSocket();
      };
    }
  }, [isAuthenticated, currentUser?.branchId]);

  if (!isAuthenticated || !localStorage.getItem('erp_token')) {
    return <LoginPage />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'BRANCH_SETTINGS':
        return <BranchConfig />;
      case 'ADMIN_ANALYTICS':
        return <AdminDashboard />;
      case 'ADMIN_DISH_SUMMARY':
        return <DishSummaryPage />;
      case 'ORDERS_HISTORY':
        return <OrderManagementPage />;
      case 'SYNC_QUEUE':
        return <SyncQueueScreen />;
      case 'PRINTER_MANAGEMENT':
        return <PrinterManagementDashboard />;
      case 'PRINTER_ROUTING':
        return <PrinterMenuRoutingPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Top Application Navbar */}
      <Navbar />

      {/* Body Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Modal Dialogs */}
      <PrintModal />
    </div>
  );
}

export default App;
