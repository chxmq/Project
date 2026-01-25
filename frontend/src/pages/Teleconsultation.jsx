import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Hospital, User, Calendar, Clock, Link as LinkIcon, ChevronLeft, Star, Activity } from 'lucide-react';

const Teleconsultation = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mock doctor data
  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'General Medicine',
      experience: '15 years',
      rating: 4.8,
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Internal Medicine',
      experience: '12 years',
      rating: 4.9,
      availableSlots: ['10:00', '11:00', '13:00', '14:00', '16:00']
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Family Medicine',
      experience: '10 years',
      rating: 4.7,
      availableSlots: ['09:00', '10:30', '12:00', '15:00', '16:30']
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialty: 'Pediatrics',
      experience: '18 years',
      rating: 4.9,
      availableSlots: ['09:30', '11:00', '13:30', '14:30', '15:30']
    }
  ];

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      alert('Please select a doctor, date, and time');
      return;
    }

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Appointment scheduled with ${selectedDoctor.name} on ${appointmentDate} at ${appointmentTime}`);
      setSelectedDoctor(null);
      setAppointmentDate('');
      setAppointmentTime('');
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-7xl leading-tight">
          Tele<span className="text-gradient">consultation</span>
        </h1>
        <p className="text-lg text-[#c6ac8fcc] max-w-2xl mx-auto font-medium tracking-wide uppercase italic">
          High-depth specialty guidance via unyielding digital infrastructure.
        </p>
      </div>

      <Card className="bg-[#22333b]/20 border-[#c6ac8f]/10 mb-10" hover={false}>
        <p className="text-[#c6ac8f] text-sm font-black uppercase tracking-[0.2em] text-center italic">
          Schedule a 5-minute specialty phase with our formal healthcare professionals.
        </p>
      </Card>

      {!selectedDoctor ? (
        <div className="animate-slide-up">
          <h2 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tighter mb-8 italic">Choose Consultant</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="hover:bg-[#22333b]/40 transition-all duration-700 cursor-pointer border-[#5e503f]/20"
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tight italic">{doctor.name}</h3>
                  <span className="bg-[#5e503f]/40 text-[#eae0d5] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#5e503f]/50 shadow-sm flex items-center gap-1">
                    <Activity size={10} /> {doctor.experience}
                  </span>
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest">Protocol:</span>
                    <span className="text-sm font-bold text-[#eae0d5] uppercase italic flex items-center gap-2">
                      <Hospital size={14} className="text-[#5e503f]" /> {doctor.specialty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest">Rating:</span>
                    <span className="text-sm font-bold text-[#eae0d5]">⭐ {doctor.rating}/5.0</span>
                  </div>
                </div>
                <Button className="w-full tracking-widest font-black" onClick={() => setSelectedDoctor(doctor)}>
                  SECURE CONSULTANT
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="animate-slide-up border-[#5e503f]/20 p-10 max-w-2xl mx-auto" hover={false}>
          <div className="mb-10">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="text-[#5e503f] hover:text-[#c6ac8f] font-black uppercase tracking-widest text-xs transition-colors"
            >
              ← REVERT TO REGISTRY
            </button>
            <h2 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic mt-6">
              PHASE SCHEDULING
            </h2>
            <p className="text-[#c6ac8f] font-bold uppercase tracking-widest text-sm mt-1">{selectedDoctor.name.toUpperCase()} / {selectedDoctor.specialty.toUpperCase()}</p>
          </div>

          <form onSubmit={handleBookAppointment}>
            <div className="space-y-8">
              <div>
                <label htmlFor="date" className="block text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-3">
                  COMMIT DATE
                </label>
                <input
                  type="date"
                  id="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-5 py-3.5 bg-[#0a0908]/60 border border-[#5e503f]/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#c6ac8f]/10 text-[#eae0d5] font-black transition-all"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-3">
                  COMMIT TEMPORAL SLOT
                </label>
                <select
                  id="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-[#0a0908]/60 border border-[#5e503f]/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#c6ac8f]/10 text-[#eae0d5] font-black transition-all"
                >
                  <option value="" disabled className="bg-[#0a0908]">SELECT SLOT</option>
                  {selectedDoctor.availableSlots.map((slot) => (
                    <option key={slot} value={slot} className="bg-[#0a0908]">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#c6ac8f]/5 border border-[#c6ac8f]/10 rounded-2xl p-6 shadow-inner">
                <h3 className="font-black text-[#c6ac8f] text-[10px] uppercase tracking-[0.3em] mb-4">Phase Protocols</h3>
                <ul className="text-[10px] text-[#eae0d5] font-bold uppercase tracking-widest space-y-2 opacity-80">
                  <li>• Consultation duration: 300 SECONDS</li>
                  <li>• Digital link delivered via secure node</li>
                  <li>• Post-phase follow-up availability verified</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full tracking-[0.2em] py-4"
              >
                {submitting ? <LoadingSpinner size="sm" /> : 'SECURE APPOINTMENT'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Teleconsultation;
