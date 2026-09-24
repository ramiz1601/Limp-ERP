import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Assignment } from '../types';
import { Plus, Search, Trash2, KeyRound, X } from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';

export const AssignmentsView: React.FC = () => {
  const { assignments, vehicles, drivers, addAssignment, deleteAssignment } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    type: 'Standard Rental',
    startDate: new Date().toISOString().split('T')[0],
    startMileage: 0,
    rent: 0,
  });

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');

  const handleVehicleSelect = (vId: string) => {
    const v = vehicles.find((veh) => veh.id === vId);
    setFormData({
      ...formData,
      vehicleId: vId,
      startMileage: v?.currentMileage || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.driverId) return;

    const v = vehicles.find((veh) => veh.id === formData.vehicleId);
    const d = drivers.find((drv) => drv.id === formData.driverId);
    if (!v || !d) return;

    setLoading(true);
    try {
      await addAssignment({
        vehicleId: v.id,
        vehiclePlate: v.plate,
        driverId: d.id,
        driverName: d.name,
        type: formData.type,
        startDate: formData.startDate,
        startMileage: formData.startMileage,
        rent: formData.rent,
        status: 'Active',
      });
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deleteAssignment(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignments.filter(
    (a) =>
      (a.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Vehicle Assignments</h1>
          <p className="text-xs text-[#718198]">Track active and historical driver assignments</p>
        </div>

        <button
          id="btn-new-assignment"
          onClick={() => {
            setFormData({
              vehicleId: '',
              driverId: '',
              type: 'Standard Rental',
              startDate: new Date().toISOString().split('T')[0],
              startMileage: 0,
              rent: 0,
            });
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Driver</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Start</th>
                <th className="py-3 px-4 font-semibold">Start KM</th>
                <th className="py-3 px-4 font-semibold">Rent</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No vehicle assignments found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                      {a.vehiclePlate}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#122038]">{a.driverName}</td>
                    <td className="py-3 px-4 text-[#718198]">{a.type}</td>
                    <td className="py-3 px-4 text-gray-600">{a.startDate}</td>
                    <td className="py-3 px-4 font-mono">{a.startMileage.toLocaleString()} km</td>
                    <td className="py-3 px-4 font-bold text-[#20b56f]">
                      QAR {a.rent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === 'Active'
                            ? 'bg-emerald-50 text-[#20b56f]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTargetId(a.id)}
                        className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded"
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

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">New Vehicle Assignment</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Choose Available Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.make} {v.model}) - {v.currentMileage} km
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
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (QID: {d.qid}) - {d.driverType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assignment Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start KM *</label>
                  <input
                    type="number"
                    required
                    value={formData.startMileage}
                    onChange={(e) =>
                      setFormData({ ...formData, startMileage: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Rent Amount (QAR)</label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) =>
                      setFormData({ ...formData, rent: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs"
                >
                  {loading ? 'Assigning...' : 'Assign Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
