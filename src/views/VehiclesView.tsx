import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Vehicle, VehicleOwnership, VehiclePlateType, VehicleStatus } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Car,
  Calendar,
  DollarSign,
  Wrench,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { WhatsAppTemplates } from '../utils/whatsapp';
import { DocumentUploadCard } from '../components/DocumentUploadCard';
import { UploadedFilePayload } from '../utils/fileUpload';

export const VehiclesView: React.FC = () => {
  const {
    vehicles,
    drivers,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignments,
    financing,
    maintenance,
    income,
    expenses,
  } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('All');

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formTab, setFormTab] = useState<'specs' | 'rental' | 'documents'>('specs');

  // Form State
  const [formData, setFormData] = useState({
    plate: '',
    plateType: 'Limo' as VehiclePlateType,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    currentMileage: 0,
    fuelType: 'Petrol',
    ownership: 'Company Owned' as VehicleOwnership,
    status: 'Available' as VehicleStatus,
    purchasePrice: 0,
    istimaraExpiry: '',
    insuranceExpiry: '',
    insuranceCompany: 'Qatar Insurance Company (QIC)',
    insurancePolicyNumber: '',
    dailyRent: 120,
    monthlyRent: 2200,
    currentDriverId: '',
    currentDriverName: '',
    istimaraFileUrl: '',
    insuranceFileUrl: '',
  });

  // Attached files for Istimara and Insurance
  const [istimaraFile, setIstimaraFile] = useState<UploadedFilePayload | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<UploadedFilePayload | null>(null);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormTab('specs');
    setFormData({
      plate: '',
      plateType: 'Limo',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      vin: '',
      currentMileage: 0,
      fuelType: 'Petrol',
      ownership: 'Company Owned',
      status: 'Available',
      purchasePrice: 0,
      istimaraExpiry: '',
      insuranceExpiry: '',
      insuranceCompany: 'Qatar Insurance Company (QIC)',
      insurancePolicyNumber: '',
      dailyRent: 120,
      monthlyRent: 2200,
      currentDriverId: '',
      currentDriverName: '',
      istimaraFileUrl: '',
      insuranceFileUrl: '',
    });
    setIstimaraFile(null);
    setInsuranceFile(null);
    setIsAddEditOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setFormTab('specs');
    setFormData({
      plate: veh.plate,
      plateType: veh.plateType,
      make: veh.make,
      model: veh.model,
      year: veh.year,
      color: veh.color,
      vin: veh.vin,
      currentMileage: veh.currentMileage,
      fuelType: veh.fuelType,
      ownership: veh.ownership,
      status: veh.status,
      purchasePrice: veh.purchasePrice || 0,
      istimaraExpiry: veh.istimaraExpiry || '',
      insuranceExpiry: veh.insuranceExpiry || '',
      insuranceCompany: veh.insuranceCompany || 'Qatar Insurance Company (QIC)',
      insurancePolicyNumber: veh.insurancePolicyNumber || '',
      dailyRent: veh.dailyRent || 120,
      monthlyRent: veh.monthlyRent || 2200,
      currentDriverId: veh.currentDriverId || '',
      currentDriverName: veh.currentDriverName || '',
      istimaraFileUrl: veh.istimaraFileUrl || '',
      insuranceFileUrl: veh.insuranceFileUrl || '',
    });

    setIstimaraFile(
      veh.istimaraFileUrl
        ? {
            fileName: `${veh.plate}-Istimara.png`,
            fileType: 'image/png',
            fileSize: 250000,
            fileUrl: veh.istimaraFileUrl,
          }
        : null
    );

    setInsuranceFile(
      veh.insuranceFileUrl
        ? {
            fileName: `${veh.plate}-Insurance.png`,
            fileType: 'image/png',
            fileSize: 280000,
            fileUrl: veh.insuranceFileUrl,
          }
        : null
    );

    setIsAddEditOpen(true);
  };

  const handleDriverChange = (driverId: string) => {
    if (!driverId) {
      setFormData((prev) => ({
        ...prev,
        currentDriverId: '',
        currentDriverName: '',
      }));
      return;
    }
    const drv = drivers.find((d) => d.id === driverId);
    setFormData((prev) => ({
      ...prev,
      currentDriverId: driverId,
      currentDriverName: drv ? drv.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.make || !formData.model) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        istimaraFileUrl: istimaraFile ? istimaraFile.fileUrl : formData.istimaraFileUrl,
        insuranceFileUrl: insuranceFile ? insuranceFile.fileUrl : formData.insuranceFileUrl,
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, payload);
      } else {
        await addVehicle(payload);
      }
      setIsAddEditOpen(false);
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
      await deleteVehicle(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for expiry countdown and color styling
  const getExpiryBadge = (dateStr?: string) => {
    if (!dateStr) return <span className="text-gray-400 font-mono text-[10px]">Not set</span>;
    const expDate = new Date(dateStr);
    if (isNaN(expDate.getTime())) return <span className="text-gray-400 font-mono text-[10px]">{dateStr}</span>;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> Expired ({dateStr})
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> {diffDays}d left ({dateStr})
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {dateStr}
      </span>
    );
  };

  // Filtering
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesOwnership = ownershipFilter === 'All' || v.ownership === ownershipFilter;
    return matchesSearch && matchesStatus && matchesOwnership;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Vehicles Register</h1>
          <p className="text-xs text-[#718198]">Manage Qatar limousine and company fleet units</p>
        </div>

        <button
          id="btn-add-vehicle"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by plate, make, model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-[#122038] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Rent">On Rent</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Accident">Accident</option>
            <option value="Inactive">Inactive</option>
            <option value="Sold">Sold</option>
            <option value="Reserved">Reserved</option>
          </select>

          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-[#122038] focus:outline-none"
          >
            <option value="All">All Ownership</option>
            <option value="Company Owned">Company Owned</option>
            <option value="Driver Financed">Driver Financed</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Plate #</th>
                <th className="py-3 px-4 font-semibold">Assigned Driver</th>
                <th className="py-3 px-4 font-semibold">Istimara Expiry</th>
                <th className="py-3 px-4 font-semibold">Rental Rates</th>
                <th className="py-3 px-4 font-semibold">Mileage</th>
                <th className="py-3 px-4 font-semibold">Ownership</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No vehicles registered. Click "Add Vehicle" to register the first unit.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => {
                  const assignedDriver = veh.currentDriverId
                    ? drivers.find((d) => d.id === veh.currentDriverId)
                    : veh.currentDriverName
                    ? drivers.find((d) => d.name === veh.currentDriverName)
                    : null;

                  return (
                    <tr key={veh.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122038]">
                          {veh.make} {veh.model}
                        </div>
                        <div className="text-[11px] text-[#718198]">
                          {veh.year} • {veh.color} • {veh.plateType}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#1f73e8] bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded text-[11px]">
                          {veh.plate}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {assignedDriver ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#122038]">
                              {assignedDriver.name}
                            </span>
                            {assignedDriver.mobile && (
                              <WhatsAppButton
                                phone={assignedDriver.mobile}
                                message={WhatsAppTemplates.generalContact(assignedDriver.name)}
                                size="sm"
                                variant="icon"
                                label=""
                              />
                            )}
                          </div>
                        ) : veh.currentDriverName ? (
                          <span className="font-medium text-[#122038]">{veh.currentDriverName}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getExpiryBadge(veh.istimaraExpiry)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-gray-700 leading-tight">
                          <div>
                            <span className="text-gray-400">Mo:</span>{' '}
                            <strong className="text-emerald-700">
                              QAR {Number(veh.monthlyRent || 2200).toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400">Day:</span>{' '}
                            <span className="font-medium">
                              QAR {Number(veh.dailyRent || 120).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {Number(veh.currentMileage || 0).toLocaleString()} km
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 text-[11px]">{veh.ownership}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            veh.status === 'Available'
                              ? 'bg-emerald-50 text-[#20b56f]'
                              : veh.status === 'On Rent'
                              ? 'bg-blue-50 text-[#1f73e8]'
                              : veh.status === 'Maintenance'
                              ? 'bg-amber-50 text-[#f1a32a]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {veh.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          id={`view-veh-${veh.id}`}
                          onClick={() => setDetailVehicle(veh)}
                          title="View Details"
                          className="p-1.5 text-gray-500 hover:text-[#1f73e8] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-veh-${veh.id}`}
                          onClick={() => openEditModal(veh)}
                          title="Edit"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-veh-${veh.id}`}
                          onClick={() => setDeleteTargetId(veh.id)}
                          title="Delete"
                          className="p-1.5 text-gray-500 hover:text-[#ef5553] hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1f73e8] flex items-center justify-center font-bold">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#122038]">
                    {editingVehicle ? `Edit Vehicle: ${editingVehicle.plate}` : 'Register New Fleet Vehicle'}
                  </h3>
                  <p className="text-[11px] text-[#718198]">
                    Qatar Limousine specification, official documents, and rental rates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pt-3 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormTab('specs')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  formTab === 'specs'
                    ? 'bg-[#1f73e8] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>1. Vehicle Specs</span>
              </button>
              <button
                type="button"
                onClick={() => setFormTab('rental')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  formTab === 'rental'
                    ? 'bg-[#1f73e8] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>2. Rental & Driver</span>
              </button>
              <button
                type="button"
                onClick={() => setFormTab('documents')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  formTab === 'documents'
                    ? 'bg-[#1f73e8] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Istimara & Insurance</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Tab 1: Specs & Identity */}
              {formTab === 'specs' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Plate Number (Qatar) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 836220"
                        value={formData.plate}
                        onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f73e8] focus:outline-none font-mono font-bold text-[#1f73e8]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Plate Type *</label>
                      <select
                        value={formData.plateType}
                        onChange={(e) =>
                          setFormData({ ...formData, plateType: e.target.value as VehiclePlateType })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Limo">Limo (Commercial Limousine)</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Make *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Changan / Toyota"
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Model *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alsvin / Camry"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        placeholder="e.g. White"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">VIN / Chassis</label>
                      <input
                        type="text"
                        placeholder="e.g. CHN2026987654"
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Current Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={formData.currentMileage}
                        onChange={(e) =>
                          setFormData({ ...formData, currentMileage: Number(e.target.value) || 0 })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Fuel Type</label>
                      <input
                        type="text"
                        value={formData.fuelType}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Purchase Price (QAR)
                      </label>
                      <input
                        type="number"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, purchasePrice: Number(e.target.value) || 0 })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Ownership</label>
                      <select
                        value={formData.ownership}
                        onChange={(e) =>
                          setFormData({ ...formData, ownership: e.target.value as VehicleOwnership })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Company Owned">Company Owned</option>
                        <option value="Driver Financed">Driver Financed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as VehicleStatus })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Available">Available</option>
                        <option value="On Rent">On Rent</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Accident">Accident</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Sold">Sold</option>
                        <option value="Reserved">Reserved</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Rental Rates & Driver Assignment */}
              {formTab === 'rental' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-[#1f73e8] text-xs mb-1">Limousine Standard Rental Rates</h4>
                    <p className="text-[11px] text-gray-600">
                      Specify the default daily and monthly rental rates for this vehicle when creating rental contracts or calculating expected driver receivables.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Monthly Rent (QAR) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.monthlyRent}
                          onChange={(e) =>
                            setFormData({ ...formData, monthlyRent: Number(e.target.value) || 0 })
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[11px]">
                          QAR / Mo
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">Default standard: 2,200 QAR</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Daily Rent (QAR) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.dailyRent}
                          onChange={(e) =>
                            setFormData({ ...formData, dailyRent: Number(e.target.value) || 0 })
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[11px]">
                          QAR / Day
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">Default standard: 120 QAR</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="block font-semibold text-gray-700 mb-1">
                      Assigned Driver
                    </label>
                    <select
                      value={formData.currentDriverId}
                      onChange={(e) => handleDriverChange(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">-- Unassigned (Fleet Unit In Yard) --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.mobile || 'No mobile'} • QID: {d.qid || 'N/A'})
                        </option>
                      ))}
                    </select>
                    {formData.currentDriverId && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
                        <span>Driver is actively assigned to this vehicle.</span>
                        {(() => {
                          const d = drivers.find((drv) => drv.id === formData.currentDriverId);
                          return d?.mobile ? (
                            <WhatsAppButton
                              phone={d.mobile}
                              message={WhatsAppTemplates.generalContact(d.name)}
                              size="sm"
                              variant="pill"
                              label="Test WhatsApp"
                            />
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Official Qatar Documents & Upload */}
              {formTab === 'documents' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                    <h4 className="font-bold text-amber-900 text-xs mb-1">
                      Qatar Istimara (Road Permit) & Comprehensive Fleet Insurance
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Enter official renewal dates to trigger automatic expiry warnings in the top notification banner and client WhatsApp alerts.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Insurance Company
                      </label>
                      <select
                        value={formData.insuranceCompany}
                        onChange={(e) =>
                          setFormData({ ...formData, insuranceCompany: e.target.value })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Qatar Insurance Company (QIC)">Qatar Insurance Company (QIC)</option>
                        <option value="Doha Insurance Group">Doha Insurance Group</option>
                        <option value="Qatar General Insurance & Reinsurance">Qatar General Insurance</option>
                        <option value="Al Koot Insurance">Al Koot Insurance</option>
                        <option value="General Takaful">General Takaful</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Insurance Policy #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. POL-QIC-99218"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, insurancePolicyNumber: e.target.value })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Istimara Upload Card */}
                    <DocumentUploadCard
                      title="Istimara (Road Permit)"
                      subtitle="Qatar Traffic Dept official vehicle registration card"
                      icon={<FileCheck className="w-4 h-4 text-[#1f73e8]" />}
                      docNumber={formData.plate}
                      docNumberLabel="Vehicle Plate"
                      onDocNumberChange={(val) => setFormData({ ...formData, plate: val })}
                      expiryDate={formData.istimaraExpiry}
                      expiryLabel="Istimara Expiry Date"
                      onExpiryDateChange={(val) => setFormData({ ...formData, istimaraExpiry: val })}
                      fileData={istimaraFile}
                      onFileChange={setIstimaraFile}
                    />

                    {/* Insurance Upload Card */}
                    <DocumentUploadCard
                      title="Vehicle Insurance"
                      subtitle="Comprehensive / Third Party policy certificate"
                      icon={<Shield className="w-4 h-4 text-emerald-600" />}
                      docNumber={formData.insurancePolicyNumber}
                      docNumberLabel="Policy Number"
                      onDocNumberChange={(val) =>
                        setFormData({ ...formData, insurancePolicyNumber: val })
                      }
                      expiryDate={formData.insuranceExpiry}
                      expiryLabel="Insurance Expiry Date"
                      onExpiryDateChange={(val) =>
                        setFormData({ ...formData, insuranceExpiry: val })
                      }
                      fileData={insuranceFile}
                      onFileChange={setInsuranceFile}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-[11px] text-gray-400">
                  {formTab === 'specs' && 'Next: Configure rental rates & assigned driver'}
                  {formTab === 'rental' && 'Next: Upload Istimara & Insurance files'}
                  {formTab === 'documents' && 'Ready to save vehicle record'}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditOpen(false)}
                    className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle Record' : 'Save Vehicle Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Vehicle Details Modal */}
      {detailVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1f73e8] flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#122038]">
                    Complete Vehicle Record
                  </h3>
                  <p className="text-xs text-[#718198]">
                    {detailVehicle.make} {detailVehicle.model} • Plate {detailVehicle.plate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailVehicle(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-6 text-xs">
              {/* Official Qatar Documents & Compliance Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/70">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-blue-900 font-bold flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-[#1f73e8]" /> Qatar Istimara Status
                  </span>
                  <div className="flex items-center gap-2">
                    {getExpiryBadge(detailVehicle.istimaraExpiry)}
                  </div>
                  {detailVehicle.istimaraFileUrl && (
                    <a
                      href={detailVehicle.istimaraFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#1f73e8] hover:underline font-semibold inline-flex items-center gap-1 mt-1"
                    >
                      <Eye className="w-3 h-3" /> View Uploaded Istimara Document
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-blue-900 font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Insurance Status & Policy
                  </span>
                  <div className="flex items-center gap-2">
                    {getExpiryBadge(detailVehicle.insuranceExpiry)}
                    <span className="text-gray-500 font-mono text-[10px]">
                      {detailVehicle.insurancePolicyNumber || 'No Policy #'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {detailVehicle.insuranceCompany || 'Qatar Insurance Company'}
                  </div>
                  {detailVehicle.insuranceFileUrl && (
                    <a
                      href={detailVehicle.insuranceFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1 mt-1"
                    >
                      <Eye className="w-3 h-3" /> View Uploaded Policy Document
                    </a>
                  )}
                </div>
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#f8fbfe] rounded-xl border border-gray-100">
                <div>
                  <span className="text-[#718198] block">Vehicle ID</span>
                  <span className="font-bold text-[#122038]">{detailVehicle.id}</span>
                </div>
                <div>
                  <span className="text-[#718198] block">Plate Number</span>
                  <span className="font-bold text-[#1f73e8] font-mono">{detailVehicle.plate}</span>
                </div>
                <div>
                  <span className="text-[#718198] block">Ownership</span>
                  <span className="font-semibold text-gray-800">{detailVehicle.ownership}</span>
                </div>
                <div>
                  <span className="text-[#718198] block">VIN / Chassis</span>
                  <span className="font-mono text-gray-800">{detailVehicle.vin || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#718198] block">Year / Color</span>
                  <span className="font-semibold text-gray-800">
                    {detailVehicle.year} • {detailVehicle.color}
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Fuel / Transmission</span>
                  <span className="font-semibold text-gray-800">{detailVehicle.fuelType || 'Petrol'} / Auto</span>
                </div>
                <div>
                  <span className="text-[#718198] block">Purchase Price</span>
                  <span className="font-bold text-[#20b56f]">
                    QAR {(detailVehicle.purchasePrice || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Current Mileage</span>
                  <span className="font-mono font-bold text-gray-800">
                    {detailVehicle.currentMileage.toLocaleString()} km
                  </span>
                </div>
                <div>
                  <span className="text-[#718198] block">Monthly Rent Rate</span>
                  <span className="font-bold text-emerald-700">
                    QAR {(detailVehicle.monthlyRent || 2200).toLocaleString()} / mo
                  </span>
                </div>
              </div>

              {/* Current Driver with 1-click WhatsApp */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200/70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Current Assigned Driver
                    </span>
                    <span className="font-bold text-sm text-[#122038]">
                      {detailVehicle.currentDriverName || 'Available / In Yard (No Driver Assigned)'}
                    </span>
                  </div>

                  {(() => {
                    const assigned = detailVehicle.currentDriverId
                      ? drivers.find((d) => d.id === detailVehicle.currentDriverId)
                      : detailVehicle.currentDriverName
                      ? drivers.find((d) => d.name === detailVehicle.currentDriverName)
                      : null;

                    return assigned && assigned.mobile ? (
                      <WhatsAppButton
                        phone={assigned.mobile}
                        message={WhatsAppTemplates.generalContact(assigned.name)}
                        size="md"
                        variant="pill"
                        label="WhatsApp Driver"
                      />
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Complete Driver / Assignment History */}
              <div>
                <h4 className="font-bold text-sm text-[#122038] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#1f73e8]" /> Complete Driver / Assignment History
                </h4>
                {assignments.filter((a) => a.vehicleId === detailVehicle.id).length === 0 ? (
                  <p className="text-[#718198] italic">No historic assignments recorded.</p>
                ) : (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[#718198]">
                        <tr>
                          <th className="p-2">Driver</th>
                          <th className="p-2">Start Date</th>
                          <th className="p-2">Start KM</th>
                          <th className="p-2">Monthly Rent</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assignments
                          .filter((a) => a.vehicleId === detailVehicle.id)
                          .map((a) => (
                            <tr key={a.id}>
                              <td className="p-2 font-semibold">{a.driverName}</td>
                              <td className="p-2 text-gray-600">{a.startDate}</td>
                              <td className="p-2">{a.startMileage.toLocaleString()} km</td>
                              <td className="p-2 text-[#20b56f]">QAR {a.rent.toLocaleString()}</td>
                              <td className="p-2 font-bold">{a.status}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Vehicle Financing */}
              <div>
                <h4 className="font-bold text-sm text-[#122038] mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#c9a15b]" /> Vehicle Financing Plan
                </h4>
                {financing.filter((f) => f.vehicleId === detailVehicle.id).length === 0 ? (
                  <p className="text-[#718198] italic">No financing plan attached to this unit.</p>
                ) : (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-xs">
                    {financing
                      .filter((f) => f.vehicleId === detailVehicle.id)
                      .map((f) => (
                        <div key={f.id} className="grid grid-cols-2 gap-2">
                          <div>
                            Driver: <strong>{f.driverName}</strong>
                          </div>
                          <div>
                            Financed: <strong>QAR {f.financedAmount.toLocaleString()}</strong>
                          </div>
                          <div>
                            Monthly: <strong>QAR {f.monthlyInstallment.toLocaleString()}</strong>
                          </div>
                          <div>
                            Installments: <strong>{f.numberOfInstallments} months</strong>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Financial & Maintenance History */}
              <div>
                <h4 className="font-bold text-sm text-[#122038] mb-2 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#ef5553]" /> Maintenance Log
                </h4>
                {maintenance.filter((m) => m.vehicleId === detailVehicle.id).length === 0 ? (
                  <p className="text-[#718198] italic">No maintenance tickets logged.</p>
                ) : (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[#718198]">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Garage</th>
                          <th className="p-2">Cost</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {maintenance
                          .filter((m) => m.vehicleId === detailVehicle.id)
                          .map((m) => (
                            <tr key={m.id}>
                              <td className="p-2">{m.date}</td>
                              <td className="p-2 font-semibold">{m.type}</td>
                              <td className="p-2 text-gray-600">{m.garage}</td>
                              <td className="p-2 font-bold text-[#ef5553]">
                                QAR {m.cost.toLocaleString()}
                              </td>
                              <td className="p-2">{m.status}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Vehicle Record"
        message="Are you sure you want to delete this vehicle from Qatar Limo fleet? All associated assignment history remains in audit."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
