import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { FinancingRecord, Installment, PaymentMethod } from '../types';
import {
  Plus,
  Search,
  Trash2,
  X,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  Users,
  ChevronRight,
  ArrowRight,
  Receipt,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { WhatsAppTemplates } from '../utils/whatsapp';
import { InstallmentReceiptModal } from '../components/InstallmentReceiptModal';

interface FinancingViewProps {
  initialTab?: 'plans' | 'installments';
}

export const FinancingView: React.FC<FinancingViewProps> = ({ initialTab = 'plans' }) => {
  const {
    financing,
    installments,
    vehicles,
    drivers,
    addFinancing,
    deleteFinancing,
    payInstallment,
    deleteInstallment,
  } = useDb();

  const [activeTab, setActiveTab] = useState<'plans' | 'installments'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [installmentStatusFilter, setInstallmentStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payTargetInstallment, setPayTargetInstallment] = useState<Installment | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetInstallmentId, setDeleteTargetInstallmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-detection calculation mode
  const [calcMode, setCalcMode] = useState<'autoDetectMonths' | 'fixedTenure'>('autoDetectMonths');

  // New Financing Plan Form Data
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    vehiclePrice: 55000,
    downPayment: 7000,
    financedAmount: 48000,
    monthlyInstallment: 2000,
    numberOfInstallments: 24,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Calculate projected completion date
  const computeEndDate = (start: string, months: number) => {
    if (!start || months <= 0) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  // Handler for Vehicle selection: auto-fills price and assigned driver
  const handleVehicleSelect = (vId: string) => {
    const selectedVeh = vehicles.find((v) => v.id === vId);
    if (!selectedVeh) {
      setFormData((prev) => ({ ...prev, vehicleId: vId }));
      return;
    }

    const price = selectedVeh.purchasePrice && selectedVeh.purchasePrice > 0 ? selectedVeh.purchasePrice : formData.vehiclePrice;
    const down = formData.downPayment;
    const financed = Math.max(0, price - down);
    
    // Auto-detect installments or monthly
    let months = formData.numberOfInstallments;
    let monthly = formData.monthlyInstallment;

    if (calcMode === 'autoDetectMonths') {
      months = monthly > 0 ? Math.max(1, Math.ceil(financed / monthly)) : 24;
    } else {
      monthly = months > 0 ? Math.round(financed / months) : 2000;
    }

    setFormData((prev) => ({
      ...prev,
      vehicleId: vId,
      driverId: selectedVeh.currentDriverId || prev.driverId || (drivers[0]?.id || ''),
      vehiclePrice: price,
      financedAmount: financed,
      numberOfInstallments: months,
      monthlyInstallment: monthly,
    }));
  };

  // Bi-directional price & down payment handler
  const handlePriceOrDownChange = (price: number, down: number) => {
    const financed = Math.max(0, price - down);
    let months = formData.numberOfInstallments;
    let monthly = formData.monthlyInstallment;

    if (calcMode === 'autoDetectMonths') {
      months = monthly > 0 ? Math.max(1, Math.ceil(financed / monthly)) : 12;
    } else {
      monthly = months > 0 ? Math.round(financed / months) : 0;
    }

    setFormData((prev) => ({
      ...prev,
      vehiclePrice: price,
      downPayment: down,
      financedAmount: financed,
      numberOfInstallments: months,
      monthlyInstallment: monthly,
    }));
  };

  // When user inputs or adjusts Monthly Installment: AUTOMATICALLY DETECT NUMBER OF INSTALLMENTS
  const handleMonthlyChange = (monthly: number) => {
    const validMonthly = Math.max(0, monthly);
    const detectedMonths = validMonthly > 0 ? Math.max(1, Math.ceil(formData.financedAmount / validMonthly)) : formData.numberOfInstallments;
    setFormData((prev) => ({
      ...prev,
      monthlyInstallment: validMonthly,
      numberOfInstallments: detectedMonths,
    }));
  };

  // When user inputs Tenure (Months): AUTOMATICALLY CALCULATE MONTHLY INSTALLMENT
  const handleTenureChange = (months: number) => {
    const validMonths = Math.max(1, Math.min(120, months));
    const calculatedMonthly = validMonths > 0 ? Math.round(formData.financedAmount / validMonths) : 0;
    setFormData((prev) => ({
      ...prev,
      numberOfInstallments: validMonths,
      monthlyInstallment: calculatedMonthly,
    }));
  };

  // When user directly changes Financed Balance
  const handleFinancedAmountChange = (financed: number) => {
    const validFinanced = Math.max(0, financed);
    let months = formData.numberOfInstallments;
    let monthly = formData.monthlyInstallment;

    if (calcMode === 'autoDetectMonths') {
      months = monthly > 0 ? Math.max(1, Math.ceil(validFinanced / monthly)) : 12;
    } else {
      monthly = months > 0 ? Math.round(validFinanced / months) : 0;
    }

    setFormData((prev) => ({
      ...prev,
      financedAmount: validFinanced,
      vehiclePrice: validFinanced + prev.downPayment,
      numberOfInstallments: months,
      monthlyInstallment: monthly,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.vehicleId || !formData.driverId) {
      setFormError('Please select both a vehicle and a driver.');
      return;
    }

    const v = vehicles.find((veh) => veh.id === formData.vehicleId);
    const d = drivers.find((drv) => drv.id === formData.driverId);
    if (!v || !d) {
      setFormError('Selected vehicle or driver not found.');
      return;
    }

    setLoading(true);
    try {
      await addFinancing({
        vehicleId: v.id,
        vehiclePlate: v.plate,
        driverId: d.id,
        driverName: d.name,
        vehiclePrice: formData.vehiclePrice,
        financedAmount: formData.financedAmount,
        downPayment: formData.downPayment,
        monthlyInstallment: formData.monthlyInstallment,
        numberOfInstallments: formData.numberOfInstallments,
        startDate: formData.startDate,
        status: 'Active',
      });
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetInstallment || payAmount <= 0) return;

    setLoading(true);
    try {
      await payInstallment(payTargetInstallment.id, payAmount, payMethod);
      const paidSnapshot: Installment = {
        ...payTargetInstallment,
        paid: payTargetInstallment.paid + payAmount,
        remaining: Math.max(0, payTargetInstallment.remaining - payAmount),
        status: payTargetInstallment.remaining - payAmount <= 0 ? 'Paid' : 'Partially Paid',
      };
      setPayTargetInstallment(null);
      setReceiptTarget(paidSnapshot);
    } catch (err) {
      console.error('Error paying installment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deleteFinancing(deleteTargetId);
      setDeleteTargetId(null);
      if (selectedPlanId === deleteTargetId) {
        setSelectedPlanId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstallment = async () => {
    if (!deleteTargetInstallmentId) return;
    setLoading(true);
    try {
      await deleteInstallment(deleteTargetInstallmentId);
      setDeleteTargetInstallmentId(null);
    } catch (err) {
      console.error('Error deleting installment:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalFinanced = financing.reduce((acc, f) => acc + (f.financedAmount || 0), 0);
  const totalDownPayments = financing.reduce((acc, f) => acc + (f.downPayment || 0), 0);
  const totalInstallmentPaid = installments.reduce((acc, i) => acc + (i.paid || 0), 0);
  const totalRemaining = installments.reduce((acc, i) => acc + (i.remaining || 0), 0);
  const overdueCount = installments.filter((i) => {
    if (i.status === 'Paid') return false;
    return new Date(i.dueDate) < new Date();
  }).length;

  const filteredFinancing = financing.filter(
    (f) =>
      f.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedInstallments = installments.filter((inst) => {
    if (selectedPlanId && inst.financingId !== selectedPlanId) return false;
    const matchesSearch =
      (inst.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.driverName || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const isOverdue = inst.status !== 'Paid' && new Date(inst.dueDate) < new Date();
    if (installmentStatusFilter === 'Overdue') return isOverdue;
    if (installmentStatusFilter === 'Upcoming' || installmentStatusFilter === 'Pending') {
      return inst.status === 'Upcoming' || (inst.status as any) === 'Pending';
    }
    if (installmentStatusFilter === 'Paid') return inst.status === 'Paid';
    if (installmentStatusFilter === 'Partially Paid') return inst.status === 'Partially Paid';
    return true;
  });

  const selectedPlan = financing.find((f) => f.id === selectedPlanId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">
            {activeTab === 'installments'
              ? 'Installment Schedule & Collections'
              : 'Vehicle Financing & Rent-to-Own'}
          </h1>
          <p className="text-xs text-[#718198]">
            {activeTab === 'installments'
              ? 'Driver monthly rent-to-own installments, payment ledger, WhatsApp payment reminders, and settlement tracking'
              : 'Driver vehicle purchase plans, monthly amortizations, installment schedule and WhatsApp reminders'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'installments' && (
            <button
              id="btn-record-installment-header"
              onClick={() => {
                const firstPending =
                  installments.find((i) => i.status !== 'Paid' && i.remaining > 0) ||
                  installments[0];
                if (firstPending) {
                  setPayTargetInstallment(firstPending);
                  setPayAmount(firstPending.remaining);
                  setPayMethod('Cash');
                } else {
                  // No installments yet, open add financing
                  setIsAddOpen(true);
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Installment Payment</span>
            </button>
          )}

          <button
            id="btn-new-financing"
            onClick={() => {
              setFormData({
                vehicleId: '',
                driverId: '',
                vehiclePrice: 55000,
                downPayment: 7000,
                financedAmount: 48000,
                monthlyInstallment: 2000,
                numberOfInstallments: 24,
                startDate: new Date().toISOString().split('T')[0],
              });
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-[#c9a15b] hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>New Financing Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-[#718198] font-semibold">Active Plans</div>
          <div className="text-lg font-bold text-[#122038] mt-1 font-mono">{financing.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Vehicles under financing</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-[#718198] font-semibold">Total Financed Value</div>
          <div className="text-lg font-bold text-[#1f73e8] mt-1 font-mono">
            QAR {totalFinanced.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Excludes down payments</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-[#718198] font-semibold">Collected Installments</div>
          <div className="text-lg font-bold text-[#20b56f] mt-1 font-mono">
            QAR {totalInstallmentPaid.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Capital recovered</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-[#718198] font-semibold">Outstanding Balance</div>
          <div className="text-lg font-bold text-amber-600 mt-1 font-mono">
            QAR {totalRemaining.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Future receivables</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-[#718198] font-semibold">Overdue Installments</div>
          <div className={`text-lg font-bold mt-1 font-mono ${overdueCount > 0 ? 'text-[#ef5553]' : 'text-gray-700'}`}>
            {overdueCount}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Needs driver follow-up</div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 bg-[#f5f8fb] p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('plans');
              setSelectedPlanId(null);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'plans' ? 'bg-white text-[#122038] shadow-xs' : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Financing Plans ({financing.length})
          </button>
          <button
            onClick={() => setActiveTab('installments')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'installments' ? 'bg-white text-[#1f73e8] shadow-xs' : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Installment Schedule ({installments.length})
          </button>
        </div>

        {activeTab === 'installments' && (
          <div className="flex items-center space-x-1">
            {['All', 'Upcoming', 'Overdue', 'Partially Paid', 'Paid'].map((st) => (
              <button
                key={st}
                onClick={() => setInstallmentStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  installmentStatusFilter === st
                    ? st === 'Overdue'
                      ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                      : st === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'bg-blue-50 text-[#1f73e8] font-bold border border-blue-200'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {selectedPlanId && (
            <button
              onClick={() => setSelectedPlanId(null)}
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
            >
              Clear Filter ({selectedPlan?.vehiclePlate})
            </button>
          )}

          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle plate, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'plans' ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Driver & Contact</th>
                  <th className="py-3 px-4 font-semibold">Financed Amount</th>
                  <th className="py-3 px-4 font-semibold">Down Payment</th>
                  <th className="py-3 px-4 font-semibold">Monthly Due</th>
                  <th className="py-3 px-4 font-semibold">Equity Progress</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFinancing.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No vehicle financing plans recorded. Click "New Financing Plan" to start.
                    </td>
                  </tr>
                ) : (
                  filteredFinancing.map((f) => {
                    const planInstallments = installments.filter((i) => i.financingId === f.id);
                    const paidCount = planInstallments.filter((i) => i.status === 'Paid').length;
                    const paidSum = planInstallments.reduce((sum, i) => sum + (i.paid || 0), 0);
                    const totalPlanAmount = f.financedAmount || (f.monthlyInstallment * f.numberOfInstallments);
                    const progressPercent = totalPlanAmount > 0 ? Math.min(100, Math.round((paidSum / totalPlanAmount) * 100)) : 0;
                    const driverObj = drivers.find((d) => d.id === f.driverId);

                    return (
                      <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#1f73e8] block">{f.vehiclePlate}</span>
                          <span className="text-[10px] text-gray-400">Start: {f.startDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#122038]">{f.driverName}</div>
                          {driverObj && (
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-gray-500 text-[11px]">{driverObj.mobile}</span>
                              <WhatsAppButton
                                phone={driverObj.mobile}
                                driverName={f.driverName}
                                variant="icon"
                                title="Contact driver on WhatsApp"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                          QAR {f.financedAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          QAR {f.downPayment.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#20b56f] font-mono">
                          QAR {f.monthlyInstallment.toLocaleString()}
                          <span className="text-[10px] font-normal text-gray-500 block">/month</span>
                        </td>
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 mb-1">
                            <span>{paidCount} of {f.numberOfInstallments} paid</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#20b56f] h-1.5 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#20b56f]">
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedPlanId(f.id);
                              setActiveTab('installments');
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-[#1f73e8] hover:bg-blue-100 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Schedule</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(f.id)}
                            className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                            title="Delete plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Installment Schedule Ledger */
        <div className="space-y-4">
          {selectedPlan && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <Car className="w-5 h-5 text-[#1f73e8]" />
                <div>
                  <div className="font-bold text-[#122038]">
                    Filtering Schedule for Vehicle: <span className="font-mono text-[#1f73e8]">{selectedPlan.vehiclePlate}</span>
                  </div>
                  <div className="text-[11px] text-[#718198]">
                    Driver: {selectedPlan.driverName} • Total Financed: QAR {selectedPlan.financedAmount.toLocaleString()} • Monthly: QAR {selectedPlan.monthlyInstallment.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanId(null)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold cursor-pointer"
              >
                Show All Plans
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Installment #</th>
                    <th className="py-3 px-4 font-semibold">Vehicle</th>
                    <th className="py-3 px-4 font-semibold">Driver</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold">Total Amount</th>
                    <th className="py-3 px-4 font-semibold">Paid</th>
                    <th className="py-3 px-4 font-semibold">Remaining</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedInstallments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No installments found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedInstallments.map((inst) => {
                      const isOverdue = inst.status !== 'Paid' && new Date(inst.dueDate) < new Date();
                      const driverObj = drivers.find((d) => d.id === inst.driverId);

                      return (
                        <tr key={inst.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#122038]">
                            #{inst.installmentNumber}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                            {inst.vehiclePlate}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800">
                            {inst.driverName}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600">
                            {inst.dueDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-800">
                            QAR {inst.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                            QAR {inst.paid.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-600">
                            QAR {inst.remaining.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inst.status === 'Paid'
                                  ? 'bg-emerald-50 text-[#20b56f]'
                                  : isOverdue
                                  ? 'bg-red-50 text-[#ef5553]'
                                  : inst.status === 'Partially Paid'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-blue-50 text-[#1f73e8]'
                              }`}
                            >
                              {isOverdue && inst.status !== 'Partially Paid' ? 'Overdue' : inst.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            {driverObj && (
                              <WhatsAppButton
                                phone={driverObj.mobile}
                                driverName={inst.driverName}
                                message={WhatsAppTemplates.financingInstallment(
                                  inst.driverName,
                                  inst.vehiclePlate,
                                  inst.installmentNumber,
                                  inst.amount,
                                  inst.dueDate,
                                  inst.remaining
                                )}
                                variant="badge"
                                label="Remind"
                                title="Send installment reminder on WhatsApp"
                              />
                            )}

                            {inst.paid > 0 && (
                              <button
                                onClick={() => setReceiptTarget(inst)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="Print Official Payment Receipt Voucher"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                            )}

                            {inst.status !== 'Paid' && (
                              <button
                                onClick={() => {
                                  setPayTargetInstallment(inst);
                                  setPayAmount(inst.remaining);
                                  setPayMethod('Cash');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Record Payment</span>
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteTargetInstallmentId(inst.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete Installment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pay Installment Modal */}
      {payTargetInstallment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#122038]">
                  Pay Installment #{payTargetInstallment.installmentNumber}
                </h3>
              </div>
              <button
                onClick={() => setPayTargetInstallment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInstallmentSubmit} className="mt-4 space-y-4 text-xs">
              {/* Select or switch pending installment */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Pending Installment
                </label>
                <select
                  value={payTargetInstallment.id}
                  onChange={(e) => {
                    const found = installments.find((i) => i.id === e.target.value);
                    if (found) {
                      setPayTargetInstallment(found);
                      setPayAmount(found.remaining);
                    }
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none font-medium"
                >
                  {installments
                    .filter((i) => i.status !== 'Paid' || i.id === payTargetInstallment.id)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        Inst #{i.installmentNumber} • {i.vehiclePlate} ({i.driverName}) — Due: {i.dueDate} — Bal: QAR {i.remaining.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle Plate:</span>
                  <span className="font-mono font-bold text-[#1f73e8]">{payTargetInstallment.vehiclePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Driver:</span>
                  <span className="font-bold text-[#122038]">{payTargetInstallment.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-mono">{payTargetInstallment.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Installment Total:</span>
                  <span className="font-mono">QAR {payTargetInstallment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 pt-1 border-t border-gray-200">
                  <span>Current Outstanding:</span>
                  <span className="font-mono">QAR {payTargetInstallment.remaining.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-gray-700">
                    Payment Amount (QAR) *
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPayAmount(payTargetInstallment.remaining)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Full Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.round(payTargetInstallment.remaining / 2))}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={payTargetInstallment.remaining}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Credit / Debit Card</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayTargetInstallment(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Financing Plan Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">New Financing Plan</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Calculation Mode Toggle */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                <div className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center justify-between">
                  <span>Calculation Engine</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-full font-mono font-semibold">
                    {calcMode === 'autoDetectMonths' ? '✨ Auto-Detecting Installments' : '🎯 Fixed Tenure Mode'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-lg border border-amber-200/60">
                  <button
                    type="button"
                    onClick={() => setCalcMode('autoDetectMonths')}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                      calcMode === 'autoDetectMonths'
                        ? 'bg-[#1f73e8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Auto-Detect Installments
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('fixedTenure')}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                      calcMode === 'fixedTenure'
                        ? 'bg-[#1f73e8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Specify Tenure (Months)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.make} {v.model}) - {v.ownership} {v.purchasePrice ? `[QAR ${v.purchasePrice.toLocaleString()}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Driver *</label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (QID: {d.qid}) • Mobile: {d.mobile}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Total Vehicle Price (QAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.vehiclePrice}
                    onChange={(e) =>
                      handlePriceOrDownChange(
                        Number(e.target.value) || 0,
                        formData.downPayment
                      )
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-bold bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Down Payment (QAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.downPayment}
                    onChange={(e) =>
                      handlePriceOrDownChange(
                        formData.vehiclePrice,
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Financed Balance (QAR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.financedAmount}
                    onChange={(e) => handleFinancedAmountChange(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-bold text-blue-700 bg-blue-50/30"
                  />
                  <span className="text-[10px] text-gray-400">Total Price minus Down Payment</span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">First Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">Monthly schedule start</span>
                </div>
              </div>

              {/* Monthly Installment & Number of Installments with Auto Detection */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#122038]">Monthly Installment (QAR) *</label>
                      {calcMode === 'autoDetectMonths' && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Input</span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.monthlyInstallment}
                      onChange={(e) => handleMonthlyChange(Number(e.target.value) || 0)}
                      className="w-full p-2.5 border-2 border-emerald-500 rounded-lg focus:outline-none font-bold text-emerald-700 font-mono text-sm bg-white"
                      placeholder="e.g. 2000"
                    />
                    <span className="text-[10px] text-gray-500">
                      {calcMode === 'autoDetectMonths'
                        ? 'Type amount → auto-detects installments'
                        : 'Derived from tenure'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#122038]">Number of Installments *</label>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold font-mono">
                        {formData.numberOfInstallments} Months
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={formData.numberOfInstallments}
                      onChange={(e) => handleTenureChange(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 border-2 border-blue-500 rounded-lg focus:outline-none font-bold text-blue-700 font-mono text-sm bg-white"
                    />
                    <span className="text-[10px] text-gray-500">
                      {calcMode === 'autoDetectMonths'
                        ? '✨ Automatically detected'
                        : 'Type months → auto-computes monthly'}
                    </span>
                  </div>
                </div>

                {/* Quick Tenure Preset Chips */}
                <div>
                  <div className="text-[10px] text-gray-500 font-medium mb-1">Quick Tenure Presets:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[12, 18, 24, 30, 36, 48, 60].map((presetMonths) => (
                      <button
                        key={presetMonths}
                        type="button"
                        onClick={() => handleTenureChange(presetMonths)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          formData.numberOfInstallments === presetMonths
                            ? 'bg-[#1f73e8] text-white font-bold'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {presetMonths}m ({Math.round(formData.financedAmount / presetMonths).toLocaleString()} QAR)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Real-Time Breakdown Banner */}
                <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-[11px] space-y-1 shadow-2xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Detected Schedule:</span>
                    <span className="font-bold text-[#122038] font-mono">
                      {formData.numberOfInstallments} installments × QAR {formData.monthlyInstallment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Total Financed Collection:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      QAR {(formData.numberOfInstallments * formData.monthlyInstallment).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Projected Completion:</span>
                    <span className="font-bold text-[#1f73e8] font-mono">
                      {computeEndDate(formData.startDate, formData.numberOfInstallments)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#c9a15b] hover:bg-amber-600 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? 'Creating...' : `Create ${formData.numberOfInstallments}-Month Financing Plan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Financing Plan"
        message="Are you sure you want to delete this financing contract and its installment schedule?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};

export default FinancingView;
