import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Appointment, User } from '../../types/index';
import { Calendar, Clock, User as UserIcon, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColor: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
};

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelId, setCancelId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const fetchAppointments = async () => {
    try {
      const url = filter === 'all' ? '/appointments' : `/appointments?status=${filter}`;
      const res = await api.get(url);
      setAppointments(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    try {
      await api.put(`/appointments/${cancelId}/cancel`, { reason: cancelReason });
      toast.success('Appointment cancelled');
      setCancelId('');
      setCancelReason('');
      fetchAppointments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 mt-1">Manage all your appointments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => {
            const doctor = appt.doctorId as User;
            return (
              <div key={appt._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Dr. {doctor?.fullName}</p>
                      <p className="text-sm text-blue-600">{doctor?.doctorProfile?.specialization}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{appt.reasonForVisit}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar size={14} />
                      {format(new Date(appt.scheduledDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock size={14} />
                      {appt.scheduledTime}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>

                  {appt.status === 'scheduled' && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => setCancelId(appt._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
                        <XCircle size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Cancel Appointment</h3>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setCancelId(''); setCancelReason(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Keep Appointment
              </button>
              <button onClick={handleCancel}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;