import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeSymptoms } from '../services/symptomService.js';
import { SYMPTOMS_LIST } from '../utils/constants.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Stethoscope, Activity, Sparkles, Sun, Moon, CloudSun, Pill, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react';

const SymptomChecker = () => {
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState({ age: '', sex: 'Male', weight: '' });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({
    feverAbove104: 'No',
    fatigueWeakness: 'No',
    durationMoreThan3Days: 'No',
    takenOtherMedicine: 'No'
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!personalData.age || !personalData.weight) {
        setError('Complete formal details before proceeding.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedSymptoms.length === 0) {
        setError('Identification of symptoms is required.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleAnalysis();
    }
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      const formattedData = {
        symptoms: selectedSymptoms,
        personalData: {
          age: parseInt(personalData.age),
          sex: personalData.sex.toLowerCase(),
          weight: parseFloat(personalData.weight)
        },
        followUpAnswers: {
          feverAbove104: followUpAnswers.feverAbove104 === 'Yes',
          fatigueWeakness: followUpAnswers.fatigueWeakness === 'Yes',
          durationMoreThan3Days: followUpAnswers.durationMoreThan3Days === 'Yes',
          takenOtherMedicine: followUpAnswers.takenOtherMedicine === 'Yes'
        }
      };

      const response = await analyzeSymptoms(formattedData);

      if (response.success) {
        setAnalysis(response.data);
        setStep(4);
      } else {
        setError(response.error || 'Diagnostic intelligence failed.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const msg = err.response?.data?.error || err.message || 'Analysis infrastructure unavailable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSymptoms([]);
    setAnalysis(null);
    setError('');
    setPersonalData({ age: '', sex: 'Male', weight: '' });
    setFollowUpAnswers({
      feverAbove104: 'No',
      fatigueWeakness: 'No',
      durationMoreThan3Days: 'No',
      takenOtherMedicine: 'No'
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-6xl">
          Symptoms <span className="text-gradient">Wizard</span>
        </h1>
        <p className="text-[#c6ac8fcc] font-medium tracking-wide">
          Step {step} of 4: {
            step === 1 ? 'Formal Identification' :
              step === 2 ? 'Symptom Deposition' :
                step === 3 ? 'Diagnostic Context' : 'Intelligence Results'
          }
        </p>

        <div className="mt-8 h-1.5 bg-[#22333b] rounded-full max-w-xs mx-auto overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#5e503f] to-[#c6ac8f] transition-all duration-700 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <Card className="animate-slide-up border-[#5e503f]/20" hover={false}>
        {step === 1 && (
          <div className="space-y-10 p-4">
            <div className="border-b border-[#5e503f]/20 pb-6">
              <h2 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">1. Formal Profile</h2>
              <p className="text-xs text-[#5e503f] font-black tracking-widest uppercase mt-2">Required for clinical accuracy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="AGE"
                type="number"
                placeholder="25"
                value={personalData.age}
                onChange={(e) => setPersonalData({ ...personalData, age: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-black text-[#c6ac8f] uppercase tracking-widest ml-1">SEX</label>
                <select
                  value={personalData.sex}
                  onChange={(e) => setPersonalData({ ...personalData, sex: e.target.value })}
                  className="w-full px-5 py-3.5 bg-[#0a0908]/60 border border-[#5e503f]/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#c6ac8f]/10 text-[#eae0d5] font-black transition-all"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <Input
                label="WEIGHT (KG)"
                type="number"
                placeholder="70"
                value={personalData.weight}
                onChange={(e) => setPersonalData({ ...personalData, weight: e.target.value })}
                className="md:col-span-2"
                required
              />
            </div>

            <div className="pt-8 flex justify-end">
              <Button onClick={nextStep} size="lg" className="w-full md:w-auto tracking-widest">
                ADVANCE PHASE →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 p-4">
            <div className="border-b border-[#5e503f]/20 pb-6">
              <h2 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">2. Symptom Selection</h2>
              <p className="text-xs text-[#5e503f] font-black tracking-widest uppercase mt-2">Specify all relevant discomforts.</p>
            </div>

            <div className="flex flex-wrap gap-4">
              {SYMPTOMS_LIST.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${selectedSymptoms.includes(symptom)
                    ? 'bg-[#c6ac8f] text-[#0a0908] shadow-[0_10px_30px_rgba(198,172,143,0.3)] scale-105'
                    : 'bg-[#0a0908]/60 text-[#c6ac8fcc] hover:text-[#eae0d5] border border-[#5e503f]/40 hover:border-[#c6ac8f]/50'
                    }`}
                >
                  {symptom}
                </button>
              ))}
            </div>

            <div className="pt-8 flex gap-4 justify-between">
              <Button variant="ghost" onClick={prevStep} className="tracking-widest">
                ← REVERT
              </Button>
              <Button onClick={nextStep} className="w-full md:w-auto tracking-widest">
                ADVANCE PHASE →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 p-4">
            <div className="border-b border-[#5e503f]/20 pb-6">
              <h2 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">3. Clinical Context</h2>
              <p className="text-xs text-[#5e503f] font-black tracking-widest uppercase mt-2">Deeper inquiry for severity calibration.</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'feverAbove104', label: 'Does fever exceed 104°F?' },
                { key: 'fatigueWeakness', label: 'Unnatural fatigue or weakness?' },
                { key: 'durationMoreThan3Days', label: 'Duration exceeds 72 hours?' },
                { key: 'takenOtherMedicine', label: 'Concurrent medication use?' },
              ].map((q) => (
                <div key={q.key} className="flex items-center justify-between bg-[#0a0908]/40 p-6 rounded-3xl border border-[#5e503f]/20 hover:border-[#c6ac8f]/30 transition-all duration-300">
                  <span className="text-xs font-black text-[#eae0d5] uppercase tracking-widest pr-4">{q.label}</span>
                  <div className="flex gap-3 shrink-0">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFollowUpAnswers({ ...followUpAnswers, [q.key]: opt })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${followUpAnswers[q.key] === opt
                          ? 'bg-[#c6ac8f] text-[#0a0908] shadow-lg'
                          : 'bg-[#22333b]/40 text-[#5e503f] border border-[#5e503f]/30 hover:text-[#c6ac8f]'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 flex gap-4 justify-between">
              <Button variant="ghost" onClick={prevStep} disabled={loading} className="tracking-widest">
                ← REVERT
              </Button>
              <Button onClick={nextStep} isLoading={loading} className="w-full md:w-auto tracking-[0.2em]">
                INITIATE ANALYSIS
              </Button>
            </div>
          </div>
        )}

        {step === 4 && analysis && (
          <div className="space-y-12 animate-slide-up p-4">
            <div className="text-center">
              <h2 className="text-4xl font-black text-[#eae0d5] uppercase tracking-tighter mb-4 italic">Analysis Finalized</h2>
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest ${analysis.severity === 'High' ? 'bg-red-950/20 text-red-500 border border-red-900/40' :
                analysis.severity === 'Moderate' ? 'bg-amber-950/20 text-amber-500 border border-amber-900/40' :
                  'bg-emerald-950/20 text-emerald-500 border border-emerald-900/40'
                }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
                Classification: {analysis.severity}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-[#5e503f] uppercase tracking-[0.4em] text-center border-b border-[#5e503f]/20 pb-4">
                Recommended Protocols
              </h3>
              <div className="grid gap-6">
                {analysis.recommendations.medicines.map((med, idx) => (
                  <div key={idx} className="bg-[#22333b]/40 p-8 rounded-[2.5rem] border border-[#5e503f]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-8 hover:bg-[#22333b]/60 transition-all duration-500">
                    <div className="space-y-2">
                      <h4 className="font-black text-[#eae0d5] text-2xl uppercase tracking-tighter italic">{med.name}</h4>
                      <p className="text-xs font-bold text-[#c6ac8f] uppercase tracking-widest">
                        DOSAGE: {med.dosage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="bg-[#0a0908]/60 px-5 py-3 rounded-2xl border border-[#c6ac8f]/20 shadow-inner">
                        <span className="text-[10px] font-black text-[#eae0d5] uppercase tracking-widest">
                          {med.timing?.join('   •   ') || med.frequency}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[#c6ac8fcc] font-black uppercase text-[9px] tracking-widest">
                        {med.timing?.map((t, i) => (
                          <span key={i} className="bg-[#0a0908]/40 px-2 py-1 rounded border border-[#5e503f]/30">
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#c6ac8f]/5 p-8 rounded-3xl border border-[#c6ac8f]/10 shadow-inner">
                <h3 className="font-black text-[#c6ac8f] text-[10px] uppercase tracking-[0.3em] mb-4">Phase Completion</h3>
                <p className="text-[#eae0d5] text-lg font-bold leading-tight uppercase italic">
                  Monitor status until {new Date(analysis.recommendations.followUpDate).toLocaleDateString()}.
                </p>
              </div>

              {(analysis.recommendations.teleconsultationRecommended || analysis.severity === 'High') && (
                <div className="bg-red-950/10 p-8 rounded-3xl border border-red-900/20 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-red-400 text-[10px] uppercase tracking-[0.3em] mb-4">Clinical Necessity</h3>
                    <p className="text-red-200 text-sm font-bold uppercase tracking-tight mb-6">
                      High-depth consultation required.
                    </p>
                  </div>
                  <Button variant="danger" className="w-full tracking-widest" onClick={() => navigate('/teleconsultation')}>
                    SECURE APPOINTMENT
                  </Button>
                </div>
              )}
            </div>

            <Button variant="ghost" className="w-full border-dashed border-[#5e503f]/40 font-black uppercase tracking-widest text-[#5e503f] hover:text-[#c6ac8f] transition-all" onClick={handleReset}>
              INITIATE NEW PHASE
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SymptomChecker;
