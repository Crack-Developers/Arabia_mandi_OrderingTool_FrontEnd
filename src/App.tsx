import { useERPStore } from './stores/erp.store';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { ReceptionDashboard } from './components/pos/ReceptionDashboard';
import { TableManagementScreen } from './components/tables/TableManagementScreen';
import { MenuManager } from './components/menu/MenuManager';
import { BranchConfig } from './components/admin/BranchConfig';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OrderManagementPage } from './components/admin/OrderManagementPage';
import { SyncQueueScreen } from './components/admin/SyncQueueScreen';
import { PrintModal } from './components/pos/PrintModal';
import { TableModals } from './components/pos/TableModals';

export function App() {
  const { isAuthenticated, activeScreen } = useERPStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'POS_WORKSPACE':
        return <ReceptionDashboard />;
      case 'TABLE_LAYOUT':
        return <TableManagementScreen />;
      case 'MENU_MANAGER':
        return <MenuManager />;
      case 'BRANCH_SETTINGS':
        return <BranchConfig />;
      case 'ADMIN_ANALYTICS':
        return <AdminDashboard />;
      case 'ORDERS_HISTORY':
        return <OrderManagementPage />;
      case 'SYNC_QUEUE':
        return <SyncQueueScreen />;
      default:
        return <ReceptionDashboard />;
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
      <TableModals />
    </div>
  );
}

export default App;
