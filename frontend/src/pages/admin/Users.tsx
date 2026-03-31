import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { User, Appointment } from '../../types/index';
import { Search, UserIcon, Stethoscope, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

const Users = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'patients' | 'doctors'>('patients');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/appointments?limit=200'),
          api.get('/users/doctors'),
        ]);
        setDoctors(dRes.data.data);
        // Extract unique patients from appointments
        const seen = new Set<string>();
        const patientList: User[] = [];
        (pRes.data.data as Appointment[]).forEach((a) => {
          const p = a.patientId as User;
          if (p?._id && !seen.has(p._id)) {
            seen.add(p._id);
            patientList.push(p);
          }
        });
        setPatients(patientList);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const handleTabChange = (t: 'patients' | 'doctors') => {
    setTab(t);
    setSearch('');
    setPage(1);
  };

  const list = tab === 'doctors' ? doctors : patients;
  const filtered = list.filter(u =>
    `${u.firstName ?? ''} ${u.lastName ?? ''} ${u.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const roleIcon = (role?: string) => {
    if (role === 'doctor') return <Stethoscope size={14} className="text-purple-600" />;
    if (role === 'admin')  return <ShieldCheck  size={14} className="text-red-600"    />;
    return <UserIcon size={14} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage all registered users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['patients', 'doctors'] as const).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t} ({t === 'doctors' ? doctors.length : patients.length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="h-3.5 bg-gray-200 rounded w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-40 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-16 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-full w-14 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-24 animate-pulse" /></td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  {search ? 'No users match your search' : 'No users found'}
                </td>
              </tr>
            ) : (
              paginated.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 flex-shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {roleIcon(u.role)}
                      <span className="text-sm capitalize text-gray-700">
                        {u.role || tab.slice(0, -1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
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
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;