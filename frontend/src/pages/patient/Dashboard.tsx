import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import type { Appointment, User } from '../../types/index';
import { Calendar, Clock, User as UserIcon, FileText, Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/appointments?limit=5');
        const appts: Appointment[] = res.data.data;
        setAppointments(appts);
        setStats({
          total: res.data.pagination?.total ?? appts.length,
          upcoming: appts.filter((a) => a.status === 'scheduled').length,
          completed: appts.filter((a) => a.status === 'completed').length,
          cancelled: appts.filter((a) => a.status === 'cancelled').length,
        });
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const statusColor = (status: string) => ({
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    rescheduled: 'bg-yellow-100 text-yellow-700',
  }[status] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.firstName}! 👋</h1>
          <p className="text-gray-500 mt-1">Here&apos;s your health summary</p>
        </div>
        <Link to="/doctors"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
          <Plus size={18} /> Book Appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'blue' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'indigo' },
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

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Appointments</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={40} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No appointments yet</p>
                <Link to="/doctors" className="text-blue-600 text-sm hover:underline mt-1 block">Book your first appointment</Link>
              </div>
            ) : appointments.map((appt) => {
              const doctor = appt.doctorId as User;
              return (
                <div key={appt._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dr. {doctor?.fullName || 'Doctor'}</p>
                      <p className="text-xs text-gray-500">{doctor?.doctorProfile?.specialization}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{appt.scheduledTime}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(appt.scheduledDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/doctors', icon: UserIcon, label: 'Find a Doctor', color: 'blue' },
                { to: '/appointments', icon: Calendar, label: 'My Appointments', color: 'indigo' },
                { to: '/records', icon: FileText, label: 'Medical Records', color: 'green' },
                { to: '/profile', icon: UserIcon, label: 'Edit Profile', color: 'gray' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                  <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon size={16} className={`text-${color}-600`} />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <UserIcon size={24} className="text-white" />
            </div>
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-blue-200 text-sm capitalize">{user?.role}</p>
            <p className="text-blue-200 text-sm mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;