import { useState, useEffect } from 'react';
import { getLatestRecommendation, getSuggestions } from '../services/recommendationService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Sparkles, Pill, Calendar, AlertCircle, RefreshCw, ClipboardList, CheckCircle2 } from 'lucide-react';

function SuggestionsBlock({ recommendation }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setErr('');
    try {
      const symptoms = (recommendation?.symptomAnalysisId && typeof recommendation.symptomAnalysisId === 'object' && Array.isArray(recommendation.symptomAnalysisId.symptoms))
        ? recommendation.symptomAnalysisId.symptoms
        : [];
      const res = await getSuggestions({
        medicines: (recommendation?.medicines || []).map((m) => m.name),
        symptoms,
        query: 'Follow-up and self-care for my current medications'
      });
      if (res.success && res.data) {
        setSuggestions(res.data);
      }
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-[#5e503f]/20 bg-[#22333b]/40">
      <h2 className="text-xl font-black text-[#c6ac8f] mb-6 uppercase tracking-[0.2em] italic">AI Intelligence Suggestions</h2>
      {suggestions ? (
        <div className="space-y-6 animate-fade-in">
          <ul className="space-y-3">
            {(suggestions.suggestions || []).map((s, i) => (
              <li key={i} className="flex gap-4 items-start bg-[#0a0908]/40 p-4 rounded-2xl border border-[#5e503f]/10">
                <Sparkles size={14} className="text-[#c6ac8f] mt-1 shrink-0" />
                <span className="text-[11px] font-bold text-[#eae0d5] uppercase tracking-wider">{s}</span>
              </li>
            ))}
          </ul>
          {suggestions.followUpAdvice && (
            <div className="bg-[#c6ac8f]/5 p-5 rounded-2xl border border-[#c6ac8f]/10 mt-6 shadow-inner">
              <p className="text-[10px] font-black text-[#eae0d5] uppercase tracking-[0.1em]">
                <span className="text-[#c6ac8f] mr-2 italic">PROTOCOL:</span>
                {suggestions.followUpAdvice}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={fetchSuggestions}
            size="sm"
            className="mt-6 text-[10px] tracking-widest border-dashed opacity-60 hover:opacity-100"
          >
            RE-CALIBRATE SUGGESTIONS
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-[#5e503f] text-xs font-black uppercase tracking-widest mb-6 italic">Secure personalized guidance via Gemini node.</p>
          {err && <p className="text-red-400 text-[10px] font-black uppercase mb-4 tracking-tighter">{err}</p>}
          <Button
            onClick={fetchSuggestions}
            disabled={loading}
            isLoading={loading}
            className="w-full tracking-[0.2em]"
          >
            INITIALIZE AI CORE
          </Button>
        </div>
      )}
    </Card>
  );
}

const Recommendations = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {
    try {
      const response = await getLatestRecommendation();
      if (response.success) {
        setRecommendation(response.data);
        if (!response.data) {
          setError('No active recommendations identified. Phase completion required.');
        }
      } else {
        setError(response.error || 'No active recommendations identified. Phase completion required.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Analysis Server (5010) identification failed.');
      } else {
        setError(err.response?.data?.error || 'Intelligence retrieval failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px]">
        <LoadingSpinner size="lg" className="text-[#c6ac8f]" />
        <p className="mt-8 text-[#5e503f] font-black uppercase tracking-[0.5em] animate-pulse italic">Retrieving Protocols...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-7xl leading-tight">
          Clinical <span className="text-gradient">Registry</span>
        </h1>
        <p className="text-lg text-[#c6ac8fcc] max-w-2xl mx-auto font-medium tracking-wide uppercase italic">
          Sophisticated compilation of suggested protocols and AI-verified course of action.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {recommendation ? (
        <div className="space-y-12 animate-slide-up">
          {/* Medicines Group */}
          {recommendation.medicines && recommendation.medicines.length > 0 && (
            <Card className="border-[#c6ac8f]/10">
              <div className="flex items-center justify-between mb-8 border-b border-[#5e503f]/20 pb-6">
                <h2 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tight italic">Protocol Medicines</h2>
                <span className="bg-[#5e503f]/40 text-[#eae0d5] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#5e503f]/50">
                  {recommendation.medicines.length} ITEMS DEPLOYED
                </span>
              </div>
              <div className="grid gap-6">
                {recommendation.medicines.map((medicine, idx) => (
                  <div key={idx} className="p-8 bg-[#0a0908]/40 rounded-[2rem] border border-[#5e503f]/20 hover:border-[#c6ac8f]/30 transition-all duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                      <div className="space-y-3">
                        <h3 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">{medicine.name}</h3>
                        <div className="flex flex-wrap gap-2 text-[10px] font-black">
                          <div className="bg-[#5e503f]/50 px-4 py-2 rounded-xl text-[#eae0d5] uppercase tracking-widest border border-[#5e503f]/30">
                            DOSAGE: {medicine.dosage}
                          </div>
                          <div className="bg-[#22333b]/40 px-4 py-2 rounded-xl text-[#c6ac8f] uppercase tracking-widest border border-[#c6ac8f]/10 shadow-lg">
                            DURATION: {medicine.duration}
                          </div>
                        </div>
                      </div>
                      {medicine.timing && medicine.timing.length > 0 && (
                        <div className="bg-[#0a0908]/80 px-5 py-3 rounded-2xl border border-[#5e503f]/40 shadow-inner">
                          <span className="text-[9px] font-black text-[#c6ac8fcc] uppercase tracking-[0.2em]">
                            SCHEDULE: {medicine.timing.join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Follow-up Date */}
          {recommendation.followUpDate && (
            <Card className="bg-[#5e503f]/10 border-[#5e503f]/30 text-center py-12">
              <h2 className="text-sm font-black text-[#5e503f] uppercase tracking-[0.4em] mb-6">Review Temporal Goal</h2>
              <p className="text-4xl sm:text-5xl font-black text-[#eae0d5] uppercase tracking-tighter italic leading-none">
                {new Date(recommendation.followUpDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <div className="mt-8 mx-auto max-w-sm">
                <p className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest leading-relaxed opacity-60">
                  Mandatory clinical verification required on or before this designated timestamp to satisfy safety protocols.
                </p>
              </div>
            </Card>
          )}

          {/* AI Suggestions (Gemini) */}
          <SuggestionsBlock recommendation={recommendation} />

          {/* Important Notes */}
          <Card className="bg-red-950/5 border-red-900/10">
            <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.3em] mb-6 border-b border-red-900/10 pb-4">Critical Constraints</h3>
            <ul className="grid gap-4">
              {[
                'Adhere strictly to suggested course of action.',
                'Do not terminate medication cycles prematurely.',
                'Execute immediate consultation if severity escalates.',
                'Document and report all physiological variances.'
              ].map((note, i) => (
                <li key={i} className="flex gap-4 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/40"></div>
                  <span className="text-[10px] font-bold text-[#eae0d5]/70 uppercase tracking-widest">{note}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-20 border-dashed border-[#5e503f]/20">
          <p className="text-[#5e503f] font-black uppercase tracking-widest">
            Registry is empty. Complete a <Link to="/symptoms" className="text-[#c6ac8f] underline">Diagnostic Phase</Link> to initialize data.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Recommendations;
