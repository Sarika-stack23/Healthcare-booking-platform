import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Appointment, User } from '../../types/index';
import { Calendar, CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

const statusColorMap: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
};

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, usersRes] = await Promise.all([
          api.get('/appointments?limit=100'),
          api.get('/users/doctors'),
        ]);
        setAppointments(apptRes.data.data);
        setDoctors(usersRes.data.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const stats = {
    totalAppointments: appointments.length,
    scheduled:  appointments.filter(a => a.status === 'scheduled').length,
    completed:  appointments.filter(a => a.status === 'completed').length,
    cancelled:  appointments.filter(a => a.status === 'cancelled').length,
    doctorCount: doctors.length,
  };

  // Fixed: static Tailwind classes — dynamic strings don't survive Tailwind's purge
  const statCards = [
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar,     bg: 'bg-blue-100',   text: 'text-blue-600'   },
    { label: 'Scheduled',          value: stats.scheduled,          icon: Calendar,     bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { label: 'Completed',          value: stats.completed,          icon: CheckCircle,  bg: 'bg-green-100',  text: 'text-green-600'  },
    { label: 'Cancelled',          value: stats.cancelled,          icon: XCircle,      bg: 'bg-red-100',    text: 'text-red-600'    },
    { label: 'Doctors',            value: stats.doctorCount,        icon: Stethoscope,  bg: 'bg-purple-100', text: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and management</p>
      </div>

      {/* Stats — all static classes */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={text} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Appointments</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex justify-between mb-1">
                    <div className="h-3.5 bg-gray-200 rounded w-32" />
                    <div className="h-5 bg-gray-100 rounded-full w-20" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-48 mt-1" />
                </div>
              ))
            ) : appointments.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No appointments</div>
            ) : (
              appointments.slice(0, 10).map(appt => {
                const patient = appt.patientId as User;
                const doctor  = appt.doctorId  as User;
                return (
                  <div key={appt._id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{patient?.fullName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[appt.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Dr. {doctor?.fullName} • {appt.scheduledTime} •{' '}
                      {/* Fixed: T00:00:00 appended */}
                      {format(new Date(appt.scheduledDate + 'T00:00:00'), 'MMM dd')}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Registered Doctors</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-36" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              ))
            ) : doctors.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No doctors registered</div>
            ) : (
              doctors.map(doc => (
                <div key={doc._id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-medium text-sm">
                      {doc.firstName?.[0]}{doc.lastName?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{doc.doctorProfile?.specialization}</p>
                  </div>
                  <span className={`ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-xs ${
                    doc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {doc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;