import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Eye, AlertCircle } from 'lucide-react';
import { processUploadedFile, UploadedFilePayload } from '../utils/fileUpload';

interface DocumentUploadCardProps {
  title: string;
  icon?: React.ReactNode;
  required?: boolean;
  docNumber?: string;
  onDocNumberChange?: (val: string) => void;
  docNumberLabel?: string;
  docNumberPlaceholder?: string;
  expiryDate?: string;
  onExpiryDateChange?: (val: string) => void;
  expiryLabel?: string;
  fileData?: UploadedFilePayload | null;
  onFileChange: (file: UploadedFilePayload | null) => void;
  accept?: string;
  subtitle?: string;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  icon,
  required = false,
  docNumber,
  onDocNumberChange,
  docNumberLabel = 'Document Number',
  docNumberPlaceholder = 'Enter number...',
  expiryDate,
  onExpiryDateChange,
  expiryLabel = 'Expiry Date',
  fileData,
  onFileChange,
  accept = 'image/*,application/pdf',
  subtitle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const payload = await processUploadedFile(file);
      onFileChange(payload);
    } catch (err) {
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = fileData?.fileUrl?.startsWith('data:image');

  return (
    <div className="bg-[#f8fbfe] border border-gray-200/80 rounded-xl p-3.5 space-y-3 transition-all hover:border-[#1f73e8]/40 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-[#1f73e8]">{icon}</div>}
          <div>
            <h4 className="font-bold text-xs text-[#122038] flex items-center gap-1">
              <span>{title}</span>
              {required && <span className="text-red-500 font-bold">*</span>}
            </h4>
            {subtitle && <p className="text-[10px] text-[#718198]">{subtitle}</p>}
          </div>
        </div>

        {fileData ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attached
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Not uploaded</span>
        )}
      </div>

      {/* Doc Number & Expiry Inputs */}
      {(onDocNumberChange || onExpiryDateChange) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {onDocNumberChange && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                {docNumberLabel} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={required}
                value={docNumber || ''}
                onChange={(e) => onDocNumberChange(e.target.value)}
                placeholder={docNumberPlaceholder}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
              />
            </div>
          )}

          {onExpiryDateChange && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                {expiryLabel}
              </label>
              <input
                type="date"
                value={expiryDate || ''}
                onChange={(e) => onExpiryDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Drop Zone / File Preview */}
      <div>
        {fileData ? (
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {isImage ? (
                <img
                  src={fileData.fileUrl}
                  alt={title}
                  className="w-9 h-9 object-cover rounded border border-gray-100 shrink-0 cursor-pointer"
                  onClick={() => setPreviewOpen(true)}
                />
              ) : (
                <div className="w-9 h-9 bg-blue-50 text-[#1f73e8] rounded flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <div className="font-semibold text-gray-800 truncate text-[11px]">
                  {fileData.fileName || `${title} Document`}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {formatFileSize(fileData.fileSize)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="p-1 text-[#1f73e8] hover:bg-blue-50 rounded"
                title="Preview Document"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Remove Attached File"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors bg-white ${
              isDragging
                ? 'border-[#1f73e8] bg-blue-50/50'
                : 'border-gray-300 hover:border-[#1f73e8]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept={accept}
              className="hidden"
            />
            {isProcessing ? (
              <span className="text-[11px] text-[#1f73e8] font-semibold animate-pulse">
                Processing & optimizing file...
              </span>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-[11px]">
                  <span className="font-bold text-[#1f73e8]">Click to upload</span> or drag document file
                </span>
                <span className="text-[10px] text-gray-400">(JPG, PNG, PDF)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {previewOpen && fileData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-sm text-[#122038]">{title} Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 rounded-xl my-2">
              {isImage ? (
                <img
                  src={fileData.fileUrl}
                  alt={title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-[#1f73e8] mx-auto mb-3" />
                  <p className="text-xs font-semibold text-gray-700">{fileData.fileName}</p>
                  <p className="text-[11px] text-gray-500 mt-1">PDF / Document File</p>
                  <a
                    href={fileData.fileUrl}
                    download={fileData.fileName || `${title}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-[#1f73e8] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-600 transition-colors"
                  >
                    Open / Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
