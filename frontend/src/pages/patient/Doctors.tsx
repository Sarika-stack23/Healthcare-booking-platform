import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
;
import { Search, Star, Clock, DollarSign } from 'lucide-react';

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
      } catch {} finally { setLoading(false); }
    };
    fetchDoctors();
  }, []);

  const filtered = doctors.filter(d =>
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.doctorProfile?.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Browse and book appointments with our specialists</p>
      </div>

      {/* Search */}
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
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(doctor => (
            <div key={doctor._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-xl">
                    {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">Dr. {doctor.fullName}</h3>
                <p className="text-blue-600 text-sm">{doctor.doctorProfile?.specialization}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>4.8 (120 reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>30 min slots</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DollarSign size={14} />
                  <span>₹{doctor.doctorProfile?.consultationFee} per visit</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/book/${doctor._id}`)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;