import React from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { EventAttachment } from '../../types';

interface FilePreviewModalProps {
  file: EventAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  const isImage =
    file.mimeType?.startsWith('image/') ||
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.originalName || file.fileName);

  const isPdf =
    file.mimeType?.includes('pdf') ||
    /\.pdf$/i.test(file.originalName || file.fileName);

  // Use dataUrl (Base64) or server endpoint
  const fileUrl = file.dataUrl || `/api/files/download/${file.fileName}`;

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.originalName || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    if (file.dataUrl && isPdf) {
      // Convert base64 to Blob URL for clean PDF viewer in new tab
      try {
        const byteCharacters = atob(file.dataUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (e) {
        console.error('Error creating blob for PDF preview:', e);
      }
    }
    window.open(fileUrl, '_blank');
  };

  return (
    <div
      id="file-preview-modal-overlay"
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="file-preview-modal-container"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5 text-emerald-400" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate" title={file.originalName}>
                {file.originalName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {(file.size / 1024).toFixed(1)} KB • {file.uploadedByName || 'ผู้อัปโหลด'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="file-preview-new-tab-btn"
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปิดแท็บใหม่</span>
            </button>

            <button
              id="file-preview-download-btn"
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              title="ดาวน์โหลดไฟล์ลงเครื่อง"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            <button
              id="file-preview-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewer Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/20 dark:bg-slate-950/50 flex items-center justify-center min-h-[350px]">
          {isImage ? (
            <div className="flex flex-col items-center justify-center max-w-full">
              <img
                src={fileUrl}
                alt={file.originalName}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
              <iframe
                src={`${fileUrl}#toolbar=1`}
                title={file.originalName}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {file.originalName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ไฟล์เอกสารประเภท Word, Excel หรือ PowerPoint แนะนำให้ดาวน์โหลดเพื่อเปิดดูด้วยโปรแกรมในเครื่องของคุณ
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ ({ (file.size / 1024).toFixed(1) } KB)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
