import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  Filter,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  User,
  Trash2,
  Eye,
} from 'lucide-react';
import { EventAttachment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FilePreviewModal } from '../common/FilePreviewModal';

export const DocumentView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast, confirm } = useToast();

  const [files, setFiles] = useState<EventAttachment[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<EventAttachment | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ files: EventAttachment[] }>('/files');
      setFiles(res.files || []);
    } catch (e) {
      console.error('Error fetching files:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = (file: EventAttachment) => {
    confirm({
      title: 'ยืนยันการลบไฟล์?',
      message: `คุณต้องการลบไฟล์ "${file.originalName}" ใช่หรือไม่?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/files/${file.id}`);
          showToast('success', 'ลบไฟล์สำเร็จ');
          fetchFiles();
        } catch (e: any) {
          showToast('error', 'ลบไฟล์ไม่สำเร็จ', e?.message);
        }
      },
    });
  };

  const getFileIcon = (mimeType: string, ext: string) => {
    if (mimeType.includes('pdf') || ext.includes('pdf')) {
      return <FileText className="w-8 h-8 text-rose-500" />;
    }
    if (mimeType.includes('image') || /png|jpg|jpeg|webp/i.test(ext)) {
      return <ImageIcon className="w-8 h-8 text-emerald-500" />;
    }
    if (mimeType.includes('sheet') || /xls|xlsx|csv/i.test(ext)) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    }
    if (mimeType.includes('word') || /doc|docx/i.test(ext)) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    return <FileCode className="w-8 h-8 text-indigo-500" />;
  };

  const filteredFiles = files.filter((f) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!f.originalName.toLowerCase().includes(q) && !f.uploadedByName?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedType !== 'ALL') {
      if (selectedType === 'PDF' && !f.originalName.toLowerCase().endsWith('.pdf')) return false;
      if (selectedType === 'DOC' && !/(doc|docx)$/i.test(f.originalName)) return false;
      if (selectedType === 'EXCEL' && !/(xls|xlsx|csv)$/i.test(f.originalName)) return false;
      if (selectedType === 'IMAGE' && !/(png|jpg|jpeg|webp)$/i.test(f.originalName)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              คลังเอกสารและไฟล์แนบโครงการ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ศูนย์รวมหนังสือราชการ เอกสารโครงการ และไฟล์แนบกิจกรรมทั้งหมด
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์ หรือผู้อัปโหลด..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'PDF', label: 'PDF' },
            { id: 'DOC', label: 'Word' },
            { id: 'EXCEL', label: 'Excel' },
            { id: 'IMAGE', label: 'รูปภาพ' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedType === t.id
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">ไม่พบเอกสารตามเงื่อนไขที่ค้นหา</p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const ext = file.originalName.split('.').pop() || '';
            const sizeKb = (file.size / 1024).toFixed(1);
            return (
              <div
                key={file.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {getFileIcon(file.mimeType, ext)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sizeKb} KB • {ext.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>ผู้อัปโหลด: {file.uploadedByName || 'ครูผู้รับผิดชอบ'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(file.createdAt).toLocaleDateString('th-TH')}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>กดดูไฟล์</span>
                  </button>

                  <a
                    href={file.dataUrl || `/api/files/download/${file.fileName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="ดาวน์โหลด"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="ลบไฟล์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
