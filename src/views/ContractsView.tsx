import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Contract, ContractStatus } from '../types';
import {
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  X,
  FileText,
  CheckCircle2,
  Edit2,
  Calendar,
  AlertCircle,
  FileCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import { ApprovedContractPrint } from '../components/ApprovedContractPrint';
import { DeleteModal } from '../components/DeleteModal';

export const ContractsView: React.FC = () => {
  const { contracts, vehicles, drivers, addContract, updateContract, deleteContract } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ContractStatus>('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [printContract, setPrintContract] = useState<Contract | null>(null);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New Contract Form
  const [formData, setFormData] = useState({
    contractNo: `QL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    driverId: '',
    vehicleId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '1 Month (Renewable)',
    monthlyAmount: 2200,
    securityDeposit: 1000,
    status: 'Active' as ContractStatus,
  });

  // Edit Contract Form
  const [editFormData, setEditFormData] = useState({
    monthlyAmount: 2200,
    securityDeposit: 1000,
    startDate: '',
    endDate: '',
    status: 'Active' as ContractStatus,
    releaseVehicleOnTermination: false,
  });

  // Available vehicles for contracts (either available or already assigned)
  const availableVehicles = vehicles.filter(
    (v) => v.status === 'Available' || v.status === 'Assigned' || v.status === 'On Rent'
  );

  const handleOpenAdd = () => {
    const firstVeh = vehicles.find((v) => v.status === 'Available') || vehicles[0];
    const firstDriver = drivers[0];

    setFormData({
      contractNo: `QL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      driverId: firstDriver?.id || '',
      vehicleId: firstVeh?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '1 Month (Renewable)',
      monthlyAmount: 2200,
      securityDeposit: 1000,
      status: 'Active',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (contract: Contract) => {
    setEditContract(contract);
    setEditFormData({
      monthlyAmount: contract.monthlyAmount || 2200,
      securityDeposit: contract.securityDeposit || 0,
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      status: contract.status || 'Active',
      releaseVehicleOnTermination: contract.status !== 'Terminated' && contract.status !== 'Completed',
    });
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId) return;

    const d = drivers.find((drv) => drv.id === formData.driverId);
    const v = vehicles.find((veh) => veh.id === formData.vehicleId);
    if (!d || !v) return;

    setLoading(true);
    try {
      await addContract({
        contractNo: formData.contractNo,
        driverId: d.id,
        driverName: d.name,
        driverQid: d.qid,
        driverMobile: d.mobile,
        vehicleId: v.id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        vehicleYear: v.year,
        vehicleColor: v.color,
        currentMileage: v.currentMileage,
        startDate: formData.startDate,
        endDate: formData.endDate || '1 Month (Renewable)',
        monthlyAmount: Number(formData.monthlyAmount) || 0,
        securityDeposit: Number(formData.securityDeposit) || 0,
        status: formData.status,
      });
      setIsAddOpen(false);
    } catch (err) {
      console.error('Error adding contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContract) return;

    setLoading(true);
    try {
      await updateContract(editContract.id, {
        monthlyAmount: Number(editFormData.monthlyAmount) || 0,
        securityDeposit: Number(editFormData.securityDeposit) || 0,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        status: editFormData.status,
      });
      setEditContract(null);
    } catch (err) {
      console.error('Error updating contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deleteContract(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Error deleting contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      (c.contractNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.driverQid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const activeContracts = contracts.filter((c) => c.status === 'Active');
  const totalMonthlyRevenue = activeContracts.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);
  const totalSecurityDeposits = activeContracts.reduce((sum, c) => sum + (c.securityDeposit || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Monthly Rental Contracts</h1>
          <p className="text-xs text-[#718198]">
            Official Qatar bilateral rental agreements, electronic signatures, and legal contracts
          </p>
        </div>

        <button
          id="btn-new-contract"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract Agreement</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Total Agreements</span>
          <div className="text-2xl font-bold text-[#122038] mt-1">{contracts.length}</div>
          <span className="text-[10px] text-gray-500">Contracts registered</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Active Agreements</span>
          <div className="text-2xl font-bold text-[#20b56f] mt-1">{activeContracts.length}</div>
          <span className="text-[10px] text-gray-500">Currently generating revenue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Monthly Revenue</span>
          <div className="text-2xl font-bold text-[#1f73e8] mt-1">
            QAR {totalMonthlyRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">Contracted monthly rent</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718198] uppercase">Security Deposits</span>
          <div className="text-2xl font-bold text-[#c9a15b] mt-1">
            QAR {totalSecurityDeposits.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">Held in security escrow</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {(['All', 'Active', 'Pending', 'Completed', 'Terminated'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-contract-${tab.toLowerCase()}`}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#122038] text-white shadow-xs'
                  : 'text-[#718198] hover:bg-gray-100'
              }`}
            >
              {tab === 'All' ? 'All Contracts' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-contracts-input"
            type="text"
            placeholder="Search by contract #, driver, plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Contract #</th>
                <th className="py-3 px-4 font-semibold">Driver Details</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Period / Dates</th>
                <th className="py-3 px-4 font-semibold">Monthly Rent</th>
                <th className="py-3 px-4 font-semibold">Deposit</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      <span>No rental contracts found matching your filters.</span>
                      <span className="text-[11px] text-gray-400">
                        Click "New Contract Agreement" above to issue a Qatar approved agreement.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1f73e8]">
                      {c.contractNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#122038]">{c.driverName}</div>
                      <div className="text-[11px] text-[#718198]">QID: {c.driverQid || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#122038] font-mono">{c.vehiclePlate}</div>
                      <div className="text-[11px] text-[#718198]">
                        {c.vehicleMake} {c.vehicleModel} ({c.vehicleYear || '-'})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-700 font-mono text-[11px]">{c.startDate}</div>
                      <div className="text-gray-500 text-[10px]">{c.endDate || 'Renewable'}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#20b56f]">
                      QAR {(Number(c.monthlyAmount) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      QAR {(Number(c.securityDeposit) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Active'
                            ? 'bg-emerald-50 text-[#20b56f] border border-emerald-200'
                            : c.status === 'Pending'
                            ? 'bg-amber-50 text-[#c9a15b] border border-amber-200'
                            : c.status === 'Terminated'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        id={`print-cnt-${c.id}`}
                        onClick={() => setPrintContract(c)}
                        title="Print Official Approved Agreement (A4)"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Printer className="w-4 h-4 inline" />
                      </button>
                      <button
                        id={`view-cnt-${c.id}`}
                        onClick={() => setViewContract(c)}
                        title="View Details"
                        className="p-1.5 text-gray-500 hover:text-[#122038] hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        id={`edit-cnt-${c.id}`}
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Contract Terms & Status"
                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        id={`delete-cnt-${c.id}`}
                        onClick={() => setDeleteTargetId(c.id)}
                        title="Delete Contract"
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

      {/* New Contract Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">
                  New Monthly Rental Agreement
                </h3>
                <p className="text-xs text-gray-500">Official bilingual agreement with legal binding terms</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contract Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.contractNo}
                    onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ContractStatus })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Driver *</label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
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

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1f73e8]"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      Plate: {v.plate} — {v.make} {v.model} ({v.year}, {v.color}) — {v.currentMileage} km [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contract Duration / Term</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Month (Renewable)"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly Rent (QAR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Security Deposit (QAR)</label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) =>
                      setFormData({ ...formData, securityDeposit: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-gray-600">
                Notice: Issuing this contract will update vehicle status to "On Rent", link the driver in the fleet registry, and generate the official bilingual agreement ready for printing.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create & Issue Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {editContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">
                  Edit Contract: {editContract.contractNo}
                </h3>
                <p className="text-xs text-gray-500">
                  {editContract.driverName} • {editContract.vehiclePlate}
                </p>
              </div>
              <button
                onClick={() => setEditContract(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contract Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as ContractStatus })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly Rent (QAR)</label>
                  <input
                    type="number"
                    value={editFormData.monthlyAmount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, monthlyAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration / End Term</label>
                  <input
                    type="text"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Security Deposit (QAR)</label>
                <input
                  type="number"
                  value={editFormData.securityDeposit}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, securityDeposit: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditContract(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Contract Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#122038]">
                  Contract Details: {viewContract.contractNo}
                </h3>
                <span className="text-xs text-gray-500">Status: {viewContract.status}</span>
              </div>
              <button
                onClick={() => setViewContract(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-[#718198] block">Driver</span>
                  <span className="font-bold text-[#122038] text-sm">{viewContract.driverName}</span>
                  <div className="text-[11px] text-gray-500">QID: {viewContract.driverQid || '-'}</div>
                  <div className="text-[11px] text-gray-500">Mobile: {viewContract.driverMobile || '-'}</div>
                </div>
                <div>
                  <span className="text-[#718198] block">Vehicle</span>
                  <span className="font-bold text-[#1f73e8] font-mono text-sm">{viewContract.vehiclePlate}</span>
                  <div className="text-[11px] text-gray-500">
                    {viewContract.vehicleMake} {viewContract.vehicleModel} ({viewContract.vehicleYear || '-'})
                  </div>
                  <div className="text-[11px] text-gray-500">Color: {viewContract.vehicleColor || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-[#718198] block">Monthly Rent</span>
                  <span className="font-extrabold text-[#20b56f] text-base font-mono">
                    QAR {(Number(viewContract.monthlyAmount) || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Security Deposit</span>
                  <span className="font-bold text-[#122038] text-sm font-mono">
                    QAR {(Number(viewContract.securityDeposit) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#718198] block">Start Date</span>
                  <span className="font-mono text-gray-800">{viewContract.startDate}</span>
                </div>
                <div>
                  <span className="text-[#718198] block">Contract Term</span>
                  <span className="text-gray-800">{viewContract.endDate || 'Renewable'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    const c = viewContract;
                    setViewContract(null);
                    handleOpenEdit(c);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Terms</span>
                </button>

                <button
                  onClick={() => {
                    const c = viewContract;
                    setViewContract(null);
                    setPrintContract(c);
                  }}
                  className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Open Printable A4 Agreement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Approved Contract Print Modal */}
      {printContract && (
        <ApprovedContractPrint
          contract={printContract}
          onClose={() => setPrintContract(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Rental Contract"
        message="Are you sure you want to permanently delete this rental contract from the registry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
