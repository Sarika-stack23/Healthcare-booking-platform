import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import type { Appointment } from '../../types';
import { Calendar, Clock, User, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColorMap: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
};

const PAGE_SIZE = 8;

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/appointments?limit=100' : `/appointments?status=${filter}&limit=100`;
      const res = await api.get(url);
      setAppointments(res.data.data);
      setPage(1);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  // Escape key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cancelId) closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cancelId]);

  const closeModal = () => {
    setCancelId('');
    setCancelReason('');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/appointments/${cancelId}/cancel`, { reason: cancelReason });
      toast.success('Appointment cancelled');
      closeModal();
      void fetchAppointments();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(axiosMsg ?? 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  // Client-side search filter
  const filtered = appointments.filter(appt => {
    const doctor = appt.doctorId as { fullName?: string; doctorProfile?: { specialization?: string } };
    const q = search.toLowerCase();
    return (
      !q ||
      doctor?.fullName?.toLowerCase().includes(q) ||
      doctor?.doctorProfile?.specialization?.toLowerCase().includes(q) ||
      appt.reasonForVisit?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 mt-1">Manage all your appointments</p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSearch(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search doctor, reason..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-28" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-6 w-24 bg-gray-100 rounded-full self-start" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? 'No appointments match your search' : 'No appointments found'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(appt => {
              const doctor = appt.doctorId as {
                fullName?: string;
                doctorProfile?: { specialization?: string };
              };
              return (
                <div
                  key={appt._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">Dr. {doctor?.fullName}</p>
                        <p className="text-sm text-blue-600 truncate">{doctor?.doctorProfile?.specialization}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{appt.reasonForVisit}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-2 text-sm text-gray-600 mb-1">
                        <Calendar size={14} />
                        {/* Fixed: T00:00:00 appended */}
                        {format(new Date(appt.scheduledDate + 'T00:00:00'), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center justify-end gap-2 text-sm text-gray-600 mb-2">
                        <Clock size={14} />
                        {appt.scheduledTime}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColorMap[appt.status] ?? 'bg-gray-100 text-gray-700'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    {appt.status === 'scheduled' && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setCancelId(appt._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancel Modal — backdrop click + Escape key closes */}
      {cancelId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-1">Cancel Appointment</h3>
            <p className="text-sm text-gray-500 mb-4">Please tell us why you&apos;re cancelling.</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;