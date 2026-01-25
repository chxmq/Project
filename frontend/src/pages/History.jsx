import { useState, useEffect } from 'react';
import { getSymptomHistory, deleteSymptomHistory } from '../services/symptomService.js';
import { getPrescriptionHistory, deletePrescriptionHistory } from '../services/prescriptionService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Activity, FileText, Calendar, Clock, ChevronRight, Search, LayoutGrid, List, Trash2 } from 'lucide-react';

const History = () => {
    const [activeTab, setActiveTab] = useState('symptoms');
    const [symptomHistory, setSymptomHistory] = useState([]);
    const [prescriptionHistory, setPrescriptionHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const [symptomRes, prescriptionRes] = await Promise.all([
                getSymptomHistory(),
                getPrescriptionHistory()
            ]);

            if (symptomRes.success) setSymptomHistory(symptomRes.data || []);
            if (prescriptionRes.success) setPrescriptionHistory(prescriptionRes.data || []);
        } catch (err) {
            setError('Intelligence retrieval node failed. Registry inaccessible.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm('PERMANENTLY PURGE THIS RECORD FROM REGISTRY?')) return;

        try {
            if (type === 'symptoms') {
                await deleteSymptomHistory(id);
                setSymptomHistory(symptomHistory.filter(item => item._id !== id));
            } else {
                await deletePrescriptionHistory(id);
                setPrescriptionHistory(prescriptionHistory.filter(item => item._id !== id));
            }
        } catch (err) {
            setError('Deletion protocol execution failed.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            <div className="text-center mb-16 animate-fade-in">
                <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-7xl leading-tight">
                    Interaction <span className="text-gradient">Registry</span>
                </h1>
                <p className="text-lg text-[#c6ac8fcc] max-w-2xl mx-auto font-medium tracking-wide uppercase italic">
                    Formal archival of your historical diagnostic phases and medical data extractions.
                </p>
            </div>

            <ErrorMessage message={error} onDismiss={() => setError('')} />

            <div className="grid lg:grid-cols-4 gap-12">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-3 border-[#5e503f]/20" hover={false}>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setActiveTab('symptoms')}
                                className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500 ${activeTab === 'symptoms'
                                    ? 'bg-[#c6ac8f] text-[#0a0908] shadow-2xl scale-[1.03]'
                                    : 'text-[#c6ac8fcc] hover:text-[#eae0d5] hover:bg-[#22333b]/40'
                                    }`}
                            >
                                <Activity size={20} />
                                <span className="font-black text-xs uppercase tracking-widest">Symptom Phases</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('prescriptions')}
                                className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500 ${activeTab === 'prescriptions'
                                    ? 'bg-[#5e503f] text-[#eae0d5] shadow-2xl scale-[1.03]'
                                    : 'text-[#c6ac8fcc] hover:text-[#eae0d5] hover:bg-[#22333b]/40'
                                    }`}
                            >
                                <FileText size={20} />
                                <span className="font-black text-xs uppercase tracking-widest">Prescription Extractions</span>
                            </button>
                        </div>
                    </Card>

                    <Card className="bg-[#c6ac8f]/5 border-[#c6ac8f]/10 p-6">
                        <h3 className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest mb-4 italic">Registry Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-[#5e503f]">TOTAL NODES:</span>
                                <span className="text-[#eae0d5]">{symptomHistory.length + prescriptionHistory.length}</span>
                            </div>
                            <div className="w-full h-1 bg-[#22333b] rounded-full overflow-hidden">
                                <div className="h-full bg-[#c6ac8f]" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* List Content */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-32 glass rounded-[3rem] border border-[#5e503f]/20 min-h-[500px]">
                            <LoadingSpinner size="lg" className="text-[#c6ac8f]" />
                            <p className="mt-8 text-[#5e503f] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Registry...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-up">
                            {(activeTab === 'symptoms' ? symptomHistory : prescriptionHistory).length > 0 ? (
                                (activeTab === 'symptoms' ? symptomHistory : prescriptionHistory).map((item, idx) => (
                                    <Card key={item._id || idx} className="border-[#5e503f]/20 overflow-hidden" hover={false}>
                                        <div className="flex flex-col sm:flex-row justify-between gap-8 p-4">
                                            <div className="space-y-6 flex-grow">
                                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}>
                                                    <div className={`p-4 rounded-2xl ${activeTab === 'symptoms' ? 'bg-[#c6ac8f]/10 text-[#c6ac8f]' : 'bg-[#5e503f]/20 text-[#eae0d5]'}`}>
                                                        {activeTab === 'symptoms' ? <Activity size={24} /> : <FileText size={24} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tighter italic leading-none">
                                                            {activeTab === 'symptoms' ? (item.symptoms?.length > 3 ? item.symptoms.slice(0, 3).join(', ') + '...' : item.symptoms?.join(', ')) : `DR. ${item.extractedData?.doctorName?.toUpperCase() || 'UNKNOWN'}`}
                                                        </h3>
                                                        <p className="text-[10px] font-black text-[#5e503f] uppercase tracking-widest mt-1 italic">
                                                            ENTRY: {new Date(item.createdAt).toLocaleString('en-GB')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {activeTab === 'symptoms' ? (
                                                        <>
                                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.severity === 'High' ? 'bg-red-950/20 text-red-500 border-red-900/40' :
                                                                item.severity === 'Moderate' ? 'bg-amber-950/20 text-amber-500 border-amber-900/40' :
                                                                    'bg-emerald-950/20 text-emerald-500 border-emerald-900/40'
                                                                }`}>
                                                                {item.severity} SEVERITY
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.safetyStatus?.status === 'safe' ? 'bg-emerald-950/20 text-emerald-500 border-emerald-900/40' : 'bg-red-950/20 text-red-500 border-red-900/40'
                                                                }`}>
                                                                {item.safetyStatus?.status.toUpperCase()} VERIFICATION
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-900/40 hover:text-red-500 hover:bg-red-950/10 border-none px-2"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id, activeTab); }}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                                <button
                                                    onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                                                    className="p-3 bg-[#22333b]/40 rounded-xl hover:bg-[#c6ac8f]/10 transition-all"
                                                >
                                                    <ChevronRight className={`text-[#c6ac8f] transition-transform duration-500 ${expandedId === item._id ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === item._id && (
                                            <div className="border-t border-[#5e503f]/20 bg-[#0a0908]/40 p-8 animate-slide-up">
                                                {activeTab === 'symptoms' ? (
                                                    <div className="space-y-8">
                                                        <div className="grid md:grid-cols-2 gap-8">
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-4 italic">Detected Symptoms</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.symptoms.map(s => (
                                                                        <span key={s} className="bg-[#22333b]/60 px-3 py-1 rounded-lg text-[9px] font-bold text-[#eae0d5] border border-[#5e503f]/30 uppercase">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-4 italic">Clinical Advice</h4>
                                                                <p className="text-xs font-bold text-[#c6ac8f] leading-relaxed uppercase">
                                                                    {item.recommendations?.teleconsultationRecommended || item.severity === 'High'
                                                                        ? 'MANDATORY SPECIALTY CONSULTATION IS ADVISED DUE TO PHASE SEVERITY.'
                                                                        : 'MONITOR STATUS AND ADHERE TO SUGGESTED MEDICINAL PROTOCOL.'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] italic">Medicinal Registry</h4>
                                                                <p className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest italic">
                                                                    FOLLOW-UP: {new Date(item.recommendations?.followUpDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            {item.recommendations?.medicines?.map((med, i) => (
                                                                <div key={i} className="flex justify-between items-center bg-[#22333b]/20 p-4 rounded-xl border border-[#5e503f]/10">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-black text-[#eae0d5] uppercase tracking-tighter">{med.name}</span>
                                                                        <span className="text-[9px] font-black text-[#5e503f] uppercase tracking-widest">{med.timing?.join(', ')}</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-[#c6ac8f] uppercase tracking-widest">{med.dosage} • {med.duration || 'N/A'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-8">
                                                        <div className="grid md:grid-cols-2 gap-8">
                                                            <div className="bg-red-950/10 p-4 rounded-2xl border border-red-900/20">
                                                                <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-3 italic">Safety Concerns</h4>
                                                                <ul className="space-y-1">
                                                                    {item.safetyStatus?.issues?.map((issue, i) => (
                                                                        <li key={i} className="text-[9px] font-bold text-red-200 uppercase tracking-tight">• {issue.description || issue}</li>
                                                                    ))}
                                                                    {item.safetyStatus?.issues?.length === 0 && <li className="text-[9px] font-bold text-emerald-500 uppercase">✓ ZERO DISTRESS IDENTIFIED</li>}
                                                                </ul>
                                                            </div>
                                                            <div className="bg-[#c6ac8f]/5 p-4 rounded-2xl border border-[#c6ac8f]/10">
                                                                <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] mb-3 italic">Extraction Metadata</h4>
                                                                <p className="text-[9px] font-bold text-[#eae0d5] uppercase">DATE: {item.extractedData?.date || 'UNDEFINED'}</p>
                                                                <p className="text-[9px] font-bold text-[#eae0d5] uppercase mt-1">ISSUED BY: DR. {item.extractedData?.doctorName || 'UNDEFINED'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-[#5e503f] uppercase tracking-[0.3em] italic">Analyzed Medicines</h4>
                                                            {item.extractedData?.medicines?.map((med, i) => (
                                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#22333b]/20 p-5 rounded-xl border border-[#5e503f]/10 gap-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-sm font-black text-[#eae0d5] uppercase tracking-tighter">{med.name}</span>
                                                                        <span className="text-[9px] font-black text-[#5e503f] uppercase tracking-widest italic">{med.dosage} • {med.frequency}</span>
                                                                    </div>
                                                                    <div className="flex gap-2 text-[#c6ac8fcc] font-black uppercase text-[8px] tracking-widest">
                                                                        {med.timing?.map((t, idx) => (
                                                                            <span key={idx} className="bg-[#0a0908]/60 px-2 py-1 rounded border border-[#c6ac8f]/10">
                                                                                {t.toUpperCase()}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ))
                            ) : (
                                <div className="py-32 text-center glass rounded-[3rem] border-dashed border-2 border-[#5e503f]/30">
                                    <Search size={64} className="mx-auto mb-8 opacity-20 text-[#eae0d5]" />
                                    <h3 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">Zero Archives Identified</h3>
                                    <p className="text-[#c6ac8fcc] mt-4 font-bold uppercase tracking-widest text-xs">Begin a new diagnostic phase to populate this registry.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
