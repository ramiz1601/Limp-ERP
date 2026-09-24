import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Payment, PaymentMethod, PaymentType, Assignment } from '../types';
import {
  Plus,
  Search,
  Trash2,
  CreditCard,
  Receipt,
  X,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Car,
  User,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Filter,
  Check,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { WhatsAppButton, WhatsAppTemplates } from '../components/WhatsAppButton';

interface PaymentsViewProps {
  initialTab?: 'payments' | 'due' | 'outstanding';
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ initialTab = 'payments' }) => {
  const {
    payments,
    drivers,
    vehicles,
    assignments,
    installments,
    settings,
    addPayment,
    deletePayment,
    updateAssignment,
    payInstallment,
  } = useDb();

  const [activeTab, setActiveTab] = useState<'payments' | 'due' | 'outstanding'>(initialTab);
  const [rentFilter, setRentFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [outstandingSection, setOutstandingSection] = useState<'all' | 'rent' | 'installments'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locallyPaidAssignmentIds, setLocallyPaidAssignmentIds] = useState<Set<string>>(new Set());
  const [locallyPaidInstallmentIds, setLocallyPaidInstallmentIds] = useState<Set<string>>(new Set());

  // Month tracking
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driverId: '',
    vehicleId: '',
    type: 'Rent' as PaymentType,
    amount: 2200,
    method: 'Bank Transfer' as PaymentMethod,
    reference: '',
    notes: '',
    assignmentId: '',
    installmentId: '',
  });

  // Helper: Determine if an assignment's rent is paid for current month
  const isRentPaidForCurrentMonth = (assignment: Assignment) => {
    // Immediate local optimistic state
    if (locallyPaidAssignmentIds.has(assignment.id)) {
      return true;
    }
    // Direct fields on assignment doc
    if (assignment.lastRentPaidMonth === currentYearMonth) {
      return true;
    }
    if (assignment.lastRentPaidDate && assignment.lastRentPaidDate.startsWith(currentYearMonth)) {
      return true;
    }

    // Check in payments collection for matching rent payment this month
    const matchingPayment = payments.find((p) => {
      const pType = String(p.type || '').toLowerCase();
      const isRentType = pType.includes('rent');
      if (!isRentType) return false;

      // 1. Direct assignment link
      if (p.assignmentId && p.assignmentId === assignment.id) {
        const matchesMonth =
          p.monthYear === currentYearMonth ||
          (p.date && p.date.startsWith(currentYearMonth)) ||
          (p.notes && (p.notes.includes(currentYearMonth) || p.notes.toLowerCase().includes(currentMonthName.toLowerCase())));
        if (matchesMonth) return true;
      }

      // 2. Driver match (by ID or exact/trimmed name)
      const matchesDriver =
        (p.driverId && (p.driverId === assignment.driverId || p.driverId === assignment.id)) ||
        (p.driverName &&
          assignment.driverName &&
          p.driverName.trim().toLowerCase() === assignment.driverName.trim().toLowerCase());

      if (!matchesDriver) return false;

      // 3. Vehicle match: if payment has vehicle, check match; if payment has no vehicle, matches if driver matches
      const matchesVehicle =
        (!p.vehiclePlate && !p.vehicleId) ||
        (p.vehiclePlate &&
          assignment.vehiclePlate &&
          p.vehiclePlate.trim().toLowerCase() === assignment.vehiclePlate.trim().toLowerCase()) ||
        (p.vehicleId && (p.vehicleId === assignment.vehicleId || p.vehicleId === assignment.id));

      if (!matchesVehicle) return false;

      // 4. Month match
      const matchesMonth =
        p.monthYear === currentYearMonth ||
        (p.date && p.date.startsWith(currentYearMonth)) ||
        (p.notes && (p.notes.includes(currentYearMonth) || p.notes.toLowerCase().includes(currentMonthName.toLowerCase())));

      return matchesMonth;
    });

    return Boolean(matchingPayment);
  };

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find((d) => d.id === driverId);
    const activeAsg = assignments.find(
      (a) =>
        (a.driverId === driverId ||
          (selectedDriver &&
            a.driverName &&
            a.driverName.trim().toLowerCase() === selectedDriver.name.trim().toLowerCase())) &&
        a.status === 'Active'
    );
    const assignedVeh = vehicles.find(
      (v) =>
        v.currentDriverId === driverId ||
        (activeAsg && (v.id === activeAsg.vehicleId || v.plate === activeAsg.vehiclePlate))
    );

    setFormData({
      ...formData,
      driverId,
      vehicleId: assignedVeh?.id || activeAsg?.vehicleId || formData.vehicleId,
      assignmentId: activeAsg ? activeAsg.id : formData.assignmentId,
      amount: activeAsg?.rent ? Number(activeAsg.rent) : formData.amount,
    });
  };

  const handleOpenAddModal = (
    presetDriverId?: string,
    presetVehicleIdOrPlate?: string,
    presetAmount?: number,
    presetType: PaymentType = 'Rent',
    presetAssignmentId?: string,
    presetInstallmentId?: string,
    presetNotes?: string
  ) => {
    setFormError(null);

    // Resolve driver ID if passed as name or id
    let resolvedDriverId = presetDriverId || '';
    if (presetDriverId) {
      const matchedDrv = drivers.find(
        (d) =>
          d.id === presetDriverId ||
          d.name.trim().toLowerCase() === presetDriverId.trim().toLowerCase()
      );
      if (matchedDrv) resolvedDriverId = matchedDrv.id;
    }

    // Resolve vehicle ID if passed as plate or id
    let matchedVehicleId = '';
    if (presetVehicleIdOrPlate) {
      const veh = vehicles.find(
        (v) => v.id === presetVehicleIdOrPlate || v.plate === presetVehicleIdOrPlate
      );
      matchedVehicleId = veh ? veh.id : presetVehicleIdOrPlate;
    }
    if (!matchedVehicleId && resolvedDriverId) {
      const veh = vehicles.find((v) => v.currentDriverId === resolvedDriverId);
      if (veh) matchedVehicleId = veh.id;
    }

    // If assignmentId not provided, search for active assignment
    let resolvedAssignmentId = presetAssignmentId || '';
    if (!resolvedAssignmentId && resolvedDriverId) {
      const activeAsg = assignments.find(
        (a) => a.driverId === resolvedDriverId && a.status === 'Active'
      );
      if (activeAsg) {
        resolvedAssignmentId = activeAsg.id;
        if (!matchedVehicleId) matchedVehicleId = activeAsg.vehicleId;
      }
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      driverId: resolvedDriverId,
      vehicleId: matchedVehicleId,
      type: presetType,
      amount: presetAmount || 2200,
      method: 'Bank Transfer',
      reference: '',
      notes:
        presetNotes ||
        (presetType === 'Rent'
          ? `Vehicle Rent for ${currentMonthName}`
          : presetType === 'Installment'
          ? `Installment Payment`
          : ''),
      assignmentId: resolvedAssignmentId,
      installmentId: presetInstallmentId || '',
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.driverId) {
      setFormError('Please select a driver.');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    const d = drivers.find((drv) => drv.id === formData.driverId);
    let v = vehicles.find((veh) => veh.id === formData.vehicleId);

    setLoading(true);
    try {
      if (formData.installmentId) {
        // Direct installment payment - updates installment status to 'Paid' and remaining to 0
        setLocallyPaidInstallmentIds((prev) => new Set(prev).add(formData.installmentId));
        await payInstallment(formData.installmentId, Number(formData.amount), formData.method);
      } else if (formData.type === 'Rent') {
        // Find linked active assignment
        const linkedAssignment = assignments.find(
          (a) =>
            a.id === formData.assignmentId ||
            (formData.driverId && a.driverId === formData.driverId && a.status === 'Active') ||
            (d &&
              a.driverName &&
              a.driverName.trim().toLowerCase() === d.name.trim().toLowerCase() &&
              a.status === 'Active') ||
            (formData.vehicleId && a.vehicleId === formData.vehicleId && a.status === 'Active')
        );
        const asgId = linkedAssignment ? linkedAssignment.id : (formData.assignmentId || '');

        if (!v && linkedAssignment) {
          v = vehicles.find(
            (veh) => veh.id === linkedAssignment.vehicleId || veh.plate === linkedAssignment.vehiclePlate
          );
        }

        const vehiclePlate = v ? v.plate : (linkedAssignment ? linkedAssignment.vehiclePlate : '');
        const vehicleId = v ? v.id : (linkedAssignment ? linkedAssignment.vehicleId : '');

        // Optimistically record as paid in local session
        if (asgId) {
          setLocallyPaidAssignmentIds((prev) => new Set(prev).add(asgId));
        }

        await addPayment({
          date: formData.date,
          driverId: d ? d.id : (linkedAssignment ? linkedAssignment.driverId : formData.driverId),
          driverName: d ? d.name : (linkedAssignment ? linkedAssignment.driverName : 'Driver'),
          vehicleId: vehicleId,
          vehiclePlate: vehiclePlate,
          type: 'Rent',
          amount: Number(formData.amount),
          method: formData.method,
          reference:
            formData.reference || `RENT-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: formData.notes || `Rent payment for ${currentMonthName}`,
          assignmentId: asgId,
          monthYear: currentYearMonth,
          status: 'Completed',
        });

        if (linkedAssignment) {
          await updateAssignment(linkedAssignment.id, {
            lastRentPaidDate: formData.date,
            lastRentPaidMonth: currentYearMonth,
            totalRentPaid:
              (Number(linkedAssignment.totalRentPaid) || 0) + Number(formData.amount),
          });
        }
      } else {
        await addPayment({
          date: formData.date,
          driverId: d ? d.id : formData.driverId,
          driverName: d ? d.name : 'Driver',
          vehicleId: v ? v.id : formData.vehicleId,
          vehiclePlate: v ? v.plate : '',
          type: formData.type,
          amount: Number(formData.amount),
          method: formData.method,
          reference:
            formData.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: formData.notes || '',
          assignmentId: formData.assignmentId || '',
          monthYear: currentYearMonth,
          status: 'Completed',
        });
      }
      setIsAddOpen(false);
    } catch (err: any) {
      console.error('Error adding payment:', err);
      setFormError(err?.message || 'Failed to record payment. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deletePayment(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Filtered Payments for Receipts Tab
  const uniquePayments = Array.from(new Map(payments.map((p) => [p.id, p])).values());
  const filteredPayments = uniquePayments.filter((p) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      (p.driverName || '').toLowerCase().includes(searchLow) ||
      (p.vehiclePlate || '').toLowerCase().includes(searchLow) ||
      (p.type || '').toLowerCase().includes(searchLow) ||
      (p.reference && p.reference.toLowerCase().includes(searchLow))
    );
  });

  // 2. Active assignments and Rent Due calculations
  const uniqueAssignments = Array.from(new Map(assignments.map((a) => [a.id, a])).values());
  const activeAssignments = uniqueAssignments.filter((a) => a.status === 'Active');
  const pendingDueAssignments = activeAssignments.filter((a) => !isRentPaidForCurrentMonth(a));
  const paidThisMonthAssignments = activeAssignments.filter((a) => isRentPaidForCurrentMonth(a));

  const displayedDueAssignments = (
    rentFilter === 'pending'
      ? pendingDueAssignments
      : rentFilter === 'paid'
      ? paidThisMonthAssignments
      : activeAssignments
  ).filter((a) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      (a.driverName || '').toLowerCase().includes(searchLow) ||
      (a.vehiclePlate || '').toLowerCase().includes(searchLow)
    );
  });

  // 3. Outstanding Balances: Overdue Installments + Unpaid Rent
  const overdueInstallments = installments.filter(
    (i) =>
      !locallyPaidInstallmentIds.has(i.id) &&
      i.status !== 'Paid' &&
      Number(i.remaining) > 0 &&
      new Date(i.dueDate) <= new Date()
  );

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalDueMonthly = pendingDueAssignments.reduce((sum, a) => sum + (Number(a.rent) || 0), 0);
  const totalOverdueInstallmentsAmount = overdueInstallments.reduce(
    (sum, i) => sum + (Number(i.remaining) || 0),
    0
  );
  const totalOutstandingDue = totalDueMonthly + totalOverdueInstallmentsAmount;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">
            {activeTab === 'payments'
              ? 'Payments & Collections Register'
              : activeTab === 'due'
              ? 'Monthly Rent Due Schedule'
              : 'Outstanding Balances & Collections'}
          </h1>
          <p className="text-xs text-[#718198]">
            {settings?.companyName || 'Prince Limousine & Car Rental'} • Driver collections, rent schedules, and transaction receipts
          </p>
        </div>

        <button
          id="btn-record-payment"
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Total Payments Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 font-mono">
            QAR {totalCollected.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{payments.length} payment transactions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Pending Rent Due This Month</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 font-mono">
            QAR {totalDueMonthly.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {pendingDueAssignments.length} pending of {activeAssignments.length} active units
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Total Outstanding Dues</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono">
            QAR {totalOutstandingDue.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {pendingDueAssignments.length + overdueInstallments.length} pending items (Rent & Installments)
          </div>
        </div>
      </div>

      {/* Navigation tabs & Search bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 bg-[#f5f8fb] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white text-[#1f73e8] shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            All Collections ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('due')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'due'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Rent Due ({pendingDueAssignments.length} pending)
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'outstanding'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Outstanding ({pendingDueAssignments.length + overdueInstallments.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by driver, plate, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Tab 1: All Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment #</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Driver</th>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (QAR)</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      No payment records logged. Click "Record Payment" to record a collection.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, pIdx) => (
                    <tr key={`${p.id}-${pIdx}`} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                        #{p.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{p.date}</td>
                      <td className="py-3 px-4 font-bold text-[#122038]">{p.driverName}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {p.vehiclePlate || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-50 text-[#1f73e8] font-semibold text-[10px] px-2 py-0.5 rounded">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#20b56f] text-right font-mono">
                        QAR {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{p.method}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#20b56f]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          id={`receipt-btn-${p.id}`}
                          onClick={() => setSelectedReceipt(p)}
                          title="View Official Receipt"
                          className="p-1.5 text-gray-500 hover:text-[#1f73e8] hover:bg-blue-50 rounded cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(p.id)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rent Due Schedule */}
      {activeTab === 'due' && (
        <div className="space-y-4">
          {/* Sub-filter bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-500">Filter By Status:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setRentFilter('pending')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    rentFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pending Due ({pendingDueAssignments.length})
                </button>
                <button
                  onClick={() => setRentFilter('paid')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    rentFilter === 'paid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Paid This Month ({paidThisMonthAssignments.length})
                </button>
                <button
                  onClick={() => setRentFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    rentFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({activeAssignments.length})
                </button>
              </div>
            </div>
            <div className="text-[11px] text-gray-500">
              Active Billing Month: <span className="font-bold text-gray-800">{currentMonthName}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Vehicle</th>
                    <th className="py-3 px-4 font-semibold">Assigned Driver</th>
                    <th className="py-3 px-4 font-semibold">Contract Start</th>
                    <th className="py-3 px-4 font-semibold">Monthly Rent Rate</th>
                    <th className="py-3 px-4 font-semibold">Rent Status ({currentMonthName})</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedDueAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        {rentFilter === 'pending' ? (
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-emerald-700 font-bold text-sm">
                              All monthly rent collections are up to date!
                            </div>
                            <div className="text-gray-400 text-xs">
                              Zero rent dues pending for {currentMonthName}.
                            </div>
                            <button
                              onClick={() => setRentFilter('paid')}
                              className="mt-2 text-xs font-semibold text-[#1f73e8] hover:underline cursor-pointer"
                            >
                              View Paid Vehicles ({paidThisMonthAssignments.length})
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">No vehicle records found for this filter.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    displayedDueAssignments.map((a, aIdx) => {
                      const driverObj = drivers.find((d) => d.id === a.driverId || d.name === a.driverName);
                      const isPaid = isRentPaidForCurrentMonth(a);

                      return (
                        <tr key={`${a.id}-${aIdx}`} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                            {a.vehiclePlate}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#122038]">{a.driverName}</div>
                            {driverObj && (
                              <div className="text-[11px] text-gray-400 font-mono">{driverObj.mobile}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600">{a.startDate}</td>
                          <td className="py-3 px-4 font-extrabold text-[#122038] font-mono">
                            QAR {(a.rent || 2200).toLocaleString()}/mo
                          </td>
                          <td className="py-3 px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                <Check className="w-3 h-3" />
                                <span>Paid for {currentMonthName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                <Clock className="w-3 h-3" />
                                <span>Due for {currentMonthName}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {!isPaid ? (
                              <>
                                {driverObj && driverObj.mobile && (
                                  <WhatsAppButton
                                    phone={driverObj.mobile}
                                    driverName={a.driverName}
                                    message={`Dear ${a.driverName}, this is a reminder from ${settings?.companyName || 'Prince Limousine'} regarding the monthly vehicle rent of QAR ${a.rent} for vehicle ${a.vehiclePlate} (${currentMonthName}). Kindly make payment at your earliest convenience.`}
                                    variant="badge"
                                    label="Remind"
                                  />
                                )}
                                <button
                                  onClick={() =>
                                    handleOpenAddModal(
                                      a.driverId,
                                      a.vehicleId,
                                      a.rent,
                                      'Rent',
                                      a.id,
                                      undefined,
                                      `Vehicle Rent for ${currentMonthName}`
                                    )
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Collect Rent</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Collected</span>
                              </span>
                            )}
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

      {/* Tab 3: Outstanding Balances */}
      {activeTab === 'outstanding' && (
        <div className="space-y-4">
          {/* Sub-filter tabs for Outstanding */}
          <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-500">Category:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setOutstandingSection('all')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    outstandingSection === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Dues ({pendingDueAssignments.length + overdueInstallments.length})
                </button>
                <button
                  onClick={() => setOutstandingSection('rent')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    outstandingSection === 'rent'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unpaid Rent ({pendingDueAssignments.length})
                </button>
                <button
                  onClick={() => setOutstandingSection('installments')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    outstandingSection === 'installments'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overdue Installments ({overdueInstallments.length})
                </button>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-rose-600">
              Total Outstanding: QAR {totalOutstandingDue.toLocaleString()}
            </div>
          </div>

          {/* Section 1: Unpaid Rent Dues */}
          {(outstandingSection === 'all' || outstandingSection === 'rent') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-[#fdfaf6] border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-[#122038]">
                    Unpaid Monthly Vehicle Rent ({pendingDueAssignments.length})
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-700">
                  QAR {totalDueMonthly.toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Vehicle</th>
                      <th className="py-2.5 px-4 font-semibold">Driver</th>
                      <th className="py-2.5 px-4 font-semibold">Due Period</th>
                      <th className="py-2.5 px-4 font-semibold">Amount Due</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingDueAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-emerald-600 font-semibold">
                          ✓ All vehicle rent collections are up to date!
                        </td>
                      </tr>
                    ) : (
                      pendingDueAssignments.map((a, aIdx) => {
                        const driverObj = drivers.find((d) => d.id === a.driverId);
                        return (
                          <tr key={`unpaid-${a.id}-${aIdx}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                              {a.vehiclePlate}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-800">
                              {a.driverName}
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono">
                              {currentMonthName}
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-amber-600">
                              QAR {(a.rent || 2200).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                Uncollected
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {driverObj && driverObj.mobile && (
                                <WhatsAppButton
                                  phone={driverObj.mobile}
                                  driverName={a.driverName}
                                  message={`Dear ${a.driverName}, reminder from ${settings?.companyName || 'Prince Limousine'} for vehicle rent payment of QAR ${a.rent} for ${currentMonthName}.`}
                                  variant="badge"
                                  label="Remind"
                                />
                              )}
                              <button
                                onClick={() =>
                                  handleOpenAddModal(
                                    a.driverId,
                                    a.vehicleId,
                                    a.rent,
                                    'Rent',
                                    a.id,
                                    undefined,
                                    `Vehicle Rent for ${currentMonthName}`
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Collect Rent</span>
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
          )}

          {/* Section 2: Overdue Financing Installments */}
          {(outstandingSection === 'all' || outstandingSection === 'installments') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-[#fdf5f5] border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-xs text-[#122038]">
                    Overdue Financing Installments ({overdueInstallments.length})
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700">
                  QAR {totalOverdueInstallmentsAmount.toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Installment #</th>
                      <th className="py-2.5 px-4 font-semibold">Vehicle</th>
                      <th className="py-2.5 px-4 font-semibold">Driver</th>
                      <th className="py-2.5 px-4 font-semibold">Due Date</th>
                      <th className="py-2.5 px-4 font-semibold">Total Amount</th>
                      <th className="py-2.5 px-4 font-semibold">Paid</th>
                      <th className="py-2.5 px-4 font-semibold">Remaining Due</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {overdueInstallments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-emerald-600 font-semibold">
                          ✓ Great news! No overdue installments recorded.
                        </td>
                      </tr>
                    ) : (
                      overdueInstallments.map((inst, instIdx) => {
                        const driverObj = drivers.find((d) => d.id === inst.driverId);
                        return (
                          <tr key={`inst-${inst.id}-${instIdx}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#122038]">
                              #{inst.installmentNumber}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                              {inst.vehiclePlate}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-800">
                              {inst.driverName}
                            </td>
                            <td className="py-3 px-4 font-mono text-rose-600 font-bold">
                              {inst.dueDate}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-700">
                              QAR {inst.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                              QAR {inst.paid.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-rose-600">
                              QAR {inst.remaining.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                                Overdue
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {driverObj && driverObj.mobile && (
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
                                />
                              )}
                              <button
                                onClick={() =>
                                  handleOpenAddModal(
                                    inst.driverId,
                                    inst.vehicleId,
                                    inst.remaining,
                                    'Installment',
                                    undefined,
                                    inst.id,
                                    `Financing Installment #${inst.installmentNumber} for ${inst.vehiclePlate}`
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Collect</span>
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
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">Record Driver Payment</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {formData.installmentId && (
              <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#1f73e8] shrink-0" />
                <span>Recording installment collection. Submitting will mark this installment as <b>Paid</b> and clear it from outstanding.</span>
              </div>
            )}

            {!formData.installmentId && formData.type === 'Rent' && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Collecting rent for <b>{currentMonthName}</b>. Submitting will mark the vehicle rent as paid and clear it from dues.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as PaymentType })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Rent">Vehicle Rent</option>
                    <option value="Installment">Installment</option>
                    <option value="Fine">Traffic Fine</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Driver *</label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (QID: {d.qid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Vehicle (Optional)</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Amount (QAR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value as PaymentMethod })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reference / TXN #</label>
                <input
                  type="text"
                  placeholder="e.g. QNB-987213 or Bank Transfer Slip No."
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
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
                  className="px-5 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-gray-100">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <img
                  src={settings?.companyLogoUrl || '/prince-logo.png'}
                  alt="Company Logo"
                  className="w-8 h-8 object-contain rounded"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="font-extrabold text-base text-[#0c1b2d] tracking-tight">
                  {settings?.companyName || 'Prince Limousine & Car Rental'}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">Official Payment Receipt / إيصال سداد</div>
              <div className="text-xs font-mono font-bold text-[#1f73e8] mt-1">
                Receipt #{selectedReceipt.id.slice(0, 8).toUpperCase()}
              </div>
            </div>

            <div className="my-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-800">{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Received From</span>
                <span className="font-bold text-[#122038]">{selectedReceipt.driverName}</span>
              </div>
              {selectedReceipt.vehiclePlate && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Vehicle Plate</span>
                  <span className="font-mono font-bold text-[#1f73e8]">
                    {selectedReceipt.vehiclePlate}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Payment Type</span>
                <span className="font-semibold">{selectedReceipt.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold">{selectedReceipt.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Reference #</span>
                <span className="font-mono">{selectedReceipt.reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 bg-[#f8fbfe] px-3 rounded-lg mt-2">
                <span className="font-bold text-[#122038]">Amount Received</span>
                <span className="font-extrabold text-[#20b56f] text-base font-mono">
                  QAR {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0c1b2d] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record from the ledger?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
