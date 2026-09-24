import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Driver, DriverStatus, DriverType, DriverDocumentAttachment } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Users,
  Phone,
  FileText,
  Calendar,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  FileCheck,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { DocumentUploadCard } from '../components/DocumentUploadCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { UploadedFilePayload } from '../utils/fileUpload';
import { WhatsAppTemplates } from '../utils/whatsapp';

interface DriversViewProps {
  filterType?: 'All' | 'Company Driver' | 'Outside/NOC Driver';
}

interface CustomDocItem {
  id: string;
  name: string;
  number: string;
  expiry: string;
  file: UploadedFilePayload | null;
}

export const DriversView: React.FC<DriversViewProps> = ({ filterType = 'All' }) => {
  const {
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
    assignments,
    documents,
    addDocumentRecord,
  } = useDb();

  const [activeTab, setActiveTab] = useState<'All' | 'Company Driver' | 'Outside/NOC Driver'>(filterType);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (filterType) {
      setActiveTab(filterType);
    }
  }, [filterType]);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active form section tab: 'profile' | 'documents'
  const [formSection, setFormSection] = useState<'profile' | 'documents'>('profile');

  // Basic Form State
  const [formData, setFormData] = useState({
    name: '',
    driverType: 'Company Driver' as DriverType,
    mobile: '',
    qid: '',
    qidExpiry: '',
    drivingLicense: '',
    drivingLicenseExpiry: '',
    noc: '',
    nocExpiry: '',
    passport: '',
    passportExpiry: '',
    status: 'Active' as DriverStatus,
  });

  // Attached Document Files
  const [qidFile, setQidFile] = useState<UploadedFilePayload | null>(null);
  const [licenseFile, setLicenseFile] = useState<UploadedFilePayload | null>(null);
  const [nocFile, setNocFile] = useState<UploadedFilePayload | null>(null);
  const [passportFile, setPassportFile] = useState<UploadedFilePayload | null>(null);
  const [otherDocs, setOtherDocs] = useState<CustomDocItem[]>([]);

  // Document upload state inside driver details modal
  const [uploadDocType, setUploadDocType] = useState('QID');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadDocExpiry, setUploadDocExpiry] = useState('');
  const [uploadDocPayload, setUploadDocPayload] = useState<UploadedFilePayload | null>(null);

  const openAddModal = () => {
    setEditingDriver(null);
    setFormSection('profile');
    setFormError(null);
    setFormData({
      name: '',
      driverType: activeTab === 'Outside/NOC Driver' ? 'Outside/NOC Driver' : 'Company Driver',
      mobile: '',
      qid: '',
      qidExpiry: '',
      drivingLicense: '',
      drivingLicenseExpiry: '',
      noc: '',
      nocExpiry: '',
      passport: '',
      passportExpiry: '',
      status: 'Active',
    });
    setQidFile(null);
    setLicenseFile(null);
    setNocFile(null);
    setPassportFile(null);
    setOtherDocs([]);
    setIsAddEditOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormSection('profile');
    setFormError(null);
    setFormData({
      name: driver.name,
      driverType: driver.driverType,
      mobile: driver.mobile,
      qid: driver.qid,
      qidExpiry: driver.qidExpiry,
      drivingLicense: driver.drivingLicense || '',
      drivingLicenseExpiry: driver.drivingLicenseExpiry || '',
      noc: driver.noc || '',
      nocExpiry: driver.nocExpiry || '',
      passport: driver.passport || '',
      passportExpiry: driver.passportExpiry || '',
      status: driver.status,
    });

    // Populate existing documents
    const existingList = driver.documentsList || [];
    const qidDoc = existingList.find((d) => d.type === 'QID');
    const licDoc = existingList.find((d) => d.type === 'Driving License');
    const nocDoc = existingList.find((d) => d.type === 'NOC');
    const passDoc = existingList.find((d) => d.type === 'Passport');

    setQidFile(qidDoc?.fileUrl ? { fileUrl: qidDoc.fileUrl, fileName: qidDoc.fileName || 'QID Document', fileSize: qidDoc.fileSize } : null);
    setLicenseFile(licDoc?.fileUrl ? { fileUrl: licDoc.fileUrl, fileName: licDoc.fileName || 'Driving License', fileSize: licDoc.fileSize } : null);
    setNocFile(nocDoc?.fileUrl ? { fileUrl: nocDoc.fileUrl, fileName: nocDoc.fileName || 'NOC Document', fileSize: nocDoc.fileSize } : null);
    setPassportFile(passDoc?.fileUrl ? { fileUrl: passDoc.fileUrl, fileName: passDoc.fileName || 'Passport Document', fileSize: passDoc.fileSize } : null);

    const customs = existingList
      .filter((d) => !['QID', 'Driving License', 'NOC', 'Passport'].includes(d.type))
      .map((d) => ({
        id: d.id,
        name: d.name || d.type,
        number: d.number || '',
        expiry: d.expiry || '',
        file: d.fileUrl ? { fileUrl: d.fileUrl, fileName: d.fileName || d.name, fileSize: d.fileSize } : null,
      }));
    setOtherDocs(customs);

    setIsAddEditOpen(true);
  };

  const handleAddCustomDoc = () => {
    setOtherDocs([
      ...otherDocs,
      {
        id: `doc_${Date.now()}`,
        name: 'Work Contract',
        number: '',
        expiry: '',
        file: null,
      },
    ]);
  };

  const handleRemoveCustomDoc = (id: string) => {
    setOtherDocs(otherDocs.filter((d) => d.id !== id));
  };

  const handleUpdateCustomDoc = (id: string, updates: Partial<CustomDocItem>) => {
    setOtherDocs(
      otherDocs.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name || !formData.mobile || !formData.qid) {
      setFormError('Please fill in required fields (Name, Mobile, QID).');
      return;
    }

    setLoading(true);
    try {
      // Assemble driver document attachments
      const docAttachments: DriverDocumentAttachment[] = [];

      if (qidFile) {
        docAttachments.push({
          id: 'qid',
          name: 'Qatar ID (QID)',
          type: 'QID',
          number: formData.qid,
          expiry: formData.qidExpiry,
          fileUrl: qidFile.fileUrl,
          fileName: qidFile.fileName,
          fileSize: qidFile.fileSize,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (licenseFile) {
        docAttachments.push({
          id: 'license',
          name: 'Driving License',
          type: 'Driving License',
          number: formData.drivingLicense,
          expiry: formData.drivingLicenseExpiry,
          fileUrl: licenseFile.fileUrl,
          fileName: licenseFile.fileName,
          fileSize: licenseFile.fileSize,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (nocFile) {
        docAttachments.push({
          id: 'noc',
          name: 'NOC Certificate',
          type: 'NOC',
          number: formData.noc,
          expiry: formData.nocExpiry,
          fileUrl: nocFile.fileUrl,
          fileName: nocFile.fileName,
          fileSize: nocFile.fileSize,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (passportFile) {
        docAttachments.push({
          id: 'passport',
          name: 'Passport',
          type: 'Passport',
          number: formData.passport,
          expiry: formData.passportExpiry,
          fileUrl: passportFile.fileUrl,
          fileName: passportFile.fileName,
          fileSize: passportFile.fileSize,
          uploadedAt: new Date().toISOString(),
        });
      }

      otherDocs.forEach((docItem) => {
        if (docItem.file || docItem.number || docItem.name) {
          docAttachments.push({
            id: docItem.id,
            name: docItem.name || 'Other Document',
            type: 'Other',
            number: docItem.number || '',
            expiry: docItem.expiry || '',
            fileUrl: docItem.file?.fileUrl || '',
            fileName: docItem.file?.fileName || '',
            fileSize: docItem.file?.fileSize || 0,
            uploadedAt: new Date().toISOString(),
          });
        }
      });

      const payload = {
        ...formData,
        documentsList: docAttachments,
      };

      if (editingDriver) {
        await updateDriver(editingDriver.id, payload);
      } else {
        await addDriver(payload);
      }
      setIsAddEditOpen(false);
    } catch (err: any) {
      console.error('Error saving driver:', err);
      setFormError(err?.message || 'Failed to save driver. Please check that all required fields are filled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await deleteDriver(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDriverDocumentFromDetail = async () => {
    if (!detailDriver || !uploadDocType) return;
    try {
      const docRecord = {
        type: uploadDocType,
        entity: 'Driver',
        entityId: detailDriver.id,
        number: uploadDocNumber || detailDriver.qid,
        expiry: uploadDocExpiry || detailDriver.qidExpiry,
        fileUrl: uploadDocPayload?.fileUrl || '',
      };
      await addDocumentRecord(docRecord);

      // Also append to detailDriver documentsList
      const newAttachment: DriverDocumentAttachment = {
        id: `doc_${Date.now()}`,
        name: uploadDocType,
        type: (uploadDocType === 'QID' || uploadDocType === 'Driving License' || uploadDocType === 'NOC' || uploadDocType === 'Passport') ? uploadDocType : 'Other',
        number: uploadDocNumber,
        expiry: uploadDocExpiry,
        fileUrl: uploadDocPayload?.fileUrl,
        fileName: uploadDocPayload?.fileName,
        fileSize: uploadDocPayload?.fileSize,
        uploadedAt: new Date().toISOString(),
      };
      const updatedList = [...(detailDriver.documentsList || []), newAttachment];
      await updateDriver(detailDriver.id, { documentsList: updatedList });

      // Update local view
      setDetailDriver({
        ...detailDriver,
        documentsList: updatedList,
      });

      setUploadDocNumber('');
      setUploadDocExpiry('');
      setUploadDocPayload(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter list
  const filteredDrivers = drivers.filter((d) => {
    const matchesTab = activeTab === 'All' || d.driverType === activeTab;
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mobile.includes(searchTerm) ||
      d.qid.includes(searchTerm) ||
      (d.passport && d.passport.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">
            {activeTab === 'All'
              ? 'All Drivers'
              : activeTab === 'Company Driver'
              ? 'Company Drivers'
              : 'Outside/NOC Drivers'}
          </h1>
          <p className="text-xs text-[#718198]">
            Driver registry, QID, license, NOC, passport & document archive
          </p>
        </div>

        <button
          id="btn-add-driver"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 bg-[#f5f8fb] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'All' ? 'bg-white text-[#122038] shadow-xs' : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            All Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('Company Driver')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'Company Driver' ? 'bg-white text-[#1f73e8] shadow-xs' : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Company Drivers ({drivers.filter((d) => d.driverType === 'Company Driver').length})
          </button>
          <button
            onClick={() => setActiveTab('Outside/NOC Driver')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'Outside/NOC Driver' ? 'bg-white text-[#7b5ce6] shadow-xs' : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Outside/NOC Drivers ({drivers.filter((d) => d.driverType === 'Outside/NOC Driver').length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver by name, QID, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
          />
        </div>
      </div>

      {/* Driver Register Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Driver</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Mobile & WhatsApp</th>
                <th className="py-3 px-4 font-semibold">Uploaded Documents</th>
                <th className="py-3 px-4 font-semibold">QID Expiry</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No drivers registered. Click "Add Driver" to register.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((drv) => {
                  const docList = drv.documentsList || [];
                  const hasQidDoc = docList.some((d) => d.type === 'QID' && d.fileUrl);
                  const hasLicDoc = docList.some((d) => d.type === 'Driving License' && d.fileUrl);
                  const hasNocDoc = docList.some((d) => d.type === 'NOC' && d.fileUrl);
                  const hasPassDoc = docList.some((d) => d.type === 'Passport' && d.fileUrl) || !!drv.passport;
                  const otherCount = docList.filter((d) => !['QID', 'Driving License', 'NOC', 'Passport'].includes(d.type)).length;

                  return (
                    <tr key={drv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                        {drv.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122038]">{drv.name}</div>
                        <div className="text-[11px] text-[#718198]">QID: {drv.qid}</div>
                        {drv.passport && (
                          <div className="text-[10px] text-gray-500">Pass: {drv.passport}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            drv.driverType === 'Company Driver'
                              ? 'bg-blue-50 text-[#1f73e8]'
                              : 'bg-purple-50 text-[#7b5ce6]'
                          }`}
                        >
                          {drv.driverType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-gray-800 font-semibold">{drv.mobile}</span>
                          <WhatsAppButton
                            phone={drv.mobile}
                            driverName={drv.name}
                            variant="icon"
                            title={`Chat with ${drv.name} on WhatsApp`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            title={hasQidDoc ? 'QID Document attached' : 'QID number only'}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              hasQidDoc
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            QID {hasQidDoc && '✓'}
                          </span>
                          <span
                            title={hasLicDoc ? 'License Document attached' : 'License number only'}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              hasLicDoc
                                ? 'bg-blue-50 text-[#1f73e8] border-blue-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            LIC {hasLicDoc && '✓'}
                          </span>
                          <span
                            title={hasNocDoc ? 'NOC Document attached' : 'No NOC doc'}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              hasNocDoc
                                ? 'bg-purple-50 text-[#7b5ce6] border-purple-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            NOC {hasNocDoc && '✓'}
                          </span>
                          <span
                            title={hasPassDoc ? 'Passport Document attached' : 'No Passport doc'}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              hasPassDoc
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            PASS {hasPassDoc && '✓'}
                          </span>
                          {otherCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              +{otherCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                        {drv.qidExpiry || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            drv.status === 'Active'
                              ? 'bg-emerald-50 text-[#20b56f]'
                              : drv.status === 'Blocked'
                              ? 'bg-red-50 text-[#ef5553]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {drv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <WhatsAppButton
                          phone={drv.mobile}
                          driverName={drv.name}
                          variant="pill"
                          label="WhatsApp"
                        />
                        <button
                          id={`view-drv-${drv.id}`}
                          onClick={() => setDetailDriver(drv)}
                          title="Driver Details & Document Archive"
                          className="p-1.5 text-gray-500 hover:text-[#1f73e8] hover:bg-gray-100 rounded inline-flex items-center cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-drv-${drv.id}`}
                          onClick={() => openEditModal(drv)}
                          title="Edit Driver & Documents"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded inline-flex items-center cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-drv-${drv.id}`}
                          onClick={() => setDeleteTargetId(drv.id)}
                          title="Delete"
                          className="p-1.5 text-gray-500 hover:text-[#ef5553] hover:bg-red-50 rounded inline-flex items-center cursor-pointer"
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

      {/* Add / Edit Driver Modal with Full Document Upload Menu */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#122038]">
                  {editingDriver ? 'Edit Driver & Documents' : 'Add New Driver & Documents'}
                </h3>
                <p className="text-[11px] text-[#718198]">
                  Fill personal information and upload QID, License, NOC, Passport & related documents
                </p>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs between Profile & Documents */}
            <div className="flex border-b border-gray-200 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setFormSection('profile')}
                className={`py-2 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
                  formSection === 'profile'
                    ? 'border-[#1f73e8] text-[#1f73e8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Driver Information</span>
              </button>
              <button
                type="button"
                onClick={() => setFormSection('documents')}
                className={`py-2 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
                  formSection === 'documents'
                    ? 'border-[#1f73e8] text-[#1f73e8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. Upload Documents (QID, License, NOC, Passport)</span>
                {(qidFile || licenseFile || nocFile || passportFile || otherDocs.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSection === 'profile' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Driver Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Asad Zaman Butt"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Driver Type *</label>
                      <select
                        value={formData.driverType}
                        onChange={(e) =>
                          setFormData({ ...formData, driverType: e.target.value as DriverType })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Company Driver">Company Driver</option>
                        <option value="Outside/NOC Driver">Outside/NOC Driver</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Mobile / WhatsApp Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 30310560 or +974 55123456"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400">
                        Used for instant 1-click WhatsApp messaging & reminders.
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as DriverStatus })
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#1f73e8] text-xs">Ready to attach documents?</div>
                      <div className="text-[11px] text-[#718198]">
                        Next tab lets you upload QID, Driving License, NOC, Passport and other files.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormSection('documents')}
                      className="px-3 py-1.5 bg-[#1f73e8] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      Go to Documents →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    📎 Upload high-resolution photos or PDF copies. Images are automatically compressed to ensure fast cloud syncing.
                  </div>

                  {/* 1. QID Upload Menu */}
                  <DocumentUploadCard
                    title="1. Qatar ID (QID)"
                    subtitle="Driver national residence card"
                    required={true}
                    docNumber={formData.qid}
                    onDocNumberChange={(val) => setFormData({ ...formData, qid: val })}
                    docNumberLabel="QID Number"
                    docNumberPlaceholder="e.g. 28458601510"
                    expiryDate={formData.qidExpiry}
                    onExpiryDateChange={(val) => setFormData({ ...formData, qidExpiry: val })}
                    fileData={qidFile}
                    onFileChange={setQidFile}
                  />

                  {/* 2. Driving License Upload Menu */}
                  <DocumentUploadCard
                    title="2. Driving License"
                    subtitle="Qatar Traffic Department driving permit"
                    docNumber={formData.drivingLicense}
                    onDocNumberChange={(val) => setFormData({ ...formData, drivingLicense: val })}
                    docNumberLabel="Driving License No."
                    docNumberPlaceholder="e.g. DL-2845860"
                    expiryDate={formData.drivingLicenseExpiry}
                    onExpiryDateChange={(val) => setFormData({ ...formData, drivingLicenseExpiry: val })}
                    fileData={licenseFile}
                    onFileChange={setLicenseFile}
                  />

                  {/* 3. NOC Certificate Upload Menu */}
                  <DocumentUploadCard
                    title="3. No Objection Certificate (NOC)"
                    subtitle="Employer or sponsor NOC letter"
                    docNumber={formData.noc}
                    onDocNumberChange={(val) => setFormData({ ...formData, noc: val })}
                    docNumberLabel="NOC Ref / Letter No."
                    docNumberPlaceholder="e.g. NOC-2026-99"
                    expiryDate={formData.nocExpiry}
                    onExpiryDateChange={(val) => setFormData({ ...formData, nocExpiry: val })}
                    fileData={nocFile}
                    onFileChange={setNocFile}
                  />

                  {/* 4. Passport Upload Menu */}
                  <DocumentUploadCard
                    title="4. International Passport"
                    subtitle="Valid travel passport page"
                    docNumber={formData.passport}
                    onDocNumberChange={(val) => setFormData({ ...formData, passport: val })}
                    docNumberLabel="Passport Number"
                    docNumberPlaceholder="e.g. PA1234567"
                    expiryDate={formData.passportExpiry}
                    onExpiryDateChange={(val) => setFormData({ ...formData, passportExpiry: val })}
                    fileData={passportFile}
                    onFileChange={setPassportFile}
                  />

                  {/* 5. Other Related Documents */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#122038]">
                          5. Other Related Documents
                        </h4>
                        <p className="text-[10px] text-[#718198]">
                          Upload additional attachments: Contract, Police Clearance, Visa, Medical, etc.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomDoc}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Document</span>
                      </button>
                    </div>

                    {otherDocs.length === 0 ? (
                      <div className="text-center p-3 border border-dashed rounded-lg text-gray-400 text-[11px]">
                        No additional documents added. Click "+ Add Document" if needed.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {otherDocs.map((item, idx) => (
                          <div key={item.id} className="relative">
                            <div className="flex items-center justify-between pb-1">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Document #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomDoc(item.id)}
                                className="text-red-500 hover:text-red-700 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            </div>
                            <DocumentUploadCard
                              title={item.name || 'Additional Document'}
                              docNumber={item.number}
                              onDocNumberChange={(val) => handleUpdateCustomDoc(item.id, { number: val })}
                              docNumberLabel="Document Number / Ref"
                              expiryDate={item.expiry}
                              onExpiryDateChange={(val) => handleUpdateCustomDoc(item.id, { expiry: val })}
                              fileData={item.file}
                              onFileChange={(val) => handleUpdateCustomDoc(item.id, { file: val })}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 shrink-0">
                {formSection === 'documents' ? (
                  <button
                    type="button"
                    onClick={() => setFormSection('profile')}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                  >
                    ← Back to Info
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#20b56f] hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'Saving...' : editingDriver ? 'Update Driver & Documents' : 'Save Driver & Documents'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Details & Full Document Archive Modal */}
      {detailDriver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#20b56f] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#122038]">
                    {detailDriver.name}
                  </h3>
                  <p className="text-xs text-[#718198]">
                    {detailDriver.driverType} • QID: {detailDriver.qid}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <WhatsAppButton
                  phone={detailDriver.mobile}
                  driverName={detailDriver.name}
                  variant="pill"
                  label="Chat on WhatsApp"
                />
                <button
                  onClick={() => setDetailDriver(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-6 text-xs pr-1">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f8fbfe] rounded-xl border border-gray-100">
                <div>
                  <span className="text-[#718198] block text-[11px]">Mobile / WhatsApp</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-[#1f73e8] font-mono">{detailDriver.mobile}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[#718198] block text-[11px]">Status</span>
                  <span className="font-bold text-[#20b56f] mt-0.5 block">{detailDriver.status}</span>
                </div>
                <div>
                  <span className="text-[#718198] block text-[11px]">QID Number</span>
                  <span className="font-mono font-bold text-gray-800 mt-0.5 block">{detailDriver.qid}</span>
                  <span className="text-[10px] text-gray-500 block">Exp: {detailDriver.qidExpiry || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#718198] block text-[11px]">Passport</span>
                  <span className="font-mono font-bold text-gray-800 mt-0.5 block">
                    {detailDriver.passport || 'N/A'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Exp: {detailDriver.passportExpiry || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents Archive */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-[#122038] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#1f73e8]" />
                    Uploaded Document Archive
                  </h4>
                  <span className="text-xs text-[#718198]">
                    {(detailDriver.documentsList?.length || 0)} files stored
                  </span>
                </div>

                {/* Document Gallery Cards */}
                {(!detailDriver.documentsList || detailDriver.documentsList.length === 0) ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 italic">
                    No documents attached yet for this driver. Use the upload box below to attach QID, License, NOC or Passport.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailDriver.documentsList.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-[#1f73e8] transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-[#122038]">{docItem.name || docItem.type}</span>
                            <span className="text-[10px] bg-blue-50 text-[#1f73e8] font-bold px-2 py-0.5 rounded">
                              {docItem.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-600 space-y-0.5">
                            {docItem.number && <div>Number: <span className="font-mono font-bold text-gray-800">{docItem.number}</span></div>}
                            {docItem.expiry && <div>Expiry: <span className="font-semibold text-gray-700">{docItem.expiry}</span></div>}
                            {docItem.fileName && <div className="text-[10px] text-gray-400 truncate">File: {docItem.fileName}</div>}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                          {docItem.fileUrl ? (
                            <a
                              href={docItem.fileUrl}
                              download={docItem.fileName || `${docItem.type}.png`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#1f73e8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View / Download File
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No file attached</span>
                          )}

                          <WhatsAppButton
                            phone={detailDriver.mobile}
                            driverName={detailDriver.name}
                            message={WhatsAppTemplates.documentExpiryWarning(
                              detailDriver.name,
                              docItem.type,
                              docItem.number || '',
                              docItem.expiry || 'soon',
                              30
                            )}
                            variant="badge"
                            label="Notify Driver"
                            title="Send document renewal notice on WhatsApp"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Document for existing driver */}
                <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#1f73e8]" /> Attach New Document to Driver
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="p-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                    >
                      <option value="QID">Qatar ID (QID)</option>
                      <option value="Driving License">Driving License</option>
                      <option value="NOC">NOC Document</option>
                      <option value="Passport">Passport</option>
                      <option value="Contract">Driver Contract</option>
                      <option value="Medical Certificate">Medical Certificate</option>
                      <option value="Police Clearance">Police Clearance</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Doc Number"
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      className="p-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                    />

                    <input
                      type="date"
                      value={uploadDocExpiry}
                      onChange={(e) => setUploadDocExpiry(e.target.value)}
                      className="p-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const payload = await import('../utils/fileUpload').then(m => m.processUploadedFile(file));
                            setUploadDocPayload(payload);
                          }
                        }}
                        className="text-[11px] text-gray-500"
                      />
                      {uploadDocPayload && (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Ready: {uploadDocPayload.fileName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveDriverDocumentFromDetail}
                      className="px-4 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      Upload & Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Vehicle History */}
              <div>
                <h4 className="font-bold text-sm text-[#122038] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#c9a15b]" /> Complete Vehicle History
                </h4>

                {assignments.filter((a) => a.driverId === detailDriver.id).length === 0 ? (
                  <p className="text-[#718198] italic">No vehicle assignments on file for this driver.</p>
                ) : (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[#718198]">
                        <tr>
                          <th className="p-2">Vehicle</th>
                          <th className="p-2">Start</th>
                          <th className="p-2">Return</th>
                          <th className="p-2">Start KM</th>
                          <th className="p-2">End KM</th>
                          <th className="p-2">Total KM</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assignments
                          .filter((a) => a.driverId === detailDriver.id)
                          .map((a) => {
                            const endKm = a.endMileage || a.startMileage;
                            const totalKm = Math.max(0, endKm - a.startMileage);
                            return (
                              <tr key={a.id}>
                                <td className="p-2 font-bold text-[#122038]">{a.vehiclePlate}</td>
                                <td className="p-2 text-gray-600">{a.startDate}</td>
                                <td className="p-2 text-gray-600">{a.endDate || 'Active'}</td>
                                <td className="p-2">{a.startMileage.toLocaleString()}</td>
                                <td className="p-2">{a.endMileage ? a.endMileage.toLocaleString() : '-'}</td>
                                <td className="p-2 font-bold text-[#1f73e8]">{totalKm.toLocaleString()} km</td>
                                <td className="p-2 font-bold">{a.status}</td>
                              </tr>
                            );
                          })}
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
        title="Delete Driver Record"
        message="Are you sure you want to delete this driver from Prince Limousine ERP?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};
export default DriversView;
