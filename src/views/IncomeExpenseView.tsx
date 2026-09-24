import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { IncomeRecord, ExpenseRecord, Employee } from '../types';
import {
  Plus,
  Search,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  Calendar,
  AlertTriangle,
  Download,
  Building2,
  Car,
  User,
  Users,
  Briefcase,
  Phone,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Printer,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SalaryVoucherModal } from '../components/SalaryVoucherModal';

interface IncomeExpenseViewProps {
  initialTab?: 'Income' | 'Expenses' | 'Profit & Loss' | 'Payroll';
}

export const IncomeExpenseView: React.FC<IncomeExpenseViewProps> = ({ initialTab = 'Income' }) => {
  const {
    income,
    expenses,
    vehicles,
    drivers,
    employees,
    settings,
    addIncomeRecord,
    addExpenseRecord,
    deleteIncomeRecord,
    deleteExpenseRecord,
    seedDefaultEmployees,
  } = useDb();

  const [activeTab, setActiveTab] = useState<'Income' | 'Expenses' | 'Profit & Loss' | 'Payroll'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals & Voucher State
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedVoucherExpense, setSelectedVoucherExpense] = useState<ExpenseRecord | null>(null);
  const [selectedVoucherEmployee, setSelectedVoucherEmployee] = useState<Employee | undefined>(undefined);
  const [isSeedingStaff, setIsSeedingStaff] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'Income' | 'Expense' } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Income Form
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Vehicle Rent',
    driverId: '',
    vehicleId: '',
    amount: 2200,
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Vehicle Maintenance',
    vehicleId: '',
    employeeId: '',
    amount: 350,
    vendor: 'Prince Fleet Garage / Woqod',
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const selectedEmployeeObj = employees.find((e) => e.id === expenseForm.employeeId);

  // When expense category changes, update fields intelligently
  const handleExpenseCategoryChange = (newCat: string) => {
    if (newCat === 'Staff/Payroll' || newCat === 'Salaries') {
      const firstEmp = employees && employees.length > 0 ? employees[0] : null;
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      setExpenseForm({
        ...expenseForm,
        category: newCat,
        vehicleId: '',
        employeeId: firstEmp ? firstEmp.id : '',
        amount: firstEmp?.salary ? Number(firstEmp.salary) : 4500,
        vendor: firstEmp ? firstEmp.name : '',
        paymentMethod: 'Bank Transfer',
        notes: firstEmp ? `Staff Salary for ${firstEmp.name} (${currentMonth})` : `Staff Payroll (${currentMonth})`,
      });
    } else if (newCat === 'Office Rent' || newCat === 'Utilities') {
      setExpenseForm({
        ...expenseForm,
        category: newCat,
        vehicleId: '',
        employeeId: '',
        amount: newCat === 'Utilities' ? 850 : 6000,
        vendor: newCat === 'Utilities' ? 'Kahramaa / Ooredoo' : 'Office Landlord',
        notes: `${newCat} payment`,
      });
    } else {
      setExpenseForm({
        ...expenseForm,
        category: newCat,
        employeeId: '',
        amount: newCat === 'Fuel' ? 120 : newCat === 'Insurance' ? 1800 : 350,
        vendor: newCat === 'Fuel' ? 'Woqod Petrol Station' : 'Prince Fleet Garage / Woqod',
        notes: '',
      });
    }
  };

  // When an employee is selected in the Payroll expense form
  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    if (emp) {
      setExpenseForm({
        ...expenseForm,
        employeeId: emp.id,
        amount: Number(emp.salary) || expenseForm.amount,
        vendor: emp.name,
        notes: `Staff Salary for ${emp.name} (${currentMonth}) - WPS`,
      });
    } else {
      setExpenseForm({
        ...expenseForm,
        employeeId: '',
        vendor: '',
      });
    }
  };

  const today = new Date();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Employee Payroll Metrics & Status
  const activeEmployees = employees.filter((e) => e.status !== 'Inactive');
  const totalMonthlyPayrollLiability = activeEmployees.reduce(
    (sum, e) => sum + (Number(e.salary) || 0),
    0
  );

  const isEmployeePaidThisMonth = (emp: Employee) => {
    return expenses.find((e) => {
      const isStaff = e.category === 'Staff/Payroll' || e.category === 'Salaries';
      if (!isStaff) return false;
      const mYear = e.monthYear || (e.date ? e.date.slice(0, 7) : '');
      const isCur = mYear === currentMonthYear;
      if (!isCur) return false;

      return (
        (e.employeeId && e.employeeId === emp.id) ||
        (e.vendor && e.vendor.trim().toLowerCase() === emp.name.trim().toLowerCase()) ||
        (e.employeeName && e.employeeName.trim().toLowerCase() === emp.name.trim().toLowerCase())
      );
    });
  };

  const payrollExpensesThisMonth = expenses.filter((e) => {
    const isStaff = e.category === 'Staff/Payroll' || e.category === 'Salaries';
    if (!isStaff) return false;
    const mYear = e.monthYear || (e.date ? e.date.slice(0, 7) : '');
    return mYear === currentMonthYear;
  });

  const salariesPaidThisMonth = payrollExpensesThisMonth.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const pendingSalariesDue = Math.max(0, totalMonthlyPayrollLiability - salariesPaidThisMonth);

  const handleOpenPaySalaryModal = (emp: Employee) => {
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      category: 'Staff/Payroll',
      vehicleId: '',
      employeeId: emp.id,
      amount: Number(emp.salary) || 5000,
      vendor: emp.name,
      paymentMethod: 'Bank Transfer',
      notes: `Staff Salary for ${emp.name} (${currentMonthName}) - WPS`,
    });
    setFormError(null);
    setIsAddExpenseOpen(true);
  };

  const handleSeedStaff = async () => {
    setIsSeedingStaff(true);
    try {
      await seedDefaultEmployees();
    } catch (err) {
      console.error('Error seeding staff:', err);
    } finally {
      setIsSeedingStaff(false);
    }
  };

  const handleViewVoucher = (expenseRec: ExpenseRecord) => {
    const matchedEmp = employees.find(
      (e) =>
        e.id === expenseRec.employeeId ||
        (expenseRec.vendor && e.name.trim().toLowerCase() === expenseRec.vendor.trim().toLowerCase()) ||
        (expenseRec.employeeName && e.name.trim().toLowerCase() === expenseRec.employeeName.trim().toLowerCase())
    );
    setSelectedVoucherExpense(expenseRec);
    setSelectedVoucherEmployee(matchedEmp);
  };

  // Total sums
  const totalIncome = income.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const net = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = Number(incomeForm.amount);
    if (!amountNum || amountNum <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    const d = drivers.find((drv) => drv.id === incomeForm.driverId);
    const v = vehicles.find((veh) => veh.id === incomeForm.vehicleId);

    setLoading(true);
    try {
      await addIncomeRecord({
        date: incomeForm.date,
        category: incomeForm.category,
        amount: amountNum,
        paymentMethod: incomeForm.paymentMethod as any,
        driverId: d ? d.id : '',
        driverName: d ? d.name : '',
        vehicleId: v ? v.id : '',
        vehiclePlate: v ? v.plate : '',
        notes: incomeForm.notes || '',
        description: incomeForm.notes || `${incomeForm.category} revenue`,
      });
      setIsAddIncomeOpen(false);
    } catch (err: any) {
      console.error('Error adding income:', err);
      setFormError(err?.message || 'Failed to save income record. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = Number(expenseForm.amount);
    if (!amountNum || amountNum <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    const isPayroll = expenseForm.category === 'Staff/Payroll' || expenseForm.category === 'Salaries';
    const emp = employees.find((item) => item.id === expenseForm.employeeId);
    const v = vehicles.find((veh) => veh.id === expenseForm.vehicleId);

    if (isPayroll && !emp && !expenseForm.vendor.trim()) {
      setFormError('Please select or specify the staff member / employee being paid.');
      return;
    }

    setLoading(true);
    try {
      await addExpenseRecord({
        date: expenseForm.date,
        category: expenseForm.category,
        amount: amountNum,
        paymentMethod: expenseForm.paymentMethod as any,
        vehicleId: isPayroll ? '' : (v ? v.id : ''),
        vehiclePlate: isPayroll ? 'Staff Operations' : (v ? v.plate : ''),
        employeeId: emp ? emp.id : (expenseForm.employeeId || ''),
        employeeName: emp ? emp.name : (isPayroll ? expenseForm.vendor : ''),
        vendor: isPayroll ? (emp ? emp.name : expenseForm.vendor) : (expenseForm.vendor || ''),
        notes: expenseForm.notes || '',
        description: expenseForm.notes || (isPayroll ? `Staff Salary - ${emp?.name || expenseForm.vendor}` : `${expenseForm.category} expense`),
      });
      setIsAddExpenseOpen(false);
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setFormError(err?.message || 'Failed to save expense record. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      if (deleteTarget.type === 'Income') {
        await deleteIncomeRecord(deleteTarget.id);
      } else {
        await deleteExpenseRecord(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueIncome = Array.from(new Map(income.map((i) => [i.id, i])).values());
  const filteredIncome = uniqueIncome.filter((i) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      i.category.toLowerCase().includes(searchLow) ||
      (i.driverName && i.driverName.toLowerCase().includes(searchLow)) ||
      (i.vehiclePlate && i.vehiclePlate.toLowerCase().includes(searchLow)) ||
      (i.notes && i.notes.toLowerCase().includes(searchLow)) ||
      (i.description && i.description.toLowerCase().includes(searchLow));
    const matchesCat = categoryFilter === 'All' || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const uniqueExpenses = Array.from(new Map(expenses.map((e) => [e.id, e])).values());
  const filteredExpenses = uniqueExpenses.filter((e) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      e.category.toLowerCase().includes(searchLow) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchLow)) ||
      (e.employeeName && e.employeeName.toLowerCase().includes(searchLow)) ||
      (e.vehiclePlate && e.vehiclePlate.toLowerCase().includes(searchLow)) ||
      (e.notes && e.notes.toLowerCase().includes(searchLow)) ||
      (e.description && e.description.toLowerCase().includes(searchLow));
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate Breakdown for Profit & Loss View
  const incomeByCategory = income.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  const expenseByCategory = expenses.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">
            {activeTab === 'Income'
              ? 'Income & Revenue Ledger'
              : activeTab === 'Expenses'
              ? 'Expense & Operational Cost Ledger'
              : 'Profit & Loss Statement (P&L)'}
          </h1>
          <p className="text-xs text-[#718198]">
            {settings?.companyName || 'Prince Limousine & Car Rental'} • Financial accounts, operational cashflows & profitability
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab !== 'Profit & Loss' && (
            <>
              <button
                id="btn-add-income"
                onClick={() => {
                  setFormError(null);
                  setIncomeForm({
                    date: new Date().toISOString().split('T')[0],
                    category: 'Vehicle Rent',
                    driverId: '',
                    vehicleId: '',
                    amount: 2200,
                    paymentMethod: 'Bank Transfer',
                    notes: '',
                  });
                  setIsAddIncomeOpen(true);
                }}
                className="px-4 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Income</span>
              </button>

              <button
                id="btn-add-expense"
                onClick={() => {
                  setFormError(null);
                  setExpenseForm({
                    date: new Date().toISOString().split('T')[0],
                    category: 'Vehicle Maintenance',
                    vehicleId: '',
                    employeeId: '',
                    amount: 350,
                    vendor: 'Prince Fleet Garage / Woqod',
                    paymentMethod: 'Bank Transfer',
                    notes: '',
                  });
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2 bg-[#ef5553] hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </>
          )}

          {activeTab === 'Profit & Loss' && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Print / Export P&L</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Total Revenues</span>
            <ArrowUpRight className="w-4 h-4 text-[#20b56f]" />
          </div>
          <div className="text-xl font-extrabold text-[#20b56f] font-mono">
            QAR {totalIncome.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{income.length} income entries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Total Expenses</span>
            <ArrowDownLeft className="w-4 h-4 text-[#ef5553]" />
          </div>
          <div className="text-xl font-extrabold text-[#ef5553] font-mono">
            QAR {totalExpenses.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{expenses.length} expense entries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Net Operating Balance</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1f73e8]">QAR</span>
          </div>
          <div
            className={`text-xl font-extrabold font-mono ${
              net >= 0 ? 'text-[#20b56f]' : 'text-[#ef5553]'
            }`}
          >
            QAR {net.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {net >= 0 ? 'Profitable operation' : 'Net deficit'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Net Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-[#1f73e8]" />
          </div>
          <div
            className={`text-xl font-extrabold font-mono ${
              profitMargin >= 0 ? 'text-[#1f73e8]' : 'text-[#ef5553]'
            }`}
          >
            {profitMargin}%
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Operating profit ratio</div>
        </div>
      </div>

      {/* Navigation tabs & Search bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 bg-[#f5f8fb] p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('Income');
              setCategoryFilter('All');
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'Income'
                ? 'bg-white text-[#20b56f] shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Income Records ({income.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('Expenses');
              setCategoryFilter('All');
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'Expenses' && categoryFilter !== 'Staff/Payroll'
                ? 'bg-white text-[#ef5553] shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Expense Records ({expenses.filter((e) => e.category !== 'Staff/Payroll' && e.category !== 'Salaries').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('Payroll');
              setCategoryFilter('Staff/Payroll');
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'Payroll' || (activeTab === 'Expenses' && categoryFilter === 'Staff/Payroll')
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Payroll & Salaries ({employees.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('Profit & Loss');
              setCategoryFilter('All');
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'Profit & Loss'
                ? 'bg-white text-[#1f73e8] shadow-xs'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Profit & Loss Statement (P&L)
          </button>
        </div>

        {activeTab !== 'Profit & Loss' && (
          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryFilter(val);
                if (val === 'Staff/Payroll') {
                  setActiveTab('Payroll');
                } else if (activeTab === 'Payroll') {
                  setActiveTab('Expenses');
                }
              }}
              className="py-1.5 px-2.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
            >
              <option value="All">All Categories</option>
              {activeTab === 'Income' ? (
                <>
                  <option value="Vehicle Rent">Vehicle Rent</option>
                  <option value="Driver Installments">Driver Installments</option>
                  <option value="Fine Recovery">Fine Recovery</option>
                  <option value="Security Deposit">Security Deposit</option>
                  <option value="Other Income">Other Income</option>
                </>
              ) : (
                <>
                  <option value="Staff/Payroll">Staff / Payroll</option>
                  <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Salik/Tolls">Salik/Tolls</option>
                  <option value="Office Rent">Office Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Car Wash">Car Wash</option>
                  <option value="Fines">Fines</option>
                  <option value="Other Expenses">Other Expenses</option>
                </>
              )}
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'Income'
                    ? 'Search driver, plate, note...'
                    : 'Search employee, vendor, plate...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'Income' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Driver</th>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Description / Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (QAR)</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No income records found. Click "+ Add Income" to record a payment.
                    </td>
                  </tr>
                ) : (
                  filteredIncome.map((item, idx) => (
                    <tr key={`inc-${item.id}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-600 font-mono">{item.date}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-[#20b56f] font-semibold text-[10px] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#122038]">
                        {item.driverName || 'Walk-in / Client'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                        {item.vehiclePlate || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {item.notes || item.description || '-'}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#20b56f] text-right font-mono">
                        QAR {item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, type: 'Income' })}
                          className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                          title="Delete income record"
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

      {/* Staff Payroll & Salaries View (Active when Payroll tab is selected OR categoryFilter is Staff/Payroll) */}
      {(activeTab === 'Payroll' || (activeTab === 'Expenses' && categoryFilter === 'Staff/Payroll')) && (
        <div className="space-y-6">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Monthly Staff Payroll</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-extrabold text-[#122038] font-mono">
                QAR {totalMonthlyPayrollLiability.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Total base salary obligation ({activeEmployees.length} staff)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Salaries Disbursed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                QAR {salariesPaidThisMonth.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Paid for {currentMonthName}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Pending Salary Dues</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-600 font-mono">
                QAR {pendingSalariesDue.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Unpaid staff balance for {currentMonthName}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Active Staff Team</span>
                <Briefcase className="w-4 h-4 text-[#1f73e8]" />
              </div>
              <div className="text-xl font-extrabold text-[#1f73e8] font-mono">
                {activeEmployees.length} Members
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Fleet operations & management
              </div>
            </div>
          </div>

          {/* Quick Actions & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/70 p-4 rounded-xl border border-purple-100">
            <div>
              <h2 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                <span>Company Staff Salaries & WPS Payroll Roster</span>
              </h2>
              <p className="text-xs text-purple-700">
                Manage monthly staff compensation, generate WPS salary slips, and disburse vouchers for {currentMonthName}.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {employees.length === 0 && (
                <button
                  onClick={handleSeedStaff}
                  disabled={isSeedingStaff}
                  className="px-3.5 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isSeedingStaff ? 'Loading Fleet Team...' : 'Load Standard Fleet Staff'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setExpenseForm({
                    date: new Date().toISOString().split('T')[0],
                    category: 'Staff/Payroll',
                    vehicleId: '',
                    employeeId: employees[0]?.id || '',
                    amount: employees[0]?.salary ? Number(employees[0].salary) : 5000,
                    vendor: employees[0]?.name || '',
                    paymentMethod: 'Bank Transfer',
                    notes: `Staff Salary for ${employees[0]?.name || 'Employee'} (${currentMonthName}) - WPS`,
                  });
                  setFormError(null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Disburse Salary</span>
              </button>
            </div>
          </div>

          {/* Employee Roster Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#fbfcfe] flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#122038]">
                Registered Fleet Operations Staff ({activeEmployees.length})
              </h3>
              <span className="text-[11px] text-gray-500">
                Cycle: 1st of month • Qatar Labor Law WPS Compliant
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Department & Role</th>
                    <th className="py-3 px-4 font-semibold">Qatar ID (QID)</th>
                    <th className="py-3 px-4 font-semibold">Contact & WhatsApp</th>
                    <th className="py-3 px-4 font-semibold text-right">Monthly Base Salary</th>
                    <th className="py-3 px-4 font-semibold">{currentMonthName} Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <Users className="w-10 h-10 text-purple-300 mx-auto" />
                          <p className="font-bold text-gray-700 text-sm">
                            No Staff Members in Registry
                          </p>
                          <p className="text-gray-400 text-xs">
                            Load the standard Prince Limousine management, workshop, and operations team with a single click.
                          </p>
                          <button
                            onClick={handleSeedStaff}
                            disabled={isSeedingStaff}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{isSeedingStaff ? 'Loading Team...' : 'Load Standard Fleet Staff Roster'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, empIdx) => {
                      const paidRec = isEmployeePaidThisMonth(emp);
                      const isPaid = Boolean(paidRec);

                      return (
                        <tr key={`emp-${emp.id}-${empIdx}`} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  ID: {emp.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-gray-800 block text-xs">
                                {emp.designation || emp.position || 'Operations Staff'}
                              </span>
                              <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                                {emp.department || 'Operations'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-gray-700">
                            {emp.qid || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-gray-700 text-xs">
                                {emp.mobile || 'N/A'}
                              </span>
                              {emp.mobile && (
                                <WhatsAppButton
                                  phone={emp.mobile}
                                  driverName={emp.name}
                                  message={
                                    isPaid
                                      ? `Dear ${emp.name}, your salary of QAR ${(paidRec?.amount || emp.salary).toLocaleString()} for ${currentMonthName} has been processed by ${settings?.companyName || 'Prince Limousine'}. Reference: ${paidRec?.notes || 'WPS'}.`
                                      : `Dear ${emp.name}, salary payroll for ${currentMonthName} is scheduled for disbursement by ${settings?.companyName || 'Prince Limousine'}.`
                                  }
                                  variant="badge"
                                  label="WhatsApp"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-gray-900">
                            QAR {Number(emp.salary || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {paidRec ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <Check className="w-3 h-3" />
                                  <span>Paid (QAR {paidRec.amount.toLocaleString()})</span>
                                </span>
                                <span className="text-[10px] text-gray-400 block font-mono pl-1">
                                  {paidRec.date} • {paidRec.paymentMethod || 'WPS'}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                <Clock className="w-3 h-3" />
                                <span>Pending Salary Due</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {!paidRec ? (
                              <button
                                onClick={() => handleOpenPaySalaryModal(emp)}
                                className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Disburse monthly salary"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Salary</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleViewVoucher(paidRec)}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="View official WPS printable voucher"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Salary Slip</span>
                                </button>
                                <button
                                  onClick={() => handleOpenPaySalaryModal(emp)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Pay additional bonus or allowance"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Bonus</span>
                                </button>
                              </>
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

          {/* Processed Salary Vouchers History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#fbfcfe] flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#122038] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Processed Staff Salary Disbursements & WPS Vouchers</span>
              </h3>
              <span className="text-[11px] text-gray-500">
                {expenses.filter((e) => e.category === 'Staff/Payroll' || e.category === 'Salaries').length} Disbursement Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Staff Employee</th>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Notes / Reference</th>
                    <th className="py-3 px-4 font-semibold text-right">Disbursed (QAR)</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.filter((e) => e.category === 'Staff/Payroll' || e.category === 'Salaries').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No salary disbursement records logged yet. Click "Pay Salary" on an employee above to disburse salary.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter((e) => e.category === 'Staff/Payroll' || e.category === 'Salaries')
                      .map((item, vchrIdx) => (
                        <tr key={`vchr-${item.id}-${vchrIdx}`} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3 px-4 text-gray-600 font-mono">{item.date}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">
                                  {item.employeeName || item.vendor || 'Staff Member'}
                                </span>
                                <span className="text-[10px] text-purple-600 font-medium">
                                  WPS Payroll Disbursed
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {item.paymentMethod || 'Bank Transfer'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {item.notes || item.description || '-'}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-purple-700 text-right font-mono">
                            QAR {item.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleViewVoucher(item)}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Print official salary voucher"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Slip</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: item.id, type: 'Expense' })}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Standard Operational Expense Table (when not in Staff/Payroll) */}
      {activeTab === 'Expenses' && categoryFilter !== 'Staff/Payroll' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Vendor / Garage</th>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Description / Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (QAR)</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.filter((e) => e.category !== 'Staff/Payroll' && e.category !== 'Salaries').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No operational expense records found. Click "+ Add Expense" to record an expense.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses
                    .filter((e) => e.category !== 'Staff/Payroll' && e.category !== 'Salaries')
                    .map((item, expIdx) => (
                      <tr key={`exp-${item.id}-${expIdx}`} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-gray-600 font-mono">{item.date}</td>
                        <td className="py-3 px-4">
                          <span className="bg-rose-50 text-[#ef5553] font-semibold text-[10px] px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#122038]">
                            {item.vendor || item.description || 'General Payee'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#1f73e8]">
                            {item.vehiclePlate || 'Fleet Wide'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {item.notes || item.description || '-'}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#ef5553] text-right font-mono">
                          QAR {item.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeleteTarget({ id: item.id, type: 'Expense' })}
                            className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                            title="Delete expense record"
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

      {/* Profit & Loss View */}
      {activeTab === 'Profit & Loss' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Streams */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#122038]">Revenue Streams</h3>
                    <p className="text-[10px] text-gray-500">Breakdown by income category</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-emerald-600">
                  QAR {totalIncome.toLocaleString()}
                </span>
              </div>

              {Object.keys(incomeByCategory).length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs italic">No income entries logged.</div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(incomeByCategory).map(([cat, amount]) => {
                    const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{cat}</span>
                          <span className="font-mono font-bold text-gray-900">
                            QAR {amount.toLocaleString()} <span className="text-[10px] text-gray-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#122038]">Operational Costs</h3>
                    <p className="text-[10px] text-gray-500">Breakdown by expense category</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-rose-600">
                  QAR {totalExpenses.toLocaleString()}
                </span>
              </div>

              {Object.keys(expenseByCategory).length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs italic">No expenses logged.</div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(expenseByCategory).map(([cat, amount]) => {
                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{cat}</span>
                          <span className="font-mono font-bold text-gray-900">
                            QAR {amount.toLocaleString()} <span className="text-[10px] text-gray-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#122038] mb-3">Operating Summary & Profit Margins</h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Gross Operating Revenues</span>
                <span className="font-mono font-bold text-emerald-600">QAR {totalIncome.toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Less: Fleet Maintenance & Repairs</span>
                <span className="font-mono font-bold text-rose-600">
                  QAR {(expenseByCategory['Vehicle Maintenance'] || 0).toLocaleString()}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Less: Other Operating & General Expenses</span>
                <span className="font-mono font-bold text-rose-600">
                  QAR {(totalExpenses - (expenseByCategory['Vehicle Maintenance'] || 0)).toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between bg-blue-50/50 px-3 rounded-lg font-bold text-sm mt-2">
                <span className="text-[#122038]">Net Operating Profit (EBITDA)</span>
                <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  QAR {net.toLocaleString()} ({profitMargin}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {isAddIncomeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">Add Income Record</h3>
              <button
                onClick={() => setIsAddIncomeOpen(false)}
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

            <form onSubmit={handleIncomeSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={incomeForm.category}
                    onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Vehicle Rent">Vehicle Rent</option>
                    <option value="Driver Installments">Driver Installments</option>
                    <option value="Fine Recovery">Fine Recovery</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Other Income">Other Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Driver (Optional)</label>
                <select
                  value={incomeForm.driverId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, driverId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Optional / Walk-in --</option>
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
                  value={incomeForm.vehicleId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, vehicleId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Optional / General --</option>
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
                    value={incomeForm.amount}
                    onChange={(e) =>
                      setIncomeForm({ ...incomeForm, amount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={incomeForm.paymentMethod}
                    onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
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
                <label className="block font-semibold text-gray-700 mb-1">Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly rent advance payment"
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddIncomeOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">Add Expense Record</h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
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

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => handleExpenseCategoryChange(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Staff/Payroll">Staff / Payroll</option>
                    <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Salik/Tolls">Salik/Tolls</option>
                    <option value="Office Rent">Office Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Car Wash">Car Wash</option>
                    <option value="Fines">Fines</option>
                    <option value="Other Expenses">Other Expenses</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Employee Selection when Staff/Payroll is active */}
              {expenseForm.category === 'Staff/Payroll' || expenseForm.category === 'Salaries' ? (
                <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-purple-900 text-xs flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-700" />
                      <span>Select Employee for Salary Disbursement *</span>
                    </label>
                    <span className="text-[10px] text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200 font-semibold">
                      {employees.length} Staff Registered
                    </span>
                  </div>

                  <select
                    value={expenseForm.employeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full p-2.5 border border-purple-200 rounded-lg bg-white focus:outline-none text-xs font-semibold text-gray-800"
                  >
                    <option value="">-- Choose Employee / Staff Member --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.designation || emp.position || 'Staff'} (Salary: QAR {Number(emp.salary || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {/* Highlight Employee Details Card if selected */}
                  {selectedEmployeeObj && (
                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">
                            {selectedEmployeeObj.name[0]}
                          </div>
                          <span>{selectedEmployeeObj.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Base Salary: QAR {Number(selectedEmployeeObj.salary || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                        <div>
                          <span className="text-gray-400">Position:</span>{' '}
                          <span className="font-semibold text-gray-700">{selectedEmployeeObj.designation || selectedEmployeeObj.position || 'Operations'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Department:</span>{' '}
                          <span className="font-semibold text-gray-700">{selectedEmployeeObj.department || 'Operations'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">QID:</span>{' '}
                          <span className="font-mono text-gray-700">{selectedEmployeeObj.qid || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Mobile:</span>{' '}
                          <span className="font-mono text-gray-700">{selectedEmployeeObj.mobile || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedEmployeeObj && (
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                        Or enter Payee / Temp Staff Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tariq Mansoor (Contract Mechanic)"
                        value={expenseForm.vendor}
                        onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                        className="w-full p-2 border border-purple-200 rounded-lg bg-white text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Vehicle (Optional)</label>
                  <select
                    value={expenseForm.vehicleId}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, vehicleId: e.target.value })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="">-- Fleet Wide / General --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.make} {v.model}) {v.currentDriverName ? `• Driver: ${v.currentDriverName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Amount (QAR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {expenseForm.category === 'Staff/Payroll' || expenseForm.category === 'Salaries'
                      ? 'Beneficiary / Payee'
                      : expenseForm.category === 'Utilities' || expenseForm.category === 'Office Rent'
                      ? 'Vendor / Utility Provider'
                      : 'Vendor / Garage'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      expenseForm.category === 'Staff/Payroll'
                        ? 'Employee Name'
                        : expenseForm.category === 'Utilities'
                        ? 'e.g. Kahramaa / Ooredoo'
                        : 'e.g. Woqod / Garage'
                    }
                    value={expenseForm.vendor}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, vendor: e.target.value })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer / WPS</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Company Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {expenseForm.category === 'Staff/Payroll' || expenseForm.category === 'Salaries'
                      ? 'Salary Period / WPS Ref'
                      : 'Notes / Purpose'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      expenseForm.category === 'Staff/Payroll'
                        ? 'e.g. September 2026 Salary - WPS'
                        : 'e.g. Oil filter & lube'
                    }
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#ef5553] hover:bg-rose-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type} Record`}
        message={`Are you sure you want to delete this ${deleteTarget?.type.toLowerCase()} record?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />

      {/* Salary Slip & WPS Voucher Modal */}
      <SalaryVoucherModal
        isOpen={!!selectedVoucherExpense}
        onClose={() => {
          setSelectedVoucherExpense(null);
          setSelectedVoucherEmployee(undefined);
        }}
        expense={selectedVoucherExpense}
        employee={selectedVoucherEmployee}
      />
    </div>
  );
};
