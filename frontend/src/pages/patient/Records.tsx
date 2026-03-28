import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/axios';
import type { MedicalRecord } from '../../types';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const recordTypeColors: Record<string, string> = {
  lab_report: 'bg-blue-100 text-blue-700',
  prescription: 'bg-green-100 text-green-700',
  imaging: 'bg-purple-100 text-purple-700',
  discharge_summary: 'bg-orange-100 text-orange-700',
  consultation_note: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

const Records = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('lab_report');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fixed: wrapped in useCallback — stable reference across renders
  const fetchRecords = useCallback(async () => {
    try {
      const res = await api.get('/records');
      setRecords(res.data.data);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  // Fixed: close upload modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUpload) closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showUpload]);

  const closeModal = () => {
    setShowUpload(false);
    setTitle('');
    setDescription('');
    setFile(null);
    setRecordType('lab_report');
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Title and file are required');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('recordType', recordType);
      formData.append('description', description);
      await api.post('/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Record uploaded!');
      closeModal();
      void fetchRecords();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(axiosMsg ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/records/${id}/download`);
      window.open(res.data.data.url as string, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(`/records/${id}`);
      toast.success('Record deleted');
      void fetchRecords();
    } catch {
      toast.error('Delete failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-500 mt-1">Your health documents in one place</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Upload size={18} /> Upload Record
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FileText size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No records yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload your first medical document</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {records.map(record => (
            <div
              key={record._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.title}</p>
                    <p className="text-xs text-gray-400">{record.file.originalName}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    recordTypeColors[record.recordType] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {record.recordType.replace('_', ' ')}
                </span>
              </div>

              {record.description && (
                <p className="text-sm text-gray-500 mb-3">{record.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>{formatSize(record.file.size)}</span>
                <span>{format(new Date(record.createdAt), 'MMM dd, yyyy')}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(record._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => handleDelete(record._id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal — Fixed: backdrop click + Escape key to close */}
      {showUpload && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Medical Record</h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Record title *"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              <select
                value={recordType}
                onChange={e => setRecordType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {[
                  'lab_report',
                  'prescription',
                  'imaging',
                  'discharge_summary',
                  'consultation_note',
                  'other',
                ].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
              >
                {file ? (
                  <p className="text-sm text-green-600 font-medium">✓ {file.name}</p>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to select file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX (max 10MB)</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;