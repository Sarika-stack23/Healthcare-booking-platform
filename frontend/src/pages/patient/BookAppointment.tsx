import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { User } from '../../types';
import { Calendar, Clock, User as UserIcon, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

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

  // Generate next 10 working days (skip weekends)
  const dates = Array.from({ length: 21 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE, MMM dd'),
      day: d.getDay(),
    };
  })
    .filter(d => d.day !== 0 && d.day !== 6)
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
    fetchDoctor();
  }, [doctorId, navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot('');
      try {
        const res = await api.get(
          `/doctors/${doctorId}/available-slots?date=${selectedDate}`
        );
        setSlots(res.data.data.slots as string[]);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/doctors')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition"
      >
        <ChevronLeft size={18} /> Back to Doctors
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>

      {/* Doctor Info */}
      {doctor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-xl">
              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Dr. {doctor.fullName}</h2>
            <p className="text-blue-600">{doctor.doctorProfile?.specialization}</p>
            <p className="text-gray-500 text-sm">
              ₹{doctor.doctorProfile?.consultationFee} per consultation
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
            <Calendar size={18} className="text-blue-600" /> Select Date
          </label>
          <div className="grid grid-cols-5 gap-2">
            {dates.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedDate(value)}
                className={`p-2.5 rounded-lg text-xs font-medium border transition ${
                  selectedDate === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
              <Clock size={18} className="text-blue-600" /> Select Time
            </label>
            {slotsLoading ? (
              <p className="text-gray-400 text-sm">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-500 text-sm">No slots available for this date</p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                      selectedSlot === slot
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                    }`}
                  >
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
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe your symptoms or reason for visit..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>

        {/* Summary — Fixed: T00:00:00 appended to avoid UTC timezone off-by-one */}
        {selectedDate && selectedSlot && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-1">Booking Summary</p>
            <p className="text-blue-700">
              📅 {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM dd yyyy')}
            </p>
            <p className="text-blue-700">⏰ {selectedSlot}</p>
            <p className="text-blue-700">💰 ₹{doctor?.doctorProfile?.consultationFee}</p>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={loading || !selectedDate || !selectedSlot || !reason.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
};

export default BookAppointment;