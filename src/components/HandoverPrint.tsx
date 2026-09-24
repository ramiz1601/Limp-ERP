import React from 'react';
import { HandoverRecord } from '../types';
import { Printer, X, CheckCircle2, ShieldCheck, Car, Calendar, Fuel, Gauge } from 'lucide-react';

interface HandoverPrintProps {
  handover: HandoverRecord;
  onClose: () => void;
}

export const HandoverPrint: React.FC<HandoverPrintProps> = ({ handover, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isReturn = handover.type === 'Return';

  return (
    <div
      id="handover-print-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="no-print bg-[#0c1b2d] text-white px-6 py-3.5 flex items-center justify-between border-b border-[#13283f]">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm tracking-wide">
              Official {handover.type} Protocol • Plate: {handover.vehiclePlate}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                isReturn
                  ? 'bg-amber-500/20 text-[#e5c47d] border-[#e5c47d]/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
              }`}
            >
              {isReturn ? 'Vehicle Check-In / Return' : 'Vehicle Handover / Check-Out'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="print-handover-action-btn"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Protocol</span>
            </button>
            <button
              id="close-handover-modal-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-gray-100 flex justify-center">
          <div
            id="printable-handover-protocol"
            className="printable-sheet bg-white text-[#122038] shadow-md border border-gray-300 p-8 sm:p-10 w-full max-w-[794px] min-h-[1050px] flex flex-col justify-between"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-[#0c1b2d]">
                <div className="flex items-center space-x-3.5">
                  <img
                    src="/prince-logo.png"
                    alt="Prince Group of Companies"
                    className="w-16 h-16 object-contain rounded-md shadow-2xs border border-gray-100 bg-white p-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-[#0c1b2d] leading-tight font-serif">
                      Prince Group of Companies
                    </h1>
                    <div className="text-[11px] font-bold text-[#1f73e8] tracking-wider uppercase">
                      Qatar Limousine & Luxury Transportation
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      CR Reg. • Tel: 70543888 • Doha, State of Qatar
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-base font-bold text-[#0c1b2d]">
                    {isReturn ? 'VEHICLE RETURN PROTOCOL' : 'VEHICLE HANDOVER PROTOCOL'}
                  </h2>
                  <div
                    className="text-sm font-bold text-[#1f73e8] mt-0.5"
                    dir="rtl"
                    style={{ fontFamily: "'Tajawal', 'Segoe UI', Tahoma, sans-serif" }}
                  >
                    {isReturn ? 'محضر استرجاع وفحص المركبة' : 'محضر استلام وتفتيش المركبة'}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    REF: HR-{handover.id?.slice(0, 8).toUpperCase() || 'OFFICIAL'}
                  </div>
                </div>
              </div>

              {/* Protocol Meta */}
              <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Transaction Date / التاريخ</span>
                  <span className="font-bold text-[#122038] font-mono">{handover.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Protocol Type / نوع المعاملة</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] inline-block ${
                      isReturn ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {isReturn ? 'RETURN / استرجاع' : 'HANDOVER / تسليم'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Inspector / مفتش الأسطول</span>
                  <span className="font-bold text-[#122038]">{handover.inspectorName || 'Prince Fleet Supervisor'}</span>
                </div>
              </div>

              {/* Vehicle & Driver Information */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="font-bold text-[#0c1b2d] pb-1.5 border-b border-gray-100 flex items-center justify-between">
                    <span>1. VEHICLE DETAILS / بيانات المركبة</span>
                    <Car className="w-3.5 h-3.5 text-[#1f73e8]" />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plate Number:</span>
                      <span className="font-mono font-bold text-[#1f73e8] text-sm bg-blue-50 px-2 py-0.5 rounded">
                        {handover.vehiclePlate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Odometer Reading:</span>
                      <span className="font-mono font-bold text-[#122038]">
                        {(Number(handover.mileage) || 0).toLocaleString()} KM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fuel Level:</span>
                      <span className="font-bold text-[#20b56f]">{handover.fuelLevel || 'Full (100%)'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="font-bold text-[#0c1b2d] pb-1.5 border-b border-gray-100 flex items-center justify-between">
                    <span>2. DRIVER DETAILS / بيانات السائق</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c9a15b]" />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver Full Name:</span>
                      <span className="font-bold text-[#122038]">{handover.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Role:</span>
                      <span className="font-semibold text-gray-700">Authorized Limousine Chauffeur</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-emerald-700 font-bold">Active & Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Inspection Checklist */}
              <div className="border border-gray-200 rounded-lg p-3 mb-4 text-xs bg-white">
                <div className="font-bold text-[#0c1b2d] pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span>3. PHYSICAL INSPECTION & MANDATORY ACCESSORIES / الفحص الفني والملحقات</span>
                  <span className="text-[10px] text-gray-400 font-mono">QATAR MOT SPECIFICATION</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                  <div className="p-2 border border-gray-100 rounded bg-gray-50/50 flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${handover.istimaraCard !== false ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <div>
                      <div className="font-bold text-[11px]">Istimara Card</div>
                      <div className="text-[9px] text-gray-500">بطاقة الاستمارة الأصلية</div>
                    </div>
                  </div>

                  <div className="p-2 border border-gray-100 rounded bg-gray-50/50 flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${handover.spareTyre !== false ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <div>
                      <div className="font-bold text-[11px]">Spare Tyre & Tool</div>
                      <div className="text-[9px] text-gray-500">الإطار الاحتياطي والرافعة</div>
                    </div>
                  </div>

                  <div className="p-2 border border-gray-100 rounded bg-gray-50/50 flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${handover.acCooling !== false ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <div>
                      <div className="font-bold text-[11px]">AC Cooling</div>
                      <div className="text-[9px] text-gray-500">كفاءة تبريد المكيف</div>
                    </div>
                  </div>

                  <div className="p-2 border border-gray-100 rounded bg-gray-50/50 flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${handover.jackTools !== false ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <div>
                      <div className="font-bold text-[11px]">Limo Permit/GPS</div>
                      <div className="text-[9px] text-gray-500">تصريح الليموزين والعداد</div>
                    </div>
                  </div>
                </div>

                {/* Condition & Damage Notes */}
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="font-semibold text-gray-700 mb-1">
                    {isReturn ? 'Inspection Notes & Defects on Return:' : 'Vehicle Condition on Handover:'}
                  </div>
                  <p className="text-gray-800 italic bg-white p-2 rounded border border-gray-200 min-h-[44px]">
                    {isReturn
                      ? handover.newDamage || 'Vehicle returned in clean condition with normal wear and tear.'
                      : handover.condition || 'Clean interior and exterior. No scratches or body damage noted.'}
                  </p>
                </div>

                {/* Penalty Information if Return with penalty */}
                {isReturn && (handover.penalty ?? 0) > 0 && (
                  <div className="mt-3 p-3 bg-red-50/60 rounded border border-red-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-900 block">Assessed Penalty / Damage Surcharge:</span>
                      <span className="text-[11px] text-red-700">
                        {handover.penaltyReason || 'Fuel deficit / vehicle unwashed / missing accessories / delay'}
                      </span>
                    </div>
                    <div className="font-extrabold text-red-600 font-mono text-base">
                      QAR {(Number(handover.penalty) || 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Terms & Acknowledgment */}
              <div className="border border-gray-200 rounded-lg p-3 text-[10px] text-gray-600 space-y-1 bg-gray-50/30">
                <div className="font-bold text-[#0c1b2d] text-[11px]">
                  LEGAL UNDERTAKING & RESPONSIBILITY / إقرار وتعهد قانوني:
                </div>
                <p>
                  1. The driver hereby acknowledges the physical receipt or return of the specified vehicle with its keys, registration card, and tools, matching the recorded odometer mileage and fuel reading.
                </p>
                <p>
                  2. In accordance with Qatar Traffic Department regulations, the driver remains strictly liable for any traffic violations, radars, Metrash2 fines, or Salik toll charges incurred during their custody period.
                </p>
                <p dir="rtl" className="text-gray-500 text-[9px] pt-1">
                  يقر السائق الموقع أدناه بأنه قد عاين واستلم / سلّم المركبة المذكورة أعلاه بحالتها المبينة وعدادها ووقودها، ويتعهد بتحمل كافة المخالفات المرورية والغرامات المسجلة عليها خلال فترة حيازته لها وفقاً للقانون القطري.
                </p>
              </div>
            </div>

            {/* Signatures Block */}
            <div className="pt-6 mt-4 border-t-2 border-gray-200">
              <div className="grid grid-cols-3 gap-6 text-xs">
                {/* Fleet Inspector */}
                <div>
                  <div className="font-bold text-[#0c1b2d] mb-1">Fleet Inspector / مسؤول الأسطول</div>
                  <div className="h-16 border-b border-gray-300 flex items-end pb-1">
                    <span className="text-[11px] text-gray-400 font-mono italic">Authorized Signature</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {handover.inspectorName || 'Prince Fleet Supervisor'}
                  </div>
                </div>

                {/* Company Seal Box */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-20 border border-dashed border-[#c9a15b] rounded-lg flex flex-col items-center justify-center p-1 text-center bg-amber-50/30">
                    <span className="text-[8px] font-bold text-[#c9a15b] tracking-wider">OFFICIAL STAMP</span>
                    <span className="text-[7px] text-gray-400 mt-0.5">Prince Group of Companies</span>
                    <span className="text-[6px] text-gray-400">Doha, Qatar</span>
                  </div>
                </div>

                {/* Driver */}
                <div>
                  <div className="font-bold text-[#0c1b2d] mb-1">Driver / توقيع واستلام السائق</div>
                  <div className="h-16 border-b border-gray-300 flex items-end pb-1">
                    <span className="text-[11px] text-gray-400 font-mono italic">{handover.driverName}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Date: {handover.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
