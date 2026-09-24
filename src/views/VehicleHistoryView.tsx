import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import {
  Car,
  Search,
  Calendar,
  KeyRound,
  Wrench,
  DollarSign,
  ArrowLeftRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Fuel,
  Gauge,
  Receipt,
  Download,
} from 'lucide-react';
import { WhatsAppButton, WhatsAppTemplates } from '../components/WhatsAppButton';

export const VehicleHistoryView: React.FC = () => {
  const { vehicles, assignments, handovers, maintenance, payments, financing, drivers, settings } =
    useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles.length > 0 ? vehicles[0].id : ''
  );
  const [historyTab, setHistoryTab] = useState<'all' | 'assignments' | 'handovers' | 'maintenance' | 'financials'>('all');

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Filtered vehicles for left selector
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.currentDriverName && v.currentDriverName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Data relating to selected vehicle
  const vehicleAssignments = assignments.filter(
    (a) => a.vehicleId === selectedVehicle?.id || (selectedVehicle && a.vehiclePlate === selectedVehicle.plate)
  );

  const vehicleHandovers = handovers.filter(
    (h) => h.vehicleId === selectedVehicle?.id || (selectedVehicle && h.vehiclePlate === selectedVehicle.plate)
  );

  const vehicleMaintenance = maintenance.filter(
    (m) => m.vehicleId === selectedVehicle?.id || (selectedVehicle && m.vehiclePlate === selectedVehicle.plate)
  );

  const vehiclePayments = payments.filter(
    (p) => p.vehicleId === selectedVehicle?.id || (selectedVehicle && p.vehiclePlate === selectedVehicle.plate)
  );

  const vehicleFinancing = financing.filter(
    (f) => f.vehicleId === selectedVehicle?.id || (selectedVehicle && f.vehiclePlate === selectedVehicle.plate)
  );

  // Financial calculations
  const totalRevenue = vehiclePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalMaintenanceCost = vehicleMaintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  const netEarnings = totalRevenue - totalMaintenanceCost;

  const currentDriver = selectedVehicle?.currentDriverId
    ? drivers.find((d) => d.id === selectedVehicle.currentDriverId)
    : selectedVehicle?.currentDriverName
    ? drivers.find((d) => d.name === selectedVehicle.currentDriverName)
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Fleet Vehicle History & Dossier</h1>
          <p className="text-xs text-[#718198]">
            {settings?.companyName || 'Prince Limousine & Car Rental'} • Complete lifecycle audit, assignment logs, inspection history & financial performance
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Printer className="w-4 h-4" />
          <span>Print Vehicle Dossier</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">No Vehicles in Fleet</h3>
          <p className="text-xs text-gray-400 mt-1">Add vehicles in Fleet Management to inspect history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vehicle Selector */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#122038]">Select Vehicle ({vehicles.length})</span>
              <span className="text-[10px] text-gray-400 font-mono">Doha Fleet</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plate, model, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto scrollbar-thin">
              {filteredVehicles.map((v) => {
                const isSelected = v.id === selectedVehicle?.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1f73e8] bg-blue-50/60 shadow-xs'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-[#122038]">{v.plate}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            v.status === 'On Rent' || v.status === 'Assigned'
                              ? 'bg-blue-50 text-[#1f73e8]'
                              : v.status === 'Available'
                              ? 'bg-emerald-50 text-[#20b56f]'
                              : 'bg-rose-50 text-[#ef5553]'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5 font-medium">
                        {v.make} {v.model} ({v.year})
                      </div>
                      <div className="text-[10px] text-[#718198] mt-0.5 truncate max-w-[170px]">
                        Driver: {v.currentDriverName || 'No Driver'}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-[#1f73e8] translate-x-0.5' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Complete Dossier of Selected Vehicle */}
          {selectedVehicle && (
            <div className="lg:col-span-8 space-y-6">
              {/* Vehicle Profile Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1f73e8] flex items-center justify-center font-bold font-mono">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-[#122038] font-mono">
                          {selectedVehicle.plate}
                        </h2>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedVehicle.status === 'On Rent' || selectedVehicle.status === 'Assigned'
                              ? 'bg-blue-50 text-[#1f73e8]'
                              : selectedVehicle.status === 'Available'
                              ? 'bg-emerald-50 text-[#20b56f]'
                              : 'bg-rose-50 text-[#ef5553]'
                          }`}
                        >
                          {selectedVehicle.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {selectedVehicle.make} {selectedVehicle.model} • {selectedVehicle.year} • {selectedVehicle.color} • {selectedVehicle.ownership}
                      </p>
                    </div>
                  </div>

                  {currentDriver && currentDriver.mobile && (
                    <div className="flex items-center space-x-2">
                      <WhatsAppButton
                        phone={currentDriver.mobile}
                        driverName={currentDriver.name}
                        label="WhatsApp Driver"
                        variant="pill"
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                {/* Quick specs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="bg-[#f8fbfe] p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-400">Current Odometer</div>
                    <div className="font-mono font-bold text-gray-900 mt-0.5">
                      {selectedVehicle.currentMileage.toLocaleString()} km
                    </div>
                  </div>
                  <div className="bg-[#f8fbfe] p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-400">Monthly Rent Rate</div>
                    <div className="font-mono font-bold text-emerald-600 mt-0.5">
                      QAR {(selectedVehicle.monthlyRent || 2200).toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="bg-[#f8fbfe] p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-400">Total Revenue Collected</div>
                    <div className="font-mono font-bold text-[#1f73e8] mt-0.5">
                      QAR {totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#f8fbfe] p-2.5 rounded-lg border border-gray-100">
                    <div className="text-[10px] text-gray-400">Total Maintenance Cost</div>
                    <div className="font-mono font-bold text-rose-600 mt-0.5">
                      QAR {totalMaintenanceCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Net Unit Profit Banner */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Vehicle Net Operating Margin:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      netEarnings >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    QAR {netEarnings.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* History Sub-tabs */}
              <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs flex flex-wrap gap-1 text-xs font-semibold">
                <button
                  onClick={() => setHistoryTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    historyTab === 'all' ? 'bg-[#1f73e8] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All History
                </button>
                <button
                  onClick={() => setHistoryTab('assignments')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    historyTab === 'assignments' ? 'bg-[#1f73e8] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Driver Assignments ({vehicleAssignments.length})
                </button>
                <button
                  onClick={() => setHistoryTab('handovers')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    historyTab === 'handovers' ? 'bg-[#1f73e8] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Handovers & Inspections ({vehicleHandovers.length})
                </button>
                <button
                  onClick={() => setHistoryTab('maintenance')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    historyTab === 'maintenance' ? 'bg-[#1f73e8] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Maintenance Logs ({vehicleMaintenance.length})
                </button>
                <button
                  onClick={() => setHistoryTab('financials')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    historyTab === 'financials' ? 'bg-[#1f73e8] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Payments & Income ({vehiclePayments.length})
                </button>
              </div>

              {/* Tab 1: Driver Assignments */}
              {(historyTab === 'all' || historyTab === 'assignments') && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <KeyRound className="w-4 h-4 text-[#1f73e8]" />
                    <h3 className="font-bold text-sm text-[#122038]">Driver Assignment Records</h3>
                  </div>

                  {vehicleAssignments.length === 0 ? (
                    <div className="text-gray-400 text-xs py-4 text-center italic">
                      No driver assignment history recorded for this vehicle.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-3">Driver Name</th>
                            <th className="py-2.5 px-3">Start Date</th>
                            <th className="py-2.5 px-3">Start KM</th>
                            <th className="py-2.5 px-3">Return Date</th>
                            <th className="py-2.5 px-3">Monthly Rent</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {vehicleAssignments.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/60">
                              <td className="py-2.5 px-3 font-bold text-[#122038]">{a.driverName}</td>
                              <td className="py-2.5 px-3 font-mono text-gray-600">{a.startDate}</td>
                              <td className="py-2.5 px-3 font-mono">
                                {(a.startMileage || 0).toLocaleString()} km
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-600">
                                {a.endDate || (a.status === 'Active' ? 'Present / Active' : 'Returned')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-600 font-mono">
                                QAR {(a.rent || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    a.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700'
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
              )}

              {/* Tab 2: Handovers & Inspection */}
              {(historyTab === 'all' || historyTab === 'handovers') && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-[#122038]">Physical Inspection & Handover History</h3>
                  </div>

                  {vehicleHandovers.length === 0 ? (
                    <div className="text-gray-400 text-xs py-4 text-center italic">
                      No physical check-in or return inspections logged for this vehicle.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vehicleHandovers.map((h) => (
                        <div
                          key={h.id}
                          className="p-3.5 rounded-xl border border-gray-100 bg-[#fbfcfe] hover:border-gray-200 transition-colors text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  h.type === 'Handover'
                                    ? 'bg-blue-50 text-[#1f73e8]'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {h.type === 'Handover' ? 'Driver Checkout / Handover' : 'Driver Return / Inward'}
                              </span>
                              <span className="font-bold text-gray-900">{h.driverName}</span>
                            </div>
                            <span className="text-[11px] font-mono text-gray-500">{h.date}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-gray-100">
                            <div>
                              <span className="text-gray-400 block text-[10px]">Odometer</span>
                              <span className="font-mono font-bold text-gray-800">
                                {h.mileage.toLocaleString()} km
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">Fuel Level</span>
                              <span className="font-semibold text-gray-800">{h.fuelLevel}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">Cleanliness</span>
                              <span className="font-semibold text-gray-800">{h.cleanliness || 'Good'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">Inspector</span>
                              <span className="font-medium text-gray-800">{h.inspectorName || h.inspector || 'Fleet Officer'}</span>
                            </div>
                          </div>

                          {(h.newDamage || (h.scratches && h.scratches.length > 0)) && (
                            <div className="text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                              <strong>Noted Exterior Damages:</strong> {h.newDamage || h.scratches?.join(', ')}
                            </div>
                          )}

                          {(h.notes || h.penaltyReason) && (
                            <div className="text-[11px] text-gray-600 italic">
                              "{h.notes || h.penaltyReason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Maintenance & Repairs */}
              {(historyTab === 'all' || historyTab === 'maintenance') && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Wrench className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-sm text-[#122038]">Maintenance & Garage Service Tickets</h3>
                  </div>

                  {vehicleMaintenance.length === 0 ? (
                    <div className="text-gray-400 text-xs py-4 text-center italic">
                      No maintenance or repair tickets recorded for this unit.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Service Type</th>
                            <th className="py-2.5 px-3">Garage / Vendor</th>
                            <th className="py-2.5 px-3">Mileage</th>
                            <th className="py-2.5 px-3">Cost (QAR)</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {vehicleMaintenance.map((m) => (
                            <tr key={m.id} className="hover:bg-gray-50/60">
                              <td className="py-2.5 px-3 font-mono text-gray-600">{m.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-gray-900">{m.type}</td>
                              <td className="py-2.5 px-3 text-gray-700">{m.garage}</td>
                              <td className="py-2.5 px-3 font-mono">{m.mileage?.toLocaleString() || '-'} km</td>
                              <td className="py-2.5 px-3 font-bold text-rose-600 font-mono">
                                QAR {(m.cost || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Financial Collections */}
              {(historyTab === 'all' || historyTab === 'financials') && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-[#122038]">Payments & Collected Rent</h3>
                  </div>

                  {vehiclePayments.length === 0 ? (
                    <div className="text-gray-400 text-xs py-4 text-center italic">
                      No direct payment collections logged for this vehicle plate.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Payer / Driver</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3">Reference</th>
                            <th className="py-2.5 px-3 text-right">Amount (QAR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {vehiclePayments.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/60">
                              <td className="py-2.5 px-3 font-mono text-gray-600">{p.date}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{p.driverName}</td>
                              <td className="py-2.5 px-3">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1f73e8]">
                                  {p.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-600">{p.method}</td>
                              <td className="py-2.5 px-3 font-mono text-gray-500">{p.reference || '-'}</td>
                              <td className="py-2.5 px-3 font-bold text-emerald-600 text-right font-mono">
                                QAR {p.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
