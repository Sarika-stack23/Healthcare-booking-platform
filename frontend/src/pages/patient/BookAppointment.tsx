import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { User } from '../../types';
import { Calendar, Clock, User as UserIcon, ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

const FEES  = [300, 400, 500, 600, 700, 800];
const SPECS = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Pediatrician', 'Orthopedic Surgeon', 'Neurologist', 'ENT Specialist',
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

const generateFallbackSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const dates = Array.from({ length: 21 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM dd'), day: d.getDay() };
  })
    .slice(0, 10);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/users/doctors/${doctorId}`);
        setDoctor(res.data.data.doctor as User);
      } catch {
        toast.error('Doctor not found');
        navigate('/doctors');
      }
    };
    if (doctorId) void fetchDoctor();
  }, [doctorId, navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setUsingFallback(false);
      setSelectedSlot('');
      try {
        const res = await api.get(`/doctors/${doctorId}/available-slots?date=${selectedDate}`);
        const apiSlots: string[] = res.data.data?.slots ?? [];
        if (apiSlots.length > 0) {
          setSlots(apiSlots);
        } else {
          setSlots(generateFallbackSlots());
          setUsingFallback(true);
        }
      } catch {
        setSlots(generateFallbackSlots());
        setUsingFallback(true);
      } finally {
        setSlotsLoading(false);
      }
    };
    void fetchSlots();
  }, [selectedDate, doctorId]);

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/appointments', {
        doctorId,
        scheduledDate: selectedDate,
        scheduledTime: selectedSlot,
        reasonForVisit: reason,
        type: 'consultation',
      });
      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(axiosMsg ?? 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const displayName = doctor ? getDoctorName(doctor) : '';
  const displaySpec = doctor ? (doctor.doctorProfile?.specialization?.trim() || pick(SPECS, doctor._id)) : '';
  const displayFee  = doctor ? (doctor.doctorProfile?.consultationFee || pick(FEES, doctor._id)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/doctors')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition">
        <ChevronLeft size={18} /> Back to Doctors
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>

      {doctor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-xl">
              {displayName === 'Doctor' ? 'DR' : displayName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Dr. {displayName}</h2>
            <p className="text-blue-600 text-sm">{displaySpec}</p>
            <p className="text-gray-500 text-sm mt-0.5">₹{displayFee} per consultation</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Date */}
        <div>
          <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
            <Calendar size={18} className="text-blue-600" /> Select Date
          </label>
          <div className="grid grid-cols-5 gap-2">
            {dates.map(({ value, label }) => (
              <button key={value} onClick={() => setSelectedDate(value)}
                className={`p-2.5 rounded-lg text-xs font-medium border transition ${
                  selectedDate === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Clock size={18} className="text-blue-600" /> Select Time
            </label>

            {usingFallback && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 mb-3">
                <AlertCircle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Doctor hasn&apos;t set their schedule yet. Showing standard slots —
                  availability will be confirmed after booking.
                </p>
              </div>
            )}

            {slotsLoading ? (
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {slots.map(slot => (
                  <button key={slot} onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="flex items-center gap-2 font-medium text-gray-900 mb-2">
            <UserIcon size={18} className="text-blue-600" /> Reason for Visit
          </label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Describe your symptoms or reason for visit..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>

        {/* Summary */}
        {selectedDate && selectedSlot && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">Booking Summary</p>
            <div className="space-y-1">
              <p className="text-blue-700">📅 {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM dd yyyy')}</p>
              <p className="text-blue-700">⏰ {selectedSlot}</p>
              <p className="text-blue-700">👨‍⚕️ {displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`}</p>
              <p className="text-blue-700">💰 ₹{displayFee}</p>
            </div>
          </div>
        )}

        <button onClick={handleBook}
          disabled={loading || !selectedDate || !selectedSlot || !reason.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
};

export default BookAppointment;