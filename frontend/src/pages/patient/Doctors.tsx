import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { User } from '../../types/index';
import { Search, Star, Clock, DollarSign, UserCircle } from 'lucide-react';

const RATINGS       = [4.6, 4.7, 4.8, 4.9, 5.0];
const REVIEW_COUNTS = [58, 76, 87, 102, 120, 143, 210];
const FEES          = [300, 400, 500, 600, 700, 800];
const SPECS         = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Pediatrician', 'Orthopedic Surgeon', 'Neurologist', 'ENT Specialist',
];
const AVATAR_COLORS = [
  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { bg: 'bg-purple-100', text: 'text-purple-700'  },
  { bg: 'bg-green-100',  text: 'text-green-700'   },
  { bg: 'bg-orange-100', text: 'text-orange-700'  },
  { bg: 'bg-pink-100',   text: 'text-pink-700'    },
  { bg: 'bg-teal-100',   text: 'text-teal-700'    },
];

const pick = <T,>(arr: T[], id: string, offset = 0): T =>
  arr[(id.charCodeAt(id.length - 1 - offset) || 0) % arr.length];

const getDoctorName = (d: User): string => {
  if (d.fullName?.trim()) return d.fullName.trim();
  const f = d.firstName?.trim() ?? '';
  const l = d.lastName?.trim()  ?? '';
  if (f || l) return `${f} ${l}`.trim();
  return 'Doctor';
};

const getInitials = (d: User): string => {
  const name = getDoctorName(d);
  if (name === 'Doctor') return 'DR';
  const parts = name.split(' ').filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/users/doctors');
        setDoctors(res.data.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    void fetchDoctors();
  }, []);

  const filtered = doctors.filter(d => {
    const name = getDoctorName(d).toLowerCase();
    const spec = (d.doctorProfile?.specialization?.trim() || pick(SPECS, d._id)).toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || spec.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Browse and book appointments with our specialists</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or specialization..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-gray-100">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2 mx-6" />
              <div className="h-3 bg-gray-100 rounded mx-10 mb-5" />
              <div className="space-y-2.5">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UserCircle size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'No doctors match your search' : 'No doctors registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(doctor => {
            const name  = getDoctorName(doctor);
            const inits = getInitials(doctor);
            const spec  = doctor.doctorProfile?.specialization?.trim() || pick(SPECS, doctor._id);
            const fee   = doctor.doctorProfile?.consultationFee        || pick(FEES, doctor._id);
            const rat   = pick(RATINGS, doctor._id);
            const rev   = pick(REVIEW_COUNTS, doctor._id, 1);
            const col   = pick(AVATAR_COLORS, doctor._id, 2);

            return (
              <div
                key={doctor._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition flex flex-col"
              >
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 ${col.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className={`${col.text} font-bold text-xl`}>{inits}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-tight">Dr. {name}</h3>
                  <p className="text-blue-600 text-sm mt-0.5">{spec}</p>
                </div>

                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <span>{rat} <span className="text-gray-400">({rev} reviews)</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    <span>30 min consultation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                    <span>₹{fee} per visit</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/book/${doctor._id}`)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Book Appointment
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Doctors;