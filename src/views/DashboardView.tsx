import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { MenuItemId } from '../components/Sidebar';
import {
  Car,
  Users,
  Clock,
  Coins,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  MapPin,
  FilePlus,
  UserPlus,
  CreditCard,
  FileText,
  Wrench,
  Upload,
  BarChart2,
  Activity,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (menu: MenuItemId) => void;
  onOpenQuickAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickAction,
}) => {
  const {
    vehicles,
    drivers,
    contracts,
    assignments,
    payments,
    income,
    expenses,
    documents,
    auditLogs,
    settings,
    seedDemoData,
  } = useDb();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-GB', {
          timeZone: 'Asia/Qatar',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Calculations for KPIs
  const totalVehicles = vehicles.filter((v) => v.status !== 'Sold' && v.status !== 'Inactive').length;
  const onRentVehicles = vehicles.filter((v) => v.status === 'On Rent').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance').length;
  const totalDrivers = drivers.length;

  // Expiring documents
  const today = new Date();
  const warningDays = settings.warning1Days || 30;
  const expiringDocsList = documents.filter((d) => {
    if (!d.expiry) return false;
    const exp = new Date(d.expiry);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= warningDays;
  });
  const expiringCount = expiringDocsList.length;

  // Monthly Revenue (Current Month income)
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthlyRevenue = income
    .filter((i) => i.date?.startsWith(currentYearMonth))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Financial summary
  const totalIncome = income.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Expected rent vs actual collected
  const totalActiveRentDue = contracts
    .filter((c) => c.status === 'Active')
    .reduce((acc, c) => acc + (Number(c.monthlyAmount) || 0), 0);
  const collectionRate = totalActiveRentDue > 0 ? Math.min(100, Math.round((monthlyRevenue / totalActiveRentDue) * 100)) : 100;

  // Vehicle Status Counts
  const otherVehicles = vehicles.filter(
    (v) => !['On Rent', 'Available', 'Maintenance'].includes(v.status)
  ).length;

  // Driver Types
  const companyDriversCount = drivers.filter((d) => d.driverType === 'Company Driver').length;
  const outsideDriversCount = drivers.filter((d) => d.driverType === 'Outside/NOC Driver').length;

  // Top Performing Vehicles
  const vehiclePerformance = vehicles.map((veh) => {
    const vIncome = income
      .filter((i) => i.vehicleId === veh.id || i.vehiclePlate === veh.plate)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const vExpenses = expenses
      .filter((e) => e.vehicleId === veh.id || e.vehiclePlate === veh.plate)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const profit = vIncome - vExpenses;
    const utilization = veh.status === 'On Rent' ? '100%' : veh.status === 'Available' ? '0%' : '50%';
    return {
      vehicle: `${veh.make} ${veh.model} (${veh.plate})`,
      income: vIncome,
      expenses: vExpenses,
      profit,
      utilization,
    };
  }).sort((a, b) => b.profit - a.profit).slice(0, 5);

  // Recent Assignments
  const recentAssignments = assignments.slice(-5).reverse();

  // Recent Collections
  const recentCollections = payments.slice(-5).reverse();

  // Recent Activities
  const recentActivities = auditLogs.slice(-6).reverse();

  // Income vs Expenses Monthly Chart Data (Last 6 Months)
  const chartMonths = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mName = d.toLocaleString('en-US', { month: 'short' });

    const mIncome = income
      .filter((i) => i.date?.startsWith(ym))
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const mExpense = expenses
      .filter((e) => e.date?.startsWith(ym))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return { month: mName, ym, income: mIncome, expense: mExpense };
  });

  const maxChartVal = Math.max(
    1000,
    ...chartMonths.map((m) => Math.max(m.income, m.expense))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Section */}
      <div
        id="dashboard-hero-section"
        className="rounded-2xl bg-gradient-to-r from-[#0c1b2d] via-[#13283f] to-[#1f3a5e] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#1f3a5e]"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-[#c9a15b]/15 to-transparent rounded-full pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#e5c47d] mb-3 backdrop-blur-xs border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#c9a15b]"></span>
              Qatar Limo • Premium Mobility
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Premium Mobility <span className="text-[#e5c47d]">for a Brighter Qatar</span>
            </h1>
            <p className="text-sm text-[#a1b3c9] font-medium tracking-wide">
              Reliable People | Exceptional Vehicles | Lasting Journeys
            </p>
          </div>

          {/* Date / Time / Location Info Area */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-right min-w-[200px]">
            <div className="flex items-center justify-end gap-1.5 text-xs text-[#e5c47d] font-bold">
              <MapPin className="w-3.5 h-3.5" /> Doha, Qatar
            </div>
            <div className="text-lg font-bold text-white tracking-wide mt-1 font-mono">
              {currentTime || 'Loading Qatar Time...'}
            </div>
            <div className="text-[11px] text-[#a1b3c9] flex items-center justify-end gap-1 mt-1">
              <Calendar className="w-3 h-3" /> Timezone: {settings.timezone || 'Asia/Qatar'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Onboarding Banner when no vehicles are present */}
      {vehicles.length === 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#c9a15b]/15 to-blue-500/10 border border-[#c9a15b]/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#c9a15b] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#122038]">
                Welcome to Qatar Limousine ERP • Instant Setup
              </h3>
              <p className="text-xs text-[#718198] mt-0.5">
                Load authentic Qatar limousine fleet records (Toyota Camry, Changan Alsvin, Lexus ES 350, contracts, QID expiries, and accounting entries) with one click to explore the full ERP system.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                setSeeding(true);
                try {
                  await seedDemoData();
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="px-4 py-2.5 bg-[#0c1b2d] hover:bg-[#13283f] text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#e5c47d]" />
              <span>{seeding ? 'Populating Fleet...' : 'Load Demo Fleet Data'}</span>
            </button>
            <button
              onClick={() => onNavigate('Vehicles')}
              className="px-3 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add Vehicle Manually
            </button>
          </div>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div id="dashboard-kpi-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Vehicles */}
        <div
          onClick={() => onNavigate('Vehicles')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>Total Vehicles</span>
            <Car className="w-4 h-4 text-[#1f73e8]" />
          </div>
          <div className="text-2xl font-bold text-[#122038]">{totalVehicles}</div>
          <div className="text-[11px] text-gray-400 mt-1">Fleet registry</div>
        </div>

        {/* On Rent */}
        <div
          onClick={() => onNavigate('Vehicles')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>On Rent</span>
            <CheckCircle2 className="w-4 h-4 text-[#20b56f]" />
          </div>
          <div className="text-2xl font-bold text-[#20b56f]">{onRentVehicles}</div>
          <div className="text-[11px] text-gray-400 mt-1">Active deployments</div>
        </div>

        {/* Available */}
        <div
          onClick={() => onNavigate('Vehicles')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>Available</span>
            <Car className="w-4 h-4 text-[#15b9b0]" />
          </div>
          <div className="text-2xl font-bold text-[#15b9b0]">{availableVehicles}</div>
          <div className="text-[11px] text-gray-400 mt-1">Ready for contract</div>
        </div>

        {/* In Maintenance */}
        <div
          onClick={() => onNavigate('Maintenance')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>In Maintenance</span>
            <Wrench className="w-4 h-4 text-[#f1a32a]" />
          </div>
          <div className="text-2xl font-bold text-[#f1a32a]">{maintenanceVehicles}</div>
          <div className="text-[11px] text-gray-400 mt-1">Under service</div>
        </div>

        {/* Total Drivers */}
        <div
          onClick={() => onNavigate('All Drivers')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>Total Drivers</span>
            <Users className="w-4 h-4 text-[#7b5ce6]" />
          </div>
          <div className="text-2xl font-bold text-[#122038]">{totalDrivers}</div>
          <div className="text-[11px] text-gray-400 mt-1">Verified drivers</div>
        </div>

        {/* Expiring Documents */}
        <div
          onClick={() => onNavigate('Documents & Expiry')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>Expiring Documents</span>
            <AlertTriangle className="w-4 h-4 text-[#ef5553]" />
          </div>
          <div className="text-2xl font-bold text-[#ef5553]">{expiringCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">Within {warningDays} days</div>
        </div>

        {/* Monthly Revenue */}
        <div
          onClick={() => onNavigate('Income')}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-[#718198] text-xs font-semibold mb-2">
            <span>Monthly Revenue</span>
            <Coins className="w-4 h-4 text-[#c9a15b]" />
          </div>
          <div className="text-xl font-extrabold text-[#c9a15b] truncate">
            QAR {monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Current month</div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div id="dashboard-quick-actions" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-[#718198] mb-3.5 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#1f73e8]" /> Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <button
            id="qa-add-vehicle"
            onClick={() => onOpenQuickAction('Add Vehicle')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-blue-50 text-[#122038] hover:text-[#1f73e8] border border-transparent hover:border-blue-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1f73e8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Car className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Add Vehicle</span>
          </button>

          <button
            id="qa-add-driver"
            onClick={() => onOpenQuickAction('Add Driver')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-emerald-50 text-[#122038] hover:text-[#20b56f] border border-transparent hover:border-emerald-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#20b56f] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Add Driver</span>
          </button>

          <button
            id="qa-new-contract"
            onClick={() => onOpenQuickAction('New Contract')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-amber-50 text-[#122038] hover:text-[#c9a15b] border border-transparent hover:border-amber-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#c9a15b] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FilePlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">New Contract</span>
          </button>

          <button
            id="qa-record-payment"
            onClick={() => onOpenQuickAction('Record Payment')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-purple-50 text-[#122038] hover:text-[#7b5ce6] border border-transparent hover:border-purple-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7b5ce6] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Record Payment</span>
          </button>

          <button
            id="qa-add-expense"
            onClick={() => onOpenQuickAction('Add Expense')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-rose-50 text-[#122038] hover:text-[#ef5553] border border-transparent hover:border-rose-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#ef5553] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Add Expense</span>
          </button>

          <button
            id="qa-handover-vehicle"
            onClick={() => onOpenQuickAction('Handover Vehicle')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-cyan-50 text-[#122038] hover:text-[#15b9b0] border border-transparent hover:border-cyan-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-[#15b9b0] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Handover Vehicle</span>
          </button>

          <button
            id="qa-upload-document"
            onClick={() => onOpenQuickAction('Upload Document')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-indigo-50 text-[#122038] hover:text-[#1f73e8] border border-transparent hover:border-indigo-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[#1f73e8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">Upload Document</span>
          </button>

          <button
            id="qa-view-reports"
            onClick={() => onNavigate('Reports')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f8fb] hover:bg-teal-50 text-[#122038] hover:text-[#15b9b0] border border-transparent hover:border-teal-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#15b9b0] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-center">View Reports</span>
          </button>
        </div>
      </div>

      {/* 4. Chart & Fleet Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div id="dashboard-financial-chart" className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#122038]">Income vs Expenses</h2>
              <p className="text-xs text-[#718198]">Historical 6-month comparison (Currency: QAR)</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#20b56f]"></span>
                <span className="text-gray-600 font-medium">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#ef5553]"></span>
                <span className="text-gray-600 font-medium">Expenses</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 pb-2">
            {chartMonths.map((m) => {
              const incomeHeight = Math.max(4, Math.round((m.income / maxChartVal) * 160));
              const expenseHeight = Math.max(4, Math.round((m.expense / maxChartVal) * 160));

              return (
                <div key={m.ym} className="flex-1 flex flex-col items-center group">
                  <div className="flex items-end gap-1.5 w-full justify-center h-44">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className="w-4 sm:w-6 bg-[#20b56f] rounded-t-sm transition-all group-hover:brightness-95 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0c1b2d] text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                        QAR {m.income.toLocaleString()}
                      </div>
                    </div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expenseHeight}px` }}
                      className="w-4 sm:w-6 bg-[#ef5553] rounded-t-sm transition-all group-hover:brightness-95 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0c1b2d] text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                        QAR {m.expense.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#718198] mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#718198]">
            <span>Net Profit: <strong className={netProfit >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'}>QAR {netProfit.toLocaleString()}</strong></span>
            <span>Total Volume: <strong>QAR {(totalIncome + totalExpenses).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Vehicle Status & Driver Type */}
        <div className="space-y-6">
          {/* Vehicle Status */}
          <div id="dashboard-vehicle-status" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718198] mb-3">Vehicle Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#20b56f]"></span> On Rent
                </span>
                <span className="font-bold text-[#20b56f]">{onRentVehicles}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15b9b0]"></span> Available
                </span>
                <span className="font-bold text-[#15b9b0]">{availableVehicles}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f1a32a]"></span> Maintenance
                </span>
                <span className="font-bold text-[#f1a32a]">{maintenanceVehicles}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Other
                </span>
                <span className="font-bold text-gray-600">{otherVehicles}</span>
              </div>
            </div>
          </div>

          {/* Driver Type */}
          <div id="dashboard-driver-type" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718198] mb-3">Driver Type</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1f73e8]"></span> Company Drivers
                </span>
                <span className="font-bold text-[#1f73e8]">{companyDriversCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50">
                <span className="font-semibold text-[#122038] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7b5ce6]"></span> NOC / Outside
                </span>
                <span className="font-bold text-[#7b5ce6]">{outsideDriversCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Assignments & Expiry Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vehicle Assignments */}
        <div id="dashboard-recent-assignments" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-[#122038]">Recent Vehicle Assignments</h3>
            <button
              id="view-all-assignments-btn"
              onClick={() => onNavigate('Assignments')}
              className="text-xs font-bold text-[#1f73e8] hover:underline"
            >
              View All
            </button>
          </div>

          {recentAssignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718198]">
              No vehicle assignments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#718198]">
                    <th className="pb-2 font-semibold">Vehicle</th>
                    <th className="pb-2 font-semibold">Driver</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentAssignments.map((a, aIdx) => (
                    <tr key={`asg-${a.id}-${aIdx}`} className="hover:bg-gray-50/80">
                      <td className="py-2.5 font-bold text-[#122038]">{a.vehiclePlate}</td>
                      <td className="py-2.5 text-gray-700">{a.driverName}</td>
                      <td className="py-2.5 text-[#718198]">{a.type}</td>
                      <td className="py-2.5 text-gray-500">{a.startDate}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.status === 'Active'
                              ? 'bg-emerald-100 text-[#20b56f]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Expiry Alerts */}
        <div id="dashboard-upcoming-expiry" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-[#122038] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#ef5553]" /> Upcoming Expiry Alerts
            </h3>
            <button
              id="view-all-expiry-btn"
              onClick={() => onNavigate('Documents & Expiry')}
              className="text-xs font-bold text-[#1f73e8] hover:underline"
            >
              View All
            </button>
          </div>

          {expiringDocsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#20b56f] bg-emerald-50/50 rounded-xl">
              ✓ All documents and licenses are valid. No upcoming expiries within {warningDays} days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {expiringDocsList.slice(0, 4).map((doc) => {
                const exp = new Date(doc.expiry);
                const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
                const isExpired = diffDays <= 0;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#122038]">
                        {doc.type} ({doc.number})
                      </span>
                      <div className="text-[11px] text-[#718198]">
                        Entity: {doc.entity} • Expiry: {doc.expiry}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isExpired
                          ? 'bg-red-100 text-[#ef5553]'
                          : 'bg-amber-100 text-[#f1a32a]'
                      }`}
                    >
                      {isExpired ? 'Expired' : `Expires in ${diffDays} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Collections & Top Performing Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <div id="dashboard-recent-collections" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-[#122038]">Recent Collections</h3>
            <button
              id="view-all-collections-btn"
              onClick={() => onNavigate('Payments')}
              className="text-xs font-bold text-[#1f73e8] hover:underline"
            >
              View All
            </button>
          </div>

          {recentCollections.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718198]">
              No payments collected yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#718198]">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">From</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentCollections.map((p, pIdx) => (
                    <tr key={`dash-pay-${p.id}-${pIdx}`} className="hover:bg-gray-50/80">
                      <td className="py-2.5 text-gray-600">{p.date}</td>
                      <td className="py-2.5 font-bold text-[#122038]">{p.driverName}</td>
                      <td className="py-2.5 text-[#718198]">{p.type}</td>
                      <td className="py-2.5 font-bold text-[#20b56f] text-right">
                        QAR {(Number(p.amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performing Vehicles */}
        <div id="dashboard-top-vehicles" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-[#122038]">Top Performing Vehicles</h3>
            <button
              id="view-all-profitability-btn"
              onClick={() => onNavigate('Reports')}
              className="text-xs font-bold text-[#1f73e8] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {vehiclePerformance.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718198]">
              No vehicle records available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[#718198]">
                    <th className="pb-2 font-semibold">Vehicle</th>
                    <th className="pb-2 font-semibold">Total Income</th>
                    <th className="pb-2 font-semibold">Total Expenses</th>
                    <th className="pb-2 font-semibold">Profit</th>
                    <th className="pb-2 font-semibold text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vehiclePerformance.map((vp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 font-bold text-[#122038]">{vp.vehicle}</td>
                      <td className="py-2.5 text-[#20b56f]">QAR {(Number(vp.income) || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-[#ef5553]">QAR {(Number(vp.expenses) || 0).toLocaleString()}</td>
                      <td className={`py-2.5 font-bold ${vp.profit >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'}`}>
                        QAR {(Number(vp.profit) || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-[#1f73e8]">{vp.utilization}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 7. Financial Summary & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <div id="dashboard-financial-summary" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-[#122038] mb-4">Financial Summary</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50">
              <span className="text-gray-700 font-medium">Total Income</span>
              <span className="font-extrabold text-[#20b56f] text-sm">
                QAR {(Number(totalIncome) || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/50">
              <span className="text-gray-700 font-medium">Total Expenses</span>
              <span className="font-extrabold text-[#ef5553] text-sm">
                QAR {(Number(totalExpenses) || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/50">
              <span className="text-gray-700 font-medium">Net Profit</span>
              <span className={`font-extrabold text-sm ${netProfit >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'}`}>
                QAR {(Number(netProfit) || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50">
              <span className="text-gray-700 font-medium">Collection Rate</span>
              <span className="font-extrabold text-[#c9a15b] text-sm">
                {collectionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div id="dashboard-recent-activities" className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#122038]">Recent Activities</h3>
            <button
              id="view-all-activities-btn"
              onClick={() => onNavigate('Audit Logs')}
              className="text-xs font-bold text-[#1f73e8] hover:underline"
            >
              View All
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718198]">
              No recent audit records.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1f73e8] flex items-center justify-center font-bold text-[10px]">
                      {act.user ? act.user[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="font-bold text-[#122038]">{act.action}</div>
                      <div className="text-[11px] text-[#718198]">{act.reference}</div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-400">
                    <div>{act.user}</div>
                    <div>{new Date(act.date).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
