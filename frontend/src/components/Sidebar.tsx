import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Calendar, Users, FileText,
  Clock, UserCircle, BarChart3, ShieldCheck
} from 'lucide-react';

const patientLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctors', icon: Users, label: 'Find Doctors' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/records', icon: FileText, label: 'Medical Records' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

const doctorLinks = [
  { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/doctor/schedule', icon: Clock, label: 'My Schedule' },
  { to: '/doctor/profile', icon: UserCircle, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

const Sidebar = () => {
  const { user } = useAuthStore();

  const links =
    user?.role === 'doctor' ? doctorLinks :
    user?.role === 'admin' ? adminLinks :
    patientLinks;

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 p-4 flex flex-col">
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-xs text-gray-500">Secure Connection</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;