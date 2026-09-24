import React from 'react';
import { Contract } from '../types';
import { Printer, X, Download } from 'lucide-react';

interface ApprovedContractPrintProps {
  contract: Contract;
  onClose: () => void;
}

export const ApprovedContractPrint: React.FC<ApprovedContractPrintProps> = ({
  contract,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="contract-print-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
    >
      {/* Container with Print Controls on screen */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top bar (Hidden when printing) */}
        <div className="no-print bg-[#0c1b2d] text-white px-6 py-3.5 flex items-center justify-between border-b border-[#13283f]">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm tracking-wide">
              Official Bilingual Contract: {contract.contractNo}
            </span>
            <span className="text-[11px] bg-[#c9a15b]/20 text-[#c9a15b] font-semibold px-2 py-0.5 rounded border border-[#c9a15b]/40">
              A4 Standard Approved Layout
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              id="print-contract-action-btn"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Contract</span>
            </button>
            <button
              id="close-contract-modal-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable contract paper container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-gray-100 flex justify-center">
          {/* Exact A4 Printable Sheet */}
          <div
            id="approved-printable-contract"
            className="printable-sheet bg-white text-[#122038] shadow-md border border-gray-300 p-8 sm:p-10 w-full max-w-[794px] min-h-[1080px] flex flex-col justify-between"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3">
                <div className="flex items-center space-x-3.5">
                  {/* Official Company Logo */}
                  <img
                    src="/prince-logo.png"
                    alt="Prince Group of Companies Logo"
                    className="w-16 h-16 object-contain rounded-md shadow-2xs border border-gray-100 bg-white p-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-[#0c1b2d] leading-tight font-serif">
                      Prince Group of Companies
                    </h1>
                    <div className="text-[11px] font-bold text-[#1f73e8] tracking-wider uppercase">
                      Qatar Limousine & Luxury Fleet Services
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      CR Reg. • Tel: 70543888 • Doha, State of Qatar
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-base font-bold text-[#0c1b2d]">
                    Monthly Rental Agreement
                  </h2>
                  <div
                    className="text-sm font-bold text-[#1f73e8] mt-0.5"
                    dir="rtl"
                    style={{ fontFamily: "'Tajawal', 'Segoe UI', Tahoma, sans-serif" }}
                  >
                    اتفاقية إيجار شهري
                  </div>
                </div>
              </div>

              {/* Dividing Line */}
              <div className="w-full h-[2.5px] bg-[#1a4b8c] my-2" />

              {/* Contract Details Box */}
              <div className="border border-[#1a4b8c]/40 rounded-md p-3.5 my-3 grid grid-cols-2 gap-4 text-xs bg-[#f8fbfe]/50">
                {/* English Side */}
                <div className="space-y-1.5">
                  <div className="font-bold text-[#0c1b2d] text-xs mb-1">Contract Details</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract No</span>
                    <span className="font-bold text-[#0c1b2d]">{contract.contractNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-semibold text-[#0c1b2d]">{contract.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End / Duration</span>
                    <span className="font-semibold text-[#0c1b2d]">{contract.endDate || '1 Month (Renewable)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Amount</span>
                    <span className="font-bold text-[#0c1b2d]">
                      QAR {Number(contract.monthlyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Arabic Side */}
                <div className="space-y-1.5 text-right" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  <div className="font-bold text-[#0c1b2d] text-xs mb-1">بيانات العقد</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">رقم العقد</span>
                    <span className="font-bold text-[#0c1b2d]">{contract.contractNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاريخ البداية</span>
                    <span className="font-semibold text-[#0c1b2d]">{contract.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">النهاية / المدة</span>
                    <span className="font-semibold text-[#0c1b2d]">{contract.endDate || '1 شهر'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المبلغ الشهري</span>
                    <span className="font-bold text-[#0c1b2d]">
                      QAR {Number(contract.monthlyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parties and Vehicle Section */}
              <div className="mt-4">
                <div className="text-xs font-bold text-[#0c1b2d] mb-1.5 flex justify-between items-center">
                  <span>Parties and Vehicle</span>
                  <span dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>الأطراف والمركبة</span>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-[#f0f4f9] text-[#0c1b2d]">
                      <th className="border border-gray-300 px-3 py-1.5 text-left font-bold w-1/4">Section</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-left font-bold w-2/5">English Details</th>
                      <th className="border border-gray-300 px-3 py-1.5 text-right font-bold w-1/3" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        البيانات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-800 align-top">
                        First Party
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-top text-gray-700">
                        <div className="font-bold text-[#0c1b2d]">Prince Group of Companies</div>
                        <div>Authorized Manager</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right align-top text-gray-700" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">Prince Group of Companies</div>
                        <div>Authorized Manager</div>
                      </td>
                    </tr>

                    <tr className="bg-gray-50/50">
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-800 align-top">
                        Second Party
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-top text-gray-700">
                        <div className="font-bold text-[#0c1b2d]">{contract.driverName}</div>
                        <div>QID/CR: {contract.driverQid}</div>
                        <div>Mobile: {contract.driverMobile}</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right align-top text-gray-700" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">{contract.driverName}</div>
                        <div>الرقم: {contract.driverQid}</div>
                        <div>الجوال: {contract.driverMobile}</div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-800 align-top">
                        Vehicle
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-top text-gray-700">
                        <div className="font-bold text-[#0c1b2d]">Plate: {contract.vehiclePlate}</div>
                        <div>
                          {contract.vehicleMake} | {contract.vehicleModel} | {contract.vehicleYear} | {contract.vehicleColor}
                        </div>
                        {contract.currentMileage ? (
                          <div className="text-[11px] text-gray-500">Handover KM: {contract.currentMileage.toLocaleString()} km</div>
                        ) : null}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right align-top text-gray-700" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">رقم اللوحة: {contract.vehiclePlate}</div>
                        <div>
                          {contract.vehicleMake} | {contract.vehicleModel} | {contract.vehicleYear} | {contract.vehicleColor}
                        </div>
                      </td>
                    </tr>

                    <tr className="bg-gray-50/50">
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-800 align-top">
                        Payment
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-top text-gray-700">
                        <div>Monthly: QAR {Number(contract.monthlyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div>Security Deposit: QAR {Number(contract.securityDeposit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right align-top text-gray-700" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div>شهري: QAR {Number(contract.monthlyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div>التأمين: QAR {Number(contract.securityDeposit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Terms and Conditions Section */}
              <div className="mt-4">
                <div className="text-xs font-bold text-[#0c1b2d] mb-1.5 flex justify-between items-center">
                  <span>Terms and Conditions</span>
                  <span dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>الشروط والأحكام</span>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-[11px] leading-tight">
                  <thead>
                    <tr className="bg-[#f0f4f9] text-[#0c1b2d]">
                      <th className="border border-gray-300 px-2 py-1 text-center font-bold w-8">No.</th>
                      <th className="border border-gray-300 px-3 py-1 text-left font-bold w-1/2">English</th>
                      <th className="border border-gray-300 px-3 py-1 text-right font-bold w-1/2" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>العربية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Clause 1 */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">1</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">Vehicle Handover</div>
                        <div className="text-gray-700">The First Party hands over the vehicle to the Second Party for the agreed use only.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">تسليم واستلام المركبة</div>
                        <div className="text-gray-700">يسلم الطرف الأول المركبة إلى الطرف الثاني للاستخدام المتفق عليه فقط.</div>
                      </td>
                    </tr>

                    {/* Clause 2 */}
                    <tr className="bg-gray-50/40">
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">2</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">Payment</div>
                        <div className="text-gray-700">The Second Party shall pay the monthly rent/installment on or before the due date.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">سداد الإيجار والأقساط</div>
                        <div className="text-gray-700">يلتزم الطرف الثاني بسداد الإيجار أو القسط الشهري في الموعد المحدد.</div>
                      </td>
                    </tr>

                    {/* Clause 3 */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">3</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">Traffic Fines</div>
                        <div className="text-gray-700">All traffic fines, tolls, fuel shortage, misuse, and damages caused by negligence are payable by the Second Party.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">المخالفات المرورية والرسوم</div>
                        <div className="text-gray-700">يتحمل الطرف الثاني المخالفات والرسوم ونقص الوقود والأضرار الناتجة عن الإهمال.</div>
                      </td>
                    </tr>

                    {/* Clause 4 */}
                    <tr className="bg-gray-50/40">
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">4</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">Maintenance and Insurance</div>
                        <div className="text-gray-700">Maintenance and insurance responsibilities shall follow the contract terms and company policy.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">الصيانة والتأمين</div>
                        <div className="text-gray-700">تكون مسؤولية الصيانة والتأمين حسب شروط العقد وسياسة الشركة.</div>
                      </td>
                    </tr>

                    {/* Clause 5 */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">5</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">No Transfer</div>
                        <div className="text-gray-700">The vehicle may not be sold, pledged, subleased, or handed over to any other person without written approval.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">حظر البيع والتنازل للغير</div>
                        <div className="text-gray-700">لا يجوز بيع أو رهن أو تأجير أو تسليم المركبة للغير دون موافقة خطية.</div>
                      </td>
                    </tr>

                    {/* Clause 6 */}
                    <tr className="bg-gray-50/40">
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold align-top">6</td>
                      <td className="border border-gray-300 px-3 py-1.5 align-top">
                        <div className="font-bold text-[#0c1b2d]">Acceptance</div>
                        <div className="text-gray-700">Both parties confirm that they have read, understood, and accepted all terms.</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right align-top" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <div className="font-bold text-[#0c1b2d]">الإقرار والموافقة التامة</div>
                        <div className="text-gray-700">يقر الطرفان بقراءة وفهم وقبول جميع الشروط.</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Signatures and Footer */}
            <div className="mt-8 pt-6">
              <div className="flex justify-between items-end px-4 mb-8 text-xs font-semibold text-gray-700">
                <div className="text-center w-56">
                  <div className="border-t border-gray-600 pt-2 font-bold text-[#0c1b2d]">
                    First Party Signature / توقيع الطرف الأول
                  </div>
                </div>
                <div className="text-center w-56">
                  <div className="border-t border-gray-600 pt-2 font-bold text-[#0c1b2d]">
                    Second Party Signature / توقيع الطرف الثاني
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-gray-500 border-t border-gray-200 pt-2">
                Computer Generated Bilingual Contract | FleetERP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
