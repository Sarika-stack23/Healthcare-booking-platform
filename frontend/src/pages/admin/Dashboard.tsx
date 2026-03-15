import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, Calendar, CheckCircle, XCircle, UserCheck, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, usersRes] = await Promise.all([
          api.get('/appointments?limit=100'),
          api.get('/users/doctors'),
        ]);
        setAppointments(apptRes.data.data);
        setUsers(usersRes.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const stats = {
    totalAppointments: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    doctors: users.length,
  };

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    rescheduled: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'blue' },
          { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'indigo' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red' },
          { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-600`} />
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
              <div className="p-6 text-center text-gray-400">Loading...</div>
            ) : appointments.slice(0, 10).map(appt => {
              const patient = appt.patientId as any;
              const doctor = appt.doctorId as any;
              return (
                <div key={appt._id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{patient?.fullName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Dr. {doctor?.fullName} • {appt.scheduledTime} • {format(new Date(appt.scheduledDate), 'MMM dd')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Registered Doctors</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {users.map(doc => (
              <div key={doc._id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-medium text-sm">
                    {doc.firstName?.[0]}{doc.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                  <p className="text-xs text-gray-500">{doc.doctorProfile?.specialization}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${doc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
