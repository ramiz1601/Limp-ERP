import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Gauge, Search, Edit3, X, Check } from 'lucide-react';

export const MileageView: React.FC = () => {
  const { vehicles, assignments, updateVehicle } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehId, setEditingVehId] = useState<string | null>(null);
  const [newMileage, setNewMileage] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const startEdit = (vehId: string, current: number) => {
    setEditingVehId(vehId);
    setNewMileage(current);
  };

  const handleSave = async (vehId: string) => {
    setLoading(true);
    try {
      await updateVehicle(vehId, { currentMileage: newMileage });
      setEditingVehId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.currentDriverName && (v.currentDriverName || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Mileage Register</h1>
          <p className="text-xs text-[#718198]">
            Fleet odometer readings and KM since assignment tracking
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vehicle or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Mileage Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Current KM</th>
                <th className="py-3 px-4 font-semibold">Starting KM</th>
                <th className="py-3 px-4 font-semibold">KM Since Assignment</th>
                <th className="py-3 px-4 font-semibold">Driver</th>
                <th className="py-3 px-4 font-semibold text-right">Update Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => {
                  const activeAsg = assignments.find(
                    (a) => a.vehicleId === veh.id && a.status === 'Active'
                  );
                  const startingKm = activeAsg ? activeAsg.startMileage : veh.currentMileage;
                  const kmSinceAssignment = Math.max(0, veh.currentMileage - startingKm);

                  const isEditing = editingVehId === veh.id;

                  return (
                    <tr key={veh.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122038]">
                          {veh.make} {veh.model}
                        </div>
                        <div className="text-[11px] font-mono text-[#1f73e8]">{veh.plate}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#122038]">
                        {isEditing ? (
                          <input
                            type="number"
                            value={newMileage}
                            onChange={(e) => setNewMileage(Number(e.target.value) || 0)}
                            className="w-28 p-1 border border-blue-400 rounded focus:outline-none"
                          />
                        ) : (
                          `${veh.currentMileage.toLocaleString()} km`
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {startingKm.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                        {kmSinceAssignment.toLocaleString()} km
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {veh.currentDriverName || <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              disabled={loading}
                              onClick={() => handleSave(veh.id)}
                              className="p-1 bg-[#20b56f] text-white rounded hover:bg-emerald-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVehId(null)}
                              className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(veh.id, veh.currentMileage)}
                            className="px-2.5 py-1 text-[11px] bg-blue-50 text-[#1f73e8] hover:bg-blue-100 rounded font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Update
                          </button>
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
  );
};
