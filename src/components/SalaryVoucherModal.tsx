import React from 'react';
import { Expense, Employee } from '../types';
import { useDb } from '../context/DbContext';
import { X, Printer, CheckCircle2, ShieldCheck, Building2, User, Calendar, CreditCard } from 'lucide-react';

interface SalaryVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  employee?: Employee;
}

export const SalaryVoucherModal: React.FC<SalaryVoucherModalProps> = ({
  isOpen,
  onClose,
  expense,
  employee,
}) => {
  const { settings } = useDb();

  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = settings?.companyName || 'Prince Limousine & Car Rental';
  const companyPhone = settings?.companyPhone || '+974 4412 3456';
  const companyAddress = settings?.address || 'Doha, State of Qatar';
  const empName = employee?.name || expense.employeeName || expense.vendor || 'Staff Member';
  const empRole = employee?.designation || employee?.position || 'Operations Staff';
  const empQid = employee?.qid || 'N/A';
  const empDept = employee?.department || 'Operations & Fleet Logistics';
  const empMobile = employee?.mobile || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 my-8">
        {/* Modal Actions Bar (hidden on print) */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              WPS Salary Slip
            </span>
            <span className="text-xs text-gray-500 font-mono">#{expense.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document */}
        <div className="pt-4 space-y-5 text-xs text-gray-700 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-sm">
                  PL
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#122038] tracking-tight">{companyName}</h2>
                  <p className="text-[10px] text-gray-500">{companyAddress} • Tel: {companyPhone}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                WPS Compliant • Paid
              </span>
              <div className="text-[11px] font-mono text-gray-500 mt-1">Date: {expense.date}</div>
            </div>
          </div>

          <div className="text-center py-1">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              Staff Salary Disbursement Voucher
            </h3>
            <p className="text-[11px] text-gray-500">Ministry of Labour - Wage Protection System (WPS)</p>
          </div>

          {/* Employee & Payment Info */}
          <div className="grid grid-cols-2 gap-3 bg-[#fbfcfe] p-3 rounded-xl border border-gray-200/80">
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Staff Name</span>
                <span className="font-bold text-gray-900 text-sm">{empName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Designation & Department</span>
                <span className="font-semibold text-gray-800">{empRole} • {empDept}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Qatar ID (QID)</span>
                <span className="font-mono font-bold text-gray-900">{empQid}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Disbursement Method</span>
                <span className="font-bold text-purple-700">{expense.paymentMethod || 'Bank Transfer (WPS)'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Contact Mobile</span>
                <span className="font-mono text-gray-800">{empMobile}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Reference / Notes</span>
                <span className="text-gray-700 truncate block">{expense.notes || expense.description || 'Monthly Salary'}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden text-xs">
            <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
              <tr>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-right">Amount (QAR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">
                  Monthly Basic Salary & Allowances
                </td>
                <td className="py-2.5 px-3 text-gray-500 font-mono">Staff/Payroll</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                  QAR {Number(expense.amount).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-purple-50/50 font-bold text-gray-900">
                <td colSpan={2} className="py-2.5 px-3 text-purple-950 uppercase tracking-wider text-[11px]">
                  Net Salary Transferred / Disbursed
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-base text-purple-800">
                  QAR {Number(expense.amount).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Compliance & Signature Lines */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-[11px]">
            <div className="border-t border-gray-300 pt-2 text-center">
              <p className="font-bold text-gray-800">Prepared & Authorized By</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Finance & Operations Management</p>
              <div className="h-8"></div>
              <p className="font-mono text-[10px] text-gray-400">Prince Limousine Signature & Stamp</p>
            </div>
            <div className="border-t border-gray-300 pt-2 text-center">
              <p className="font-bold text-gray-800">Employee Acknowledgment</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{empName} ({empQid})</p>
              <div className="h-8"></div>
              <p className="font-mono text-[10px] text-gray-400">Signature / Biometric Receipt</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100 mt-5 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Salary Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
