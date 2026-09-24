import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { BarChart3, TrendingUp, DollarSign, Calendar, Car, Download, Printer, PieChart, Users, MessageSquare } from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { WhatsAppTemplates } from '../utils/whatsapp';

export const ReportsView: React.FC = () => {
  const { vehicles, drivers, contracts, income, expenses, payments } = useDb();

  const [reportType, setReportType] = useState<
    'Profitability' | 'FleetUtilization' | 'DriverBalances' | 'MonthlyPL'
  >('Profitability');

  // Total sums
  const totalIncome = income.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // Vehicle Profitability Table Data
  const vehicleStats = vehicles.map((veh) => {
    const vIncome = income
      .filter((i) => i.vehicleId === veh.id || i.vehiclePlate === veh.plate)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const vExpenses = expenses
      .filter((e) => e.vehicleId === veh.id || e.vehiclePlate === veh.plate)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const profit = vIncome - vExpenses;
    const margin = vIncome > 0 ? Math.round((profit / vIncome) * 100) : 0;

    return {
      id: veh.id,
      plate: veh.plate,
      model: `${veh.make} ${veh.model} (${veh.year})`,
      driver: veh.currentDriverName || 'None',
      status: veh.status,
      income: vIncome,
      expenses: vExpenses,
      profit,
      margin,
    };
  });

  // Driver Balances (Rent expected vs payments collected)
  const driverBalances = drivers.map((d) => {
    const activeContract = contracts.find((c) => c.driverId === d.id && c.status === 'Active');
    const expectedMonthly = activeContract ? activeContract.monthlyAmount : 0;

    const totalCollected = payments
      .filter((p) => p.driverId === d.id)
      .reduce((s, item) => s + (Number(item.amount) || 0), 0);

    const balance = expectedMonthly > 0 ? expectedMonthly - totalCollected : 0;

    return {
      id: d.id,
      name: d.name,
      mobile: d.mobile,
      type: d.driverType,
      monthlyRent: expectedMonthly,
      totalPaid: totalCollected,
      balance: balance,
      status: d.status,
    };
  });

  // Fleet Utilization Breakdown
  const totalUnits = vehicles.length || 1;
  const onRentUnits = vehicles.filter((v) => v.status === 'On Rent').length;
  const availableUnits = vehicles.filter((v) => v.status === 'Available').length;
  const maintenanceUnits = vehicles.filter((v) => v.status === 'Maintenance').length;
  const otherUnits = totalUnits - onRentUnits - availableUnits - maintenanceUnits;

  const onRentPct = Math.round((onRentUnits / totalUnits) * 100);
  const availablePct = Math.round((availableUnits / totalUnits) * 100);
  const maintenancePct = Math.round((maintenanceUnits / totalUnits) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Fleet Analytics & Reports</h1>
          <p className="text-xs text-[#718198]">
            Revenue performance, vehicle profitability, driver ledgers, and operational utilization
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#0c1b2d] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-xs flex flex-wrap gap-1 text-xs">
        <button
          onClick={() => setReportType('Profitability')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            reportType === 'Profitability'
              ? 'bg-[#1f73e8] text-white shadow-xs'
              : 'text-[#718198] hover:text-[#122038]'
          }`}
        >
          Vehicle Profitability
        </button>
        <button
          onClick={() => setReportType('FleetUtilization')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            reportType === 'FleetUtilization'
              ? 'bg-[#1f73e8] text-white shadow-xs'
              : 'text-[#718198] hover:text-[#122038]'
          }`}
        >
          Fleet Utilization
        </button>
        <button
          onClick={() => setReportType('DriverBalances')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            reportType === 'DriverBalances'
              ? 'bg-[#1f73e8] text-white shadow-xs'
              : 'text-[#718198] hover:text-[#122038]'
          }`}
        >
          Driver Balances
        </button>
        <button
          onClick={() => setReportType('MonthlyPL')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            reportType === 'MonthlyPL'
              ? 'bg-[#1f73e8] text-white shadow-xs'
              : 'text-[#718198] hover:text-[#122038]'
          }`}
        >
          P&L Overview
        </button>
      </div>

      {/* 1. Vehicle Profitability */}
      {reportType === 'Profitability' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#122038]">
              Individual Vehicle Profitability (QAR)
            </h3>
            <span className="text-xs text-gray-500">Fleet count: {vehicles.length} units</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Plate</th>
                  <th className="py-3 px-4 font-semibold">Make / Model</th>
                  <th className="py-3 px-4 font-semibold">Driver</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Income</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Expenses</th>
                  <th className="py-3 px-4 font-semibold text-right">Net Profit</th>
                  <th className="py-3 px-4 font-semibold text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicleStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No vehicles in fleet.
                    </td>
                  </tr>
                ) : (
                  vehicleStats.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">{item.plate}</td>
                      <td className="py-3 px-4 font-semibold text-[#122038]">{item.model}</td>
                      <td className="py-3 px-4 text-gray-700">{item.driver}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#20b56f] text-right font-mono">
                        QAR {(Number(item.income) || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#ef5553] text-right font-mono">
                        QAR {(Number(item.expenses) || 0).toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold text-right font-mono ${
                          item.profit >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'
                        }`}
                      >
                        QAR {(Number(item.profit) || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#122038]">
                        {item.margin}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Fleet Utilization */}
      {reportType === 'FleetUtilization' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#122038]">Deployment Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>On Rent ({onRentUnits})</span>
                  <span className="text-[#20b56f]">{onRentPct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${onRentPct}%` }} className="bg-[#20b56f] h-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Available ({availableUnits})</span>
                  <span className="text-[#15b9b0]">{availablePct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${availablePct}%` }} className="bg-[#15b9b0] h-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Maintenance ({maintenanceUnits})</span>
                  <span className="text-[#f1a32a]">{maintenancePct}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div style={{ width: `${maintenancePct}%` }} className="bg-[#f1a32a] h-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
            <h3 className="font-bold text-sm text-[#122038] mb-4">Fleet Efficiency Insights</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#f8fbfe] rounded-xl">
                <span className="text-gray-500 block">Total Registered Fleet</span>
                <span className="text-2xl font-bold text-[#122038] mt-1 block">
                  {vehicles.length} Units
                </span>
                <span className="text-[11px] text-gray-400">Limousine and corporate cars</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <span className="text-gray-500 block">Income Generating Units</span>
                <span className="text-2xl font-bold text-[#20b56f] mt-1 block">
                  {onRentUnits} Units
                </span>
                <span className="text-[11px] text-gray-400">Actively on road with drivers</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Driver Balances */}
      {reportType === 'DriverBalances' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#122038]">Driver Balances & Rent Due</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Driver</th>
                  <th className="py-3 px-4 font-semibold">Mobile</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Agreed Monthly Rent</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Paid (Ledger)</th>
                  <th className="py-3 px-4 font-semibold text-right">Current Balance Due</th>
                  <th className="py-3 px-4 font-semibold">Driver Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {driverBalances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No driver accounts found.
                    </td>
                  </tr>
                ) : (
                  driverBalances.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#122038]">{d.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{d.mobile}</td>
                      <td className="py-3 px-4 text-[#718198]">{d.type}</td>
                      <td className="py-3 px-4 font-mono text-right">
                        QAR {(Number(d.monthlyRent) || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#20b56f] text-right font-mono">
                        QAR {(Number(d.totalPaid) || 0).toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold text-right font-mono ${
                          d.balance > 0 ? 'text-[#ef5553]' : 'text-gray-500'
                        }`}
                      >
                        QAR {(Number(d.balance) || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <WhatsAppButton
                          phone={d.mobile}
                          message={
                            d.balance > 0
                              ? WhatsAppTemplates.paymentReminder(
                                  d.name,
                                  d.balance,
                                  new Date().toISOString().slice(0, 10)
                                )
                              : WhatsAppTemplates.generalDriverMessage(d.name)
                          }
                          size="sm"
                          label={d.balance > 0 ? "Remind" : "Chat"}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. P&L Overview */}
      {reportType === 'MonthlyPL' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#122038]">Executive Profit & Loss Statement</h3>
              <p className="text-xs text-[#718198]">Currency: Qatari Riyal (QAR)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs max-w-xl">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Gross Rental & Service Income</span>
              <span className="font-bold text-[#20b56f] font-mono">
                QAR {(Number(totalIncome) || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Operating Expenses & Maintenance</span>
              <span className="font-bold text-[#ef5553] font-mono">
                (QAR {(Number(totalExpenses) || 0).toLocaleString()})
              </span>
            </div>

            <div className="flex justify-between py-3 bg-[#f8fbfe] px-4 rounded-xl mt-4">
              <span className="font-extrabold text-[#122038] text-sm">Net Operating Profit</span>
              <span
                className={`font-extrabold text-base font-mono ${
                  netProfit >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'
                }`}
              >
                QAR {(Number(netProfit) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
