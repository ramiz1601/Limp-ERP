import React from 'react';
import { Installment } from '../types';
import { useDb } from '../context/DbContext';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface InstallmentReceiptModalProps {
  installment: Installment | null;
  onClose: () => void;
}

export const InstallmentReceiptModal: React.FC<InstallmentReceiptModalProps> = ({
  installment,
  onClose,
}) => {
  const { settings } = useDb();

  if (!installment) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = settings?.companyName || 'Prince Limousine & Car Rental';
  const companyPhone = settings?.companyPhone || '70543888';
  const address = settings?.address || 'Doha, State of Qatar';
  const logoUrl = settings?.companyLogoUrl || '/prince-logo.svg';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-[#122038]">Official Installment Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="overflow-y-auto py-4 space-y-5 text-xs text-gray-800 print:m-0 print:p-0">
          {/* Company Brand Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-[#0c1b2d] border border-[#c9a15b]/40">
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/prince-logo.svg';
                  }}
                />
              </div>
              <div>
                <h2 className="font-black text-base text-gray-900 tracking-wide uppercase">
                  {companyName}
                </h2>
                <p className="text-[10px] text-gray-500 font-medium">
                  {address} • Tel: {companyPhone}
                </p>
                <p className="text-[9px] text-[#c9a15b] font-bold uppercase tracking-wider">
                  Vehicle Financing & Rent-to-Own Department
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Official Receipt
              </span>
              <div className="text-[10px] font-mono text-gray-500 mt-1">
                Ref: REC-INST-{installment.id ? installment.id.slice(0, 6).toUpperCase() : '001'}
              </div>
              <div className="text-[10px] text-gray-500">
                Date: {new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>

          {/* Core Receipt Details */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Received From (Driver)</span>
              <span className="font-bold text-sm text-gray-900">{installment.driverName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Vehicle Plate</span>
              <span className="font-mono font-bold text-sm text-[#1f73e8]">{installment.vehiclePlate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Installment Number</span>
              <span className="font-semibold text-xs">
                Installment #{installment.installmentNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Scheduled Due Date</span>
              <span className="font-mono text-xs">{installment.dueDate}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Scheduled (QAR)</th>
                  <th className="py-2 px-3 text-right">Paid (QAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2.5 px-3">
                    Monthly Rent-to-Own Installment #{installment.installmentNumber} for Vehicle{' '}
                    <span className="font-mono font-bold">{installment.vehiclePlate}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {installment.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {installment.paid.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-emerald-50/70 border-t border-emerald-100 text-emerald-950 font-bold">
                <tr>
                  <td className="py-2 px-3">Total Amount Paid in this Voucher</td>
                  <td colSpan={2} className="py-2 px-3 text-right font-mono text-base">
                    QAR {installment.paid.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance info */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-gray-300 text-xs">
            <span className="font-medium text-gray-600">Remaining Installment Balance:</span>
            <span className={`font-mono font-bold ${installment.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              QAR {installment.remaining.toLocaleString()}
            </span>
          </div>

          {/* Signature and Seal */}
          <div className="pt-6 grid grid-cols-2 gap-8 border-t border-gray-200">
            <div className="text-center">
              <div className="h-10 border-b border-gray-300"></div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mt-1">
                Driver Signature
              </span>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-gray-300 flex items-center justify-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest border border-emerald-300 px-2 py-0.5 rounded">
                  PAID & VERIFIED
                </span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mt-1">
                Authorized Officer / Cashier
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
