import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { DocumentRecord } from '../types';
import {
  Plus,
  Search,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  Download,
} from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { WhatsAppTemplates } from '../utils/whatsapp';
import { processUploadedFile } from '../utils/fileUpload';

export const DocumentsExpiryView: React.FC = () => {
  const { documents, drivers, vehicles, addDocumentRecord, deleteDocumentRecord, settings } = useDb();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Istimara (Road Permit)',
    entity: 'Vehicle',
    entityId: '',
    number: '',
    expiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    fileUrl: '',
    fileName: '',
  });

  const warningDays = settings.documentExpiryWarningDays || settings.warning1Days || 30;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const payload = await processUploadedFile(file);
      setFormData((prev) => ({
        ...prev,
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.number || !formData.expiry) return;

    setLoading(true);
    try {
      await addDocumentRecord({
        type: formData.type,
        entity: formData.entity,
        entityId: formData.entityId || 'General',
        number: formData.number,
        expiry: formData.expiry,
        fileUrl: formData.fileUrl || '',
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
      await deleteDocumentRecord(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDocStatus = (expiryDate: string) => {
    if (!expiryDate) return { label: 'No Date', color: 'gray', days: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, color: 'red', days: diffDays };
    }
    if (diffDays <= warningDays) {
      return { label: `Expiring (${diffDays}d left)`, color: 'amber', days: diffDays };
    }
    return { label: `Valid (${diffDays}d left)`, color: 'green', days: diffDays };
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.entityId ? doc.entityId.toLowerCase().includes(searchTerm.toLowerCase()) : false);

    const matchesType = typeFilter === 'All' || doc.type.toLowerCase().includes(typeFilter.toLowerCase());

    const st = getDocStatus(doc.expiry);
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Expired' && st.color === 'red') ||
      (statusFilter === 'Expiring' && st.color === 'amber') ||
      (statusFilter === 'Valid' && st.color === 'green');

    return matchesSearch && matchesType && matchesStatus;
  });

  const expiredCount = documents.filter((d) => getDocStatus(d.expiry).color === 'red').length;
  const expiringCount = documents.filter((d) => getDocStatus(d.expiry).color === 'amber').length;
  const validCount = documents.filter((d) => getDocStatus(d.expiry).color === 'green').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">Documents & Expiry Tracking</h1>
          <p className="text-xs text-[#718198]">
            QID, Driving Licenses, NOC, Passport, Istimara & Insurance compliance with direct driver WhatsApp reminders
          </p>
        </div>

        <button
          id="btn-upload-document"
          onClick={() => {
            setFormData({
              type: 'QID (Qatar ID)',
              entity: 'Driver',
              entityId: '',
              number: '',
              expiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
              fileUrl: '',
              fileName: '',
            });
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Expiry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold">Expired Documents</span>
            <div className="text-2xl font-extrabold text-[#ef5553]">{expiredCount}</div>
            <span className="text-[11px] text-gray-400">Immediate action required</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#ef5553] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold">Expiring Soon</span>
            <div className="text-2xl font-extrabold text-[#f1a32a]">{expiringCount}</div>
            <span className="text-[11px] text-gray-400">Within {warningDays} days window</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-[#f1a32a] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold">Fully Valid</span>
            <div className="text-2xl font-extrabold text-[#20b56f]">{validCount}</div>
            <span className="text-[11px] text-gray-400">Compliant & approved</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#20b56f] flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document, number, or entity..."
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
            <option value="All">All Compliance Statuses</option>
            <option value="Valid">Valid</option>
            <option value="Expiring">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-[#122038] focus:outline-none"
          >
            <option value="All">All Document Types</option>
            <option value="QID">QID (Qatar ID)</option>
            <option value="License">Driving License</option>
            <option value="NOC">NOC Document</option>
            <option value="Passport">Passport</option>
            <option value="Istimara">Istimara</option>
            <option value="Insurance">Insurance</option>
            <option value="CR">Commercial Registration</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Document Type</th>
                <th className="py-3 px-4 font-semibold">Document Number</th>
                <th className="py-3 px-4 font-semibold">Entity & Details</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold">Compliance Status</th>
                <th className="py-3 px-4 font-semibold">Attachment</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No documents matching criteria. Click "Upload Document" to register one.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const st = getDocStatus(doc.expiry);
                  const driverMatch =
                    doc.entity === 'Driver'
                      ? drivers.find(
                          (d) =>
                            d.id === doc.entityId ||
                            (doc.entityId && d.name.toLowerCase() === doc.entityId.toLowerCase()) ||
                            d.qid === doc.number
                        )
                      : null;

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122038] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#1f73e8]" />
                          {doc.type}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#122038]">
                        {doc.number}
                      </td>
                      <td className="py-3 px-4 text-[#718198]">
                        <div>
                          {doc.entity}: <strong className="text-gray-800">{driverMatch ? driverMatch.name : doc.entityId}</strong>
                        </div>
                        {driverMatch && (
                          <div className="text-[11px] font-mono text-gray-500">
                            {driverMatch.mobile}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{doc.expiry}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            st.color === 'green'
                              ? 'bg-emerald-50 text-[#20b56f]'
                              : st.color === 'amber'
                              ? 'bg-amber-50 text-[#f1a32a]'
                              : 'bg-red-50 text-[#ef5553]'
                          }`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#1f73e8] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>View / Download</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">No file attached</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {driverMatch && (
                          <WhatsAppButton
                            phone={driverMatch.mobile}
                            driverName={driverMatch.name}
                            message={WhatsAppTemplates.documentExpiryWarning(
                              driverMatch.name,
                              doc.type,
                              doc.number,
                              doc.expiry,
                              st.days
                            )}
                            variant="badge"
                            label="WhatsApp Driver"
                            title={`Contact ${driverMatch.name} on WhatsApp regarding this document`}
                          />
                        )}

                        <button
                          onClick={() => setDeleteTargetId(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-[#ef5553] hover:bg-red-50 rounded cursor-pointer"
                          title="Delete document"
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

      {/* Upload Document Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#122038]">Upload Document</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Associated Entity *</label>
                <select
                  value={formData.entity}
                  onChange={(e) => setFormData({ ...formData, entity: e.target.value, entityId: '' })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="Driver">Driver</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Company">Company / Fleet General</option>
                </select>
              </div>

              {formData.entity === 'Driver' ? (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Choose Driver *</label>
                  <select
                    value={formData.entityId}
                    onChange={(e) => {
                      const drv = drivers.find((d) => d.id === e.target.value);
                      setFormData({
                        ...formData,
                        entityId: e.target.value,
                        number: formData.number || drv?.qid || '',
                      });
                    }}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (QID: {d.qid})
                      </option>
                    ))}
                  </select>
                </div>
              ) : formData.entity === 'Vehicle' ? (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Choose Vehicle *</label>
                  <select
                    value={formData.entityId}
                    onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="">-- Select Vehicle Plate --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} ({v.make} {v.model})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Document Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="QID (Qatar ID)">QID (Qatar ID)</option>
                  <option value="Driving License">Driving License</option>
                  <option value="NOC Document">NOC (No Objection Certificate)</option>
                  <option value="Passport">Passport</option>
                  <option value="Istimara (Road Permit)">Istimara (Road Permit)</option>
                  <option value="Vehicle Insurance">Vehicle Insurance</option>
                  <option value="Commercial Registration (CR)">Commercial Registration (CR)</option>
                  <option value="Limousine Permit">Limousine Permit</option>
                  <option value="Driver Contract">Driver Contract</option>
                  <option value="Other">Other Certificate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Document Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28458601510 or DL-99"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Attach File / Image</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none text-xs"
                />
                {formData.fileName && (
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                    Ready to upload: {formData.fileName}
                  </div>
                )}
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
                  className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteTargetId}
        title="Delete Document Record"
        message="Are you sure you want to delete this document from the registry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={loading}
      />
    </div>
  );
};

export default DocumentsExpiryView;
