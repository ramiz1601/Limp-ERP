import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DbProvider, useDb } from './context/DbContext';
import { Sidebar, MenuItemId } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { SecurityGate } from './components/SecurityGate';

// Views
import { DashboardView } from './views/DashboardView';
import { VehiclesView } from './views/VehiclesView';
import { DriversView } from './views/DriversView';
import { AssignmentsView } from './views/AssignmentsView';
import { HandoverReturnView } from './views/HandoverReturnView';
import { MileageView } from './views/MileageView';
import { ContractsView } from './views/ContractsView';
import { PaymentsView } from './views/PaymentsView';
import { FinancingView } from './views/FinancingView';
import { IncomeExpenseView } from './views/IncomeExpenseView';
import { MaintenanceView } from './views/MaintenanceView';
import { DocumentsExpiryView } from './views/DocumentsExpiryView';
import { EmployeesView } from './views/EmployeesView';
import { ReportsView } from './views/ReportsView';
import { SettingsAuditView } from './views/SettingsAuditView';
import { VehicleHistoryView } from './views/VehicleHistoryView';

const AppContent: React.FC = () => {
  const { settings } = useDb();
  const [activeMenu, setActiveMenu] = useState<MenuItemId>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if terminal security passcode has already been unlocked in this session/browser
  const [isSecurityUnlocked, setIsSecurityUnlocked] = useState<boolean>(() => {
    return (
      localStorage.getItem('prince_erp_security_auth') === 'true' ||
      sessionStorage.getItem('prince_erp_security_auth') === 'true'
    );
  });

  const handleLockTerminal = () => {
    localStorage.removeItem('prince_erp_security_auth');
    sessionStorage.removeItem('prince_erp_security_auth');
    setIsSecurityUnlocked(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Vehicle':
        setActiveMenu('Vehicles');
        break;
      case 'Add Driver':
        setActiveMenu('All Drivers');
        break;
      case 'New Contract':
        setActiveMenu('Contracts');
        break;
      case 'Record Payment':
        setActiveMenu('Payments');
        break;
      case 'Add Expense':
        setActiveMenu('Expenses');
        break;
      case 'Handover Vehicle':
        setActiveMenu('Handover / Return');
        break;
      case 'Upload Document':
        setActiveMenu('Documents & Expiry');
        break;
      default:
        break;
    }
  };

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return (
          <DashboardView
            onNavigate={(menu) => setActiveMenu(menu)}
            onOpenQuickAction={handleQuickAction}
          />
        );
      case 'Vehicles':
        return <VehiclesView key="vehicles-view" />;
      case 'Vehicle History':
        return <VehicleHistoryView key="vehicle-history-view" />;
      case 'All Drivers':
        return <DriversView key="drivers-all" filterType="All" />;
      case 'Company Drivers':
        return <DriversView key="drivers-company" filterType="Company Driver" />;
      case 'Outside/NOC Drivers':
        return <DriversView key="drivers-noc" filterType="Outside/NOC Driver" />;
      case 'Assignments':
        return <AssignmentsView key="assignments-view" />;
      case 'Handover / Return':
        return <HandoverReturnView key="handover-view" />;
      case 'Mileage':
        return <MileageView key="mileage-view" />;
      case 'Contracts':
        return <ContractsView key="contracts-view" />;
      case 'Payments':
        return <PaymentsView key="payments-all" initialTab="payments" />;
      case 'Rent Due':
        return <PaymentsView key="payments-due" initialTab="due" />;
      case 'Outstanding':
        return <PaymentsView key="payments-outstanding" initialTab="outstanding" />;
      case 'Vehicle Financing':
        return <FinancingView key="financing-plans" initialTab="plans" />;
      case 'Installments':
        return <FinancingView key="financing-installments" initialTab="installments" />;
      case 'Income':
        return <IncomeExpenseView key="income-tab" initialTab="Income" />;
      case 'Expenses':
        return <IncomeExpenseView key="expenses-tab" initialTab="Expenses" />;
      case 'Profit & Loss':
        return <IncomeExpenseView key="pnl-tab" initialTab="Profit & Loss" />;
      case 'Maintenance':
        return <MaintenanceView key="maintenance-view" />;
      case 'Documents & Expiry':
      case 'Notifications':
        return <DocumentsExpiryView key="documents-view" />;
      case 'Employees':
        return <EmployeesView key="employees-view" />;
      case 'Reports':
        return <ReportsView key="reports-view" />;
      case 'Settings':
        return <SettingsAuditView key="settings-view" initialTab="Settings" />;
      case 'Audit Logs':
        return <SettingsAuditView key="audit-logs-view" initialTab="AuditLogs" />;
      default:
        return (
          <DashboardView
            onNavigate={(menu) => setActiveMenu(menu)}
            onOpenQuickAction={handleQuickAction}
          />
        );
    }
  };

  // Gate access if security login is required and not yet unlocked
  if (settings.requireSecurityLogin !== false && !isSecurityUnlocked) {
    return (
      <SecurityGate
        settings={settings}
        onAuthenticated={() => setIsSecurityUnlocked(true)}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f8fb]">
      {/* Sidebar navigation */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => {
          setActiveMenu(menu);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <TopHeader
          activeMenuTitle={activeMenu}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigate={(menu) => setActiveMenu(menu)}
          onLockTerminal={handleLockTerminal}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DbProvider>
        <AppContent />
      </DbProvider>
    </AuthProvider>
  );
}

export default App;
