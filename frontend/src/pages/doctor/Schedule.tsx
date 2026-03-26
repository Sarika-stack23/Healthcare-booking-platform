import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const defaultSchedule = days.map(day => ({
  dayOfWeek: day,
  isAvailable: ['monday','tuesday','wednesday','thursday','friday'].includes(day),
  slots: [{ start: '09:00', end: '17:00' }],
}));

interface DaySchedule {
  dayOfWeek: string;
  isAvailable: boolean;
  slots: { start: string; end: string }[];
}

const Schedule = () => {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get(`/doctors/${user?._id}/availability`);
        if (res.data.data?.weeklySchedule?.length) {
          setSchedule(res.data.data.weeklySchedule);
        }
      } catch {}
    };
    if (user?._id) fetchSchedule();
  }, [user]);

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d, i) =>
      i === index ? { ...d, isAvailable: !d.isAvailable } : d
    ));
  };

  const updateSlot = (dayIndex: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIndex ? { ...d, slots: [{ ...d.slots[0], [field]: value }] } : d
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/doctors/${user?._id}/availability/weekly`, { schedule });
      toast.success('Schedule saved!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-500 mt-1">Set your weekly availability</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {schedule.map((day, index) => (
          <div key={day.dayOfWeek} className={`flex items-center justify-between p-4 ${!day.isAvailable ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleDay(index)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${day.isAvailable ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${day.isAvailable ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="font-medium text-gray-900 capitalize w-24">{day.dayOfWeek}</span>
            </div>

            {day.isAvailable && (
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <input type="time" value={day.slots[0]?.start || '09:00'}
                  onChange={e => updateSlot(index, 'start', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-400">to</span>
                <input type="time" value={day.slots[0]?.end || '17:00'}
                  onChange={e => updateSlot(index, 'end', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            {!day.isAvailable && (
              <span className="text-sm text-gray-400">Not Available</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">💡 Tip</p>
        <p>Appointments are booked in 30-minute slots within your working hours. Toggle days on/off to set your availability.</p>
      </div>
    </div>
  );
};

export default Schedule;