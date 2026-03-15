import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import type { Appointment } from '../../types/index';
import { Calendar, CheckCircle, Clock, XCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments?limit=20');
      setAppointments(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      await api.put(`/appointments/${id}/complete`, { notes: 'Consultation completed' });
      toast.success('Marked as completed');
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setCompleting(''); }
  };

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, Dr. {user?.firstName}! 👨‍⚕️</h1>
        <p className="text-gray-500 mt-1">Manage your appointments and schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'blue' },
          { label: 'Upcoming', value: stats.scheduled, icon: Clock, color: 'indigo' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Appointments</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No appointments yet</div>
          ) : appointments.map(appt => {
            const patient = appt.patientId as any;
            return (
              <div key={appt._id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{patient?.fullName}</p>
                    <p className="text-xs text-gray-500">{appt.reasonForVisit}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium">{appt.scheduledTime}</p>
                  <p className="text-xs text-gray-400">{format(new Date(appt.scheduledDate), 'MMM dd')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[appt.status]}`}>
                    {appt.status}
                  </span>
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => handleComplete(appt._id)}
                      disabled={completing === appt._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                      <CheckCircle size={12} />
                      {completing === appt._id ? '...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
