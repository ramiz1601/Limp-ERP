import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { MaintenanceRecord } from '../types';
import { Plus, Search, Trash2, Wrench, X, CheckCircle } from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';

export const MaintenanceView: React.FC = () => {
  const { maintenance, vehicles, addMaintenance, deleteMaintenance } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Routine Service / Oil Change',
    garage: 'Prince Fleet Garage / Woqod',
    cost: 350,
    mileage: 0,
    description: '',
    status: 'Completed',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) return;

    const v = vehicles.find((veh) => veh.id === formData.vehicleId);
    if (!v) return;

    setLoading(true);
    try {
      await addMaintenance({
        vehicleId: v.id,
        vehiclePlate: v.plate,
        date: formData.date,
        type: formData.type,
        garage: formData.garage,
        cost: formData.cost,
        mileage: formData.mileage || v.currentMileage,
        description: formData.description,
        status: formData.status,
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
      await deleteMaintenance(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = maintenance.filter(
    (m) =>
      m.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.garage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Fleet Maintenance & Repairs</h1>
          <p className="text-xs text-[#718198]">
            Workshop service tickets, routine maintenance logs, and vehicle servicing costs
          </p>
        </div>

        <button
          id="btn-add-maintenance"
          onClick={() => {
            setFormData({
              vehicleId: '',
              date: new Date().toISOString().split('T')[0],
              type: 'Routine Service / Oil Change',
              garage: 'Prince Fleet Garage / Woqod',
              cost: 350,
              mileage: 0,
              description: '',
              status: 'Completed',
            });
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-[#f1a32a] hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Maintenance Ticket</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search maintenance by plate, type, garage..."
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
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Service Type</th>
                <th className="py-3 px-4 font-semibold">Garage / Workshop</th>
                <th className="py-3 px-4 font-semibold">Odometer</th>
                <th className="py-3 px-4 font-semibold text-right">Cost (QAR)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No maintenance logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 text-gray-600">{m.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                      {m.vehiclePlate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#122038]">{m.type}</td>
                    <td className="py-3 px-4 text-gray-600">{m.garage}</td>
                    <td className="py-3 px-4 font-mono">
                      {m.mileage ? `${m.mileage.toLocaleString()} km` : '-'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#ef5553] text-right font-mono">
                      QAR {m.cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'Completed'
                            ? 'bg-emerald-50 text-[#20b56f]'
                            : 'bg-amber-50 text-[#f1a32a]'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTargetId(m.id)}
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
              <h3 className="text-base font-bold text-[#122038]">New Maintenance Ticket</h3>
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
                  onChange={(e) => {
                    const v = vehicles.find((veh) => veh.id === e.target.value);
                    setFormData({
                      ...formData,
                      vehicleId: e.target.value,
                      mileage: v?.currentMileage || 0,
                    });
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.make} {v.model}) - Current: {v.currentMileage} km
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Service Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10,000 KM Periodic Maintenance / Brake Pads"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cost (QAR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) =>
                      setFormData({ ...formData, mileage: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Garage / Workshop Name</label>
                <input
                  type="text"
                  value={formData.garage}
                  onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Details / Parts Replaced</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Engine oil synthetic 5W-30, oil filter, air cleaner"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
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
                  className="px-5 py-2 bg-[#f1a32a] hover:bg-amber-600 text-white rounded-lg font-bold shadow-xs"
                >
                  {loading ? 'Saving...' : 'Save Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Maintenance Record"
        message="Are you sure you want to delete this maintenance ticket?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
