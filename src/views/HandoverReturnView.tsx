import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { HandoverRecord } from '../types';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  FileText,
  Printer,
  Eye,
  Trash2,
  Car,
  Fuel,
  Gauge,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { HandoverPrint } from '../components/HandoverPrint';
import { DeleteModal } from '../components/DeleteModal';

export const HandoverReturnView: React.FC = () => {
  const { handovers, vehicles, drivers, assignments, addHandover, deleteHandover } = useDb();

  const [activeModal, setActiveModal] = useState<'Handover' | 'Return' | null>(null);
  const [viewRecord, setViewRecord] = useState<HandoverRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<HandoverRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Handover' | 'Return'>('All');

  // Handover Form state
  const [handoverData, setHandoverData] = useState({
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    mileage: 0,
    fuelLevel: 'Full (100%)',
    condition: 'No scratch or damage noted. Clean interior & exterior.',
    istimaraCard: true,
    spareTyre: true,
    jackTools: true,
    acCooling: true,
    cleanliness: 'Clean & Washed',
    inspectorName: 'Prince Fleet Supervisor',
  });

  // Return Form state
  const [returnData, setReturnData] = useState({
    selectionKey: '', // "veh-{id}" or "asg-{id}"
    vehicleId: '',
    vehiclePlate: '',
    driverId: '',
    driverName: '',
    assignmentId: '',
    date: new Date().toISOString().split('T')[0],
    startMileage: 0,
    mileage: 0,
    fuelLevel: 'Full (100%)',
    penalty: 0,
    penaltyReason: '',
    newDamage: 'Normal wear and tear. No new body damage.',
    istimaraCard: true,
    spareTyre: true,
    jackTools: true,
    acCooling: true,
    cleanliness: 'Clean & Washed',
    inspectorName: 'Prince Fleet Supervisor',
  });

  // Vehicles available for Handover: Available or Inactive/Unassigned
  const availableVehicles = vehicles.filter(
    (v) => v.status === 'Available' || (!v.currentDriverId && v.status !== 'Maintenance' && v.status !== 'Accident')
  );

  // Returnable items: Active assignments OR vehicles currently rented/with a driver
  const returnableItems: {
    key: string;
    label: string;
    vehicleId: string;
    vehiclePlate: string;
    driverId: string;
    driverName: string;
    assignmentId: string;
    currentMileage: number;
  }[] = [];

  // 1. From active assignments
  assignments
    .filter((a) => a.status === 'Active')
    .forEach((a) => {
      const v = vehicles.find((veh) => veh.id === a.vehicleId);
      returnableItems.push({
        key: `asg-${a.id}`,
        label: `${a.vehiclePlate} — Assigned to ${a.driverName} (Start: ${a.startDate})`,
        vehicleId: a.vehicleId,
        vehiclePlate: a.vehiclePlate,
        driverId: a.driverId,
        driverName: a.driverName,
        assignmentId: a.id,
        currentMileage: v?.currentMileage || a.startMileage || 0,
      });
    });

  // 2. Also include any vehicle marked 'On Rent' or with a driver not already in returnableItems
  vehicles
    .filter((v) => v.status === 'On Rent' || (v.currentDriverName && v.currentDriverName.trim().length > 0))
    .forEach((v) => {
      const alreadyIncluded = returnableItems.some((item) => item.vehicleId === v.id);
      if (!alreadyIncluded) {
        returnableItems.push({
          key: `veh-${v.id}`,
          label: `${v.plate} (${v.make} ${v.model}) — Driver: ${v.currentDriverName || 'Assigned Driver'}`,
          vehicleId: v.id,
          vehiclePlate: v.plate,
          driverId: v.currentDriverId || '',
          driverName: v.currentDriverName || 'Driver',
          assignmentId: '',
          currentMileage: v.currentMileage || 0,
        });
      }
    });

  const handleOpenHandover = () => {
    const firstVeh = availableVehicles[0];
    setHandoverData({
      vehicleId: firstVeh?.id || '',
      driverId: '',
      date: new Date().toISOString().split('T')[0],
      mileage: firstVeh?.currentMileage || 0,
      fuelLevel: 'Full (100%)',
      condition: 'Clean interior & exterior. No scratches or body damage noted.',
      istimaraCard: true,
      spareTyre: true,
      jackTools: true,
      acCooling: true,
      cleanliness: 'Clean & Washed',
      inspectorName: 'Prince Fleet Supervisor',
    });
    setActiveModal('Handover');
  };

  const handleOpenReturn = () => {
    const firstItem = returnableItems[0];
    setReturnData({
      selectionKey: firstItem?.key || '',
      vehicleId: firstItem?.vehicleId || '',
      vehiclePlate: firstItem?.vehiclePlate || '',
      driverId: firstItem?.driverId || '',
      driverName: firstItem?.driverName || '',
      assignmentId: firstItem?.assignmentId || '',
      date: new Date().toISOString().split('T')[0],
      startMileage: firstItem?.currentMileage || 0,
      mileage: firstItem?.currentMileage || 0,
      fuelLevel: 'Full (100%)',
      penalty: 0,
      penaltyReason: '',
      newDamage: 'Normal wear and tear. No new damage.',
      istimaraCard: true,
      spareTyre: true,
      jackTools: true,
      acCooling: true,
      cleanliness: 'Clean & Washed',
      inspectorName: 'Prince Fleet Supervisor',
    });
    setActiveModal('Return');
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find((veh) => veh.id === handoverData.vehicleId);
    const d = drivers.find((drv) => drv.id === handoverData.driverId);
    if (!v || !d) return;

    setLoading(true);
    try {
      const handoverPayload: Parameters<typeof addHandover>[0] = {
        type: 'Handover',
        vehicleId: v.id,
        vehiclePlate: v.plate,
        driverId: d.id,
        driverName: d.name,
        date: handoverData.date,
        mileage: Number(handoverData.mileage) || 0,
        fuelLevel: handoverData.fuelLevel,
        condition: handoverData.condition || 'Good',
        istimaraCard: !!handoverData.istimaraCard,
        spareTyre: !!handoverData.spareTyre,
        jackTools: !!handoverData.jackTools,
        acCooling: !!handoverData.acCooling,
        cleanliness: handoverData.cleanliness,
        inspectorName: handoverData.inspectorName || 'Prince Fleet Supervisor',
      };
      await addHandover(handoverPayload);
      setActiveModal(null);
    } catch (err) {
      console.error('Handover error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnData.vehicleId) return;

    setLoading(true);
    try {
      const returnPayload: Parameters<typeof addHandover>[0] = {
        type: 'Return',
        vehicleId: returnData.vehicleId,
        vehiclePlate: returnData.vehiclePlate,
        driverId: returnData.driverId,
        driverName: returnData.driverName,
        date: returnData.date,
        mileage: Number(returnData.mileage) || 0,
        fuelLevel: returnData.fuelLevel,
        penalty: Number(returnData.penalty) || 0,
        penaltyReason: returnData.penaltyReason || '',
        newDamage: returnData.newDamage || '',
        istimaraCard: !!returnData.istimaraCard,
        spareTyre: !!returnData.spareTyre,
        jackTools: !!returnData.jackTools,
        acCooling: !!returnData.acCooling,
        cleanliness: returnData.cleanliness,
        inspectorName: returnData.inspectorName || 'Prince Fleet Supervisor',
      };
      if (returnData.assignmentId && returnData.assignmentId.trim() !== '') {
        returnPayload.assignmentId = returnData.assignmentId.trim();
      }
      await addHandover(returnPayload);
      setActiveModal(null);
    } catch (err) {
      console.error('Return error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deleteHandover(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Delete handover error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredHandovers = handovers.filter((h) => {
    const matchesSearch =
      (h.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.date || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'All' || h.type === filterType;

    return matchesSearch && matchesType;
  });

  // KPI calculations
  const totalHandovers = handovers.filter((h) => h.type === 'Handover').length;
  const totalReturns = handovers.filter((h) => h.type === 'Return').length;
  const rentedVehiclesCount = vehicles.filter((v) => v.status === 'On Rent').length;
  const totalPenalties = handovers.reduce((sum, h) => sum + (h.penalty || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Digital Handover & Return</h1>
          <p className="text-xs text-[#718198]">
            Qatar Ministry of Transport compliant check-in/out, digital inspection & return penalty audits
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-new-handover"
            onClick={handleOpenHandover}
            className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Handover (Check-Out)</span>
          </button>

          <button
            id="btn-new-return"
            onClick={handleOpenReturn}
            className="px-4 py-2 bg-[#c9a15b] hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Return (Check-In)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Total Handovers</span>
          <div className="text-2xl font-bold text-[#1f73e8] mt-1">{totalHandovers}</div>
          <span className="text-[10px] text-gray-500">Vehicles released to drivers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Total Returns</span>
          <div className="text-2xl font-bold text-[#c9a15b] mt-1">{totalReturns}</div>
          <span className="text-[10px] text-gray-500">Completed check-ins</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Active on Rent</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{rentedVehiclesCount}</div>
          <span className="text-[10px] text-gray-500">Vehicles currently deployed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Total Penalties</span>
          <div className="text-2xl font-bold text-[#ef5553] mt-1">
            QAR {totalPenalties.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">Collected from damages/fines</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {(['All', 'Handover', 'Return'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-handover-${tab.toLowerCase()}`}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === tab
                  ? 'bg-[#122038] text-white shadow-xs'
                  : 'text-[#718198] hover:bg-gray-100'
              }`}
            >
              {tab === 'All' ? 'All Protocols' : tab === 'Handover' ? 'Handovers Only' : 'Returns Only'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-handovers-input"
            type="text"
            placeholder="Search by plate, driver, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Driver</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Odometer</th>
                <th className="py-3 px-4 font-semibold">Fuel</th>
                <th className="py-3 px-4 font-semibold">Inspection Summary</th>
                <th className="py-3 px-4 font-semibold text-right">Penalty</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ArrowLeftRight className="w-8 h-8 text-gray-300" />
                      <span>No handover or return records found.</span>
                      <span className="text-[11px] text-gray-400">
                        Click "New Handover" to check-out a vehicle or "New Return" to complete check-in.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHandovers.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          h.type === 'Handover'
                            ? 'bg-blue-50 text-[#1f73e8] border border-blue-200'
                            : 'bg-amber-50 text-[#c9a15b] border border-amber-200'
                        }`}
                      >
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#122038] bg-gray-50 px-2 py-0.5 rounded">
                        {h.vehiclePlate}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{h.driverName}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono">{h.date}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {(Number(h.mileage) || 0).toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 text-gray-600">{h.fuelLevel}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {h.type === 'Handover' ? h.condition : h.newDamage || 'Normal condition'}
                    </td>
                    <td className="py-3 px-4 font-bold text-right text-[#ef5553]">
                      {(Number(h.penalty) || 0) > 0 ? `QAR ${(Number(h.penalty) || 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        id={`btn-print-handover-${h.id}`}
                        onClick={() => setPrintRecord(h)}
                        title="Print Official A4 Protocol"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Printer className="w-4 h-4 inline" />
                      </button>
                      <button
                        id={`btn-view-handover-${h.id}`}
                        onClick={() => setViewRecord(h)}
                        title="View Protocol Details"
                        className="p-1.5 text-gray-500 hover:text-[#122038] hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        id={`btn-delete-handover-${h.id}`}
                        onClick={() => setDeleteTargetId(h.id)}
                        title="Delete Record"
                        className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Handover Modal */}
      {activeModal === 'Handover' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">New Vehicle Handover (Check-Out)</h3>
                <p className="text-xs text-gray-500">Record vehicle release and inspect technical condition</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Available Vehicle *</label>
                <select
                  required
                  value={handoverData.vehicleId}
                  onChange={(e) => {
                    const v = vehicles.find((veh) => veh.id === e.target.value);
                    setHandoverData({
                      ...handoverData,
                      vehicleId: e.target.value,
                      mileage: v?.currentMileage || 0,
                    });
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      Plate: {v.plate} — {v.make} {v.model} ({v.year}, {v.color}) — Current: {v.currentMileage} km
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-amber-600 text-[11px] mt-1">
                    Notice: All vehicles currently have drivers or are in maintenance. You can update a vehicle status to Available in the Vehicles menu.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Assigned Driver *</label>
                <select
                  required
                  value={handoverData.driverId}
                  onChange={(e) => setHandoverData({ ...handoverData, driverId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (QID: {d.qid}) • Mobile: {d.mobile} • {d.driverType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Handover Date *</label>
                  <input
                    type="date"
                    required
                    value={handoverData.date}
                    onChange={(e) => setHandoverData({ ...handoverData, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={handoverData.inspectorName}
                    onChange={(e) => setHandoverData({ ...handoverData, inspectorName: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Starting Mileage (km) *</label>
                  <input
                    type="number"
                    required
                    value={handoverData.mileage}
                    onChange={(e) =>
                      setHandoverData({
                        ...handoverData,
                        mileage: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fuel Level *</label>
                  <select
                    value={handoverData.fuelLevel}
                    onChange={(e) => setHandoverData({ ...handoverData, fuelLevel: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Full (100%)">Full (100%)</option>
                    <option value="3/4 (75%)">3/4 (75%)</option>
                    <option value="1/2 (50%)">1/2 (50%)</option>
                    <option value="1/4 (25%)">1/4 (25%)</option>
                  </select>
                </div>
              </div>

              {/* Inspection Checklist */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-700 block">Inspection & Accessories Verification</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverData.istimaraCard}
                      onChange={(e) => setHandoverData({ ...handoverData, istimaraCard: e.target.checked })}
                      className="rounded text-[#1f73e8]"
                    />
                    <span>Original Istimara Present</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverData.spareTyre}
                      onChange={(e) => setHandoverData({ ...handoverData, spareTyre: e.target.checked })}
                      className="rounded text-[#1f73e8]"
                    />
                    <span>Spare Tyre & Jack Present</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverData.acCooling}
                      onChange={(e) => setHandoverData({ ...handoverData, acCooling: e.target.checked })}
                      className="rounded text-[#1f73e8]"
                    />
                    <span>AC Cooling Verified</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverData.jackTools}
                      onChange={(e) => setHandoverData({ ...handoverData, jackTools: e.target.checked })}
                      className="rounded text-[#1f73e8]"
                    />
                    <span>Taxi Meter / GPS Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Exterior & Interior Condition Notes
                </label>
                <textarea
                  rows={2}
                  value={handoverData.condition}
                  onChange={(e) => setHandoverData({ ...handoverData, condition: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Complete & Generate Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Return Modal */}
      {activeModal === 'Return' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">New Vehicle Return (Check-In)</h3>
                <p className="text-xs text-gray-500">Record vehicle check-in, audit final mileage, and assess penalties</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Vehicle to Return *
                </label>
                <select
                  required
                  value={returnData.selectionKey}
                  onChange={(e) => {
                    const chosen = returnableItems.find((item) => item.key === e.target.value);
                    if (chosen) {
                      setReturnData({
                        ...returnData,
                        selectionKey: chosen.key,
                        vehicleId: chosen.vehicleId,
                        vehiclePlate: chosen.vehiclePlate,
                        driverId: chosen.driverId,
                        driverName: chosen.driverName,
                        assignmentId: chosen.assignmentId,
                        startMileage: chosen.currentMileage,
                        mileage: chosen.currentMileage,
                      });
                    }
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a15b]"
                >
                  <option value="">-- Choose Rented Vehicle / Active Assignment --</option>
                  {returnableItems.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>

                {returnableItems.length === 0 && (
                  <p className="text-amber-600 text-[11px] mt-1">
                    Notice: There are currently no vehicles on rent or active assignments to return.
                  </p>
                )}
              </div>

              {returnData.vehiclePlate && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-700">Vehicle:</span> {returnData.vehiclePlate} •{' '}
                    <span className="font-bold text-gray-700">Driver:</span> {returnData.driverName}
                  </div>
                  <div className="font-mono text-gray-600">
                    Odometer at Handover: {returnData.startMileage} km
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Return Date *</label>
                  <input
                    type="date"
                    required
                    value={returnData.date}
                    onChange={(e) => setReturnData({ ...returnData, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ending Mileage (km) *</label>
                  <input
                    type="number"
                    required
                    value={returnData.mileage}
                    onChange={(e) =>
                      setReturnData({ ...returnData, mileage: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                  />
                  {returnData.mileage < returnData.startMileage && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      Warning: Ending mileage is lower than starting mileage.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fuel Level on Return *</label>
                  <select
                    value={returnData.fuelLevel}
                    onChange={(e) => setReturnData({ ...returnData, fuelLevel: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Full (100%)">Full (100%)</option>
                    <option value="3/4 (75%)">3/4 (75%)</option>
                    <option value="1/2 (50%)">1/2 (50%)</option>
                    <option value="1/4 (25%)">1/4 (25%)</option>
                    <option value="Empty (<10%)">Empty (&lt;10%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Penalty Amount (QAR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={returnData.penalty}
                    onChange={(e) =>
                      setReturnData({ ...returnData, penalty: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              {Number(returnData.penalty) > 0 && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reason for Penalty</label>
                  <input
                    type="text"
                    placeholder="e.g. Missing fuel charge, front bumper scratch, late return fee"
                    value={returnData.penaltyReason}
                    onChange={(e) => setReturnData({ ...returnData, penaltyReason: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              )}

              {/* Inspection Checklist */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-700 block">Check-In Return Checklist</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnData.istimaraCard}
                      onChange={(e) => setReturnData({ ...returnData, istimaraCard: e.target.checked })}
                      className="rounded text-[#c9a15b]"
                    />
                    <span>Istimara Card Returned</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnData.spareTyre}
                      onChange={(e) => setReturnData({ ...returnData, spareTyre: e.target.checked })}
                      className="rounded text-[#c9a15b]"
                    />
                    <span>Spare Tyre & Jack Present</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnData.acCooling}
                      onChange={(e) => setReturnData({ ...returnData, acCooling: e.target.checked })}
                      className="rounded text-[#c9a15b]"
                    />
                    <span>AC & Engine Sound Good</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnData.jackTools}
                      onChange={(e) => setReturnData({ ...returnData, jackTools: e.target.checked })}
                      className="rounded text-[#c9a15b]"
                    />
                    <span>All Keys Returned</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Defects, Missing Items or Damage Notes
                </label>
                <textarea
                  rows={2}
                  value={returnData.newDamage}
                  onChange={(e) => setReturnData({ ...returnData, newDamage: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#c9a15b] hover:bg-amber-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Complete Vehicle Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">
                  Protocol Details: {viewRecord.vehiclePlate} ({viewRecord.type})
                </h3>
                <span className="text-xs text-gray-500">Date: {viewRecord.date}</span>
              </div>
              <button
                onClick={() => setViewRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-[#718198] block">Vehicle Plate</span>
                  <span className="font-mono font-bold text-[#1f73e8] text-sm">
                    {viewRecord.vehiclePlate}
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Driver</span>
                  <span className="font-bold text-[#122038] text-sm">{viewRecord.driverName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-[#718198] block">Recorded Mileage</span>
                  <span className="font-mono font-bold text-gray-900">
                    {(Number(viewRecord.mileage) || 0).toLocaleString()} km
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Fuel Level</span>
                  <span className="font-bold text-emerald-600">{viewRecord.fuelLevel}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[#718198] block mb-1">Inspection Checklist Verification</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        viewRecord.istimaraCard !== false ? 'text-emerald-600' : 'text-gray-300'
                      }`}
                    />
                    <span>Istimara Card: {viewRecord.istimaraCard !== false ? 'Verified' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        viewRecord.spareTyre !== false ? 'text-emerald-600' : 'text-gray-300'
                      }`}
                    />
                    <span>Spare Tyre: {viewRecord.spareTyre !== false ? 'Present' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        viewRecord.acCooling !== false ? 'text-emerald-600' : 'text-gray-300'
                      }`}
                    />
                    <span>AC Cooling: {viewRecord.acCooling !== false ? 'Normal' : 'Defect'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        viewRecord.jackTools !== false ? 'text-emerald-600' : 'text-gray-300'
                      }`}
                    />
                    <span>Tools/Meter: {viewRecord.jackTools !== false ? 'Verified' : 'Missing'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[#718198] block mb-1">Condition & Inspection Notes</span>
                <p className="text-gray-700 italic">
                  {viewRecord.type === 'Handover'
                    ? viewRecord.condition || 'Clean condition noted.'
                    : viewRecord.newDamage || 'Normal condition noted.'}
                </p>
              </div>

              {(Number(viewRecord.penalty) || 0) > 0 && (
                <div className="p-3 bg-red-50 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-red-900 font-bold block">Assessed Penalty</span>
                    <span className="text-[11px] text-red-700">{viewRecord.penaltyReason || 'Damage/fuel'}</span>
                  </div>
                  <span className="font-mono font-bold text-red-600 text-sm">
                    QAR {(Number(viewRecord.penalty) || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    const r = viewRecord;
                    setViewRecord(null);
                    setPrintRecord(r);
                  }}
                  className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Open Printable A4 Protocol</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Protocol Modal */}
      {printRecord && (
        <HandoverPrint handover={printRecord} onClose={() => setPrintRecord(null)} />
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Handover/Return Record"
        message="Are you sure you want to delete this inspection record from the audit log?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
