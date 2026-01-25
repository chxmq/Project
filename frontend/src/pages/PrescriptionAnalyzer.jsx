import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzePrescription } from '../services/prescriptionService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SAFETY_STATUS_COLORS } from '../utils/constants.js';
import { UploadCloud, ShieldCheck, AlertTriangle, Pill, Activity, Calendar, User, Search, RefreshCcw, FileSpreadsheet } from 'lucide-react';

const PrescriptionAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setAnalysis(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a prescription image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await analyzePrescription(file);
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5010.');
      } else {
        setError(err.response?.data?.error || 'An error occurred during analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-6xl">
          Prescription <span className="text-gradient">Intelligence</span>
        </h1>
        <p className="text-lg text-[#c6ac8fcc] max-w-2xl mx-auto font-medium">
          Extract depth and formality from medical documents with unyielding AI strength.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {!analysis ? (
        <Card className="max-w-2xl mx-auto p-0 overflow-hidden border-[#5e503f]/20" hover={false}>
          <div className="p-10 bg-[#22333b]/40 backdrop-blur-2xl">
            <form onSubmit={handleSubmit}>
              <div
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 ${dragActive
                  ? 'border-[#c6ac8f] bg-[#c6ac8f]/10 translate-y-[-4px]'
                  : preview
                    ? 'border-[#5e503f]/50 bg-[#0a0908]/40'
                    : 'border-[#5e503f]/30 hover:border-[#c6ac8f]/50 hover:bg-[#22333b]/40'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="prescription"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {preview ? (
                  <div className="relative z-0 group">
                    <img
                      src={preview}
                      alt="Prescription preview"
                      className="max-h-[400px] mx-auto rounded-2xl shadow-2xl border border-[#eae0d5]/10 group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <p className="text-sm font-black text-[#c6ac8f] uppercase tracking-widest">Image Loaded</p>
                      <p className="text-xs text-[#5e503f] font-bold">DRAG OR CLICK TO REPLACE</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-[#5e503f]/20 text-[#c6ac8f] rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <UploadCloud size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-[#eae0d5] uppercase tracking-tight">
                        Deposit Document
                      </p>
                      <p className="text-sm text-[#5e503f] mt-2 font-bold uppercase tracking-widest">
                        Drag or browse files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="submit"
                  disabled={!file || loading}
                  isLoading={loading}
                  size="lg"
                  className="w-full sm:w-auto min-w-[240px]"
                >
                  START ANALYSIS
                </Button>
                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    DISCARD
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>
      ) : (
        <div className="space-y-12 animate-slide-up">
          {/* Analysis Banner */}
          <Card className={`border-none p-10 ${analysis.safetyStatus.status === 'safe' ? 'bg-emerald-950/20' : 'bg-red-950/20'}`} hover={false}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 text-emerald-500">
                {analysis.safetyStatus.status === 'safe' ? <ShieldCheck size={72} strokeWidth={1} /> : <AlertTriangle size={72} strokeWidth={1} className="text-red-500" />}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-[#eae0d5] mb-2 uppercase tracking-tighter">
                  {analysis.safetyStatus.status} Verification
                </h2>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                  {analysis.safetyStatus.issues.map((issue, idx) => (
                    <span key={idx} className="bg-red-900/40 text-red-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-800/30">
                      • {issue.description || issue}
                    </span>
                  ))}
                  {analysis.safetyStatus.warnings.map((warn, idx) => (
                    <span key={idx} className="bg-amber-900/40 text-amber-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-800/30">
                      • {warn}
                    </span>
                  ))}
                  {analysis.safetyStatus.status === 'safe' && (
                    <span className="bg-emerald-900/40 text-emerald-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-800/30">
                      ✓ VERIFIED DOSAGE & COMBINATION
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <div className="flex items-center justify-between mb-8 border-b border-[#5e503f]/20 pb-6">
                  <h2 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tight flex items-center gap-3">
                    <Pill className="text-[#c6ac8f]" /> Extracted Lab Data
                  </h2>
                  <span className="bg-[#5e503f]/30 text-[#c6ac8f] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {analysis.extractedData.medicines.length} ITEMS FOUND
                  </span>
                </div>
                <div className="grid gap-6">
                  {analysis.extractedData.medicines.map((medicine, idx) => (
                    <div key={idx} className="p-6 bg-[#0a0908]/40 rounded-3xl border border-[#5e503f]/20 hover:border-[#c6ac8f]/30 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tighter">{medicine.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <div className="bg-[#5e503f]/50 px-3 py-1.5 rounded-lg text-xs font-bold text-[#eae0d5] uppercase tracking-wide">
                              {medicine.dosage}
                            </div>
                            <div className="bg-[#c6ac8f]/20 px-3 py-1.5 rounded-lg text-xs font-bold text-[#c6ac8f] uppercase tracking-wide border border-[#c6ac8f]/20">
                              {medicine.frequency}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 text-3xl opacity-80" title="Timing Schedule">
                          {medicine.timing.map(t => t.toLowerCase()).join(' ').includes('morn') && '☀️'}
                          {medicine.timing.map(t => t.toLowerCase()).join(' ').includes('after') && '🌤️'}
                          {medicine.timing.map(t => t.toLowerCase()).join(' ').includes('night') && '🌙'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <h3 className="text-sm font-black text-[#5e503f] uppercase tracking-[0.3em] mb-6">Formal Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest block mb-1">Prescriber</label>
                    <p className="text-xl font-bold text-[#eae0d5] truncate">DR. {analysis.extractedData.doctorName?.toUpperCase() || 'NOT DETECTED'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#c6ac8f] uppercase tracking-widest block mb-1">Issuance Date</label>
                    <p className="text-xl font-bold text-[#eae0d5]">
                      {analysis.extractedData.date ? new Date(analysis.extractedData.date).toLocaleDateString('en-GB') : 'NOT DETECTED'}
                    </p>
                  </div>
                </div>
              </Card>

              {analysis.safetyStatus.status === 'safe' && (
                <Card className="bg-[#c6ac8f]/10 border-[#c6ac8f]/20">
                  <h3 className="text-sm font-black text-[#c6ac8f] uppercase tracking-widest mb-4">Actions Advised</h3>
                  <Button
                    className="w-full justify-center text-xs tracking-[0.2em]"
                    onClick={() => navigate('/care-near-me')}
                  >
                    IDENTIFY PHARMACIES
                  </Button>
                </Card>
              )}

              {analysis.safetyStatus.status === 'unsafe' && (
                <Card className="bg-red-950/10 border-red-800/20">
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4">Critical Steps</h3>
                  <div className="space-y-3">
                    <Button
                      variant="danger"
                      className="w-full justify-center text-xs tracking-[0.1em]"
                      onClick={() => navigate('/teleconsultation')}
                    >
                      SECURE CONSULTATION
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-xs tracking-[0.1em]"
                      onClick={() => navigate('/care-near-me')}
                    >
                      FIND LOCAL CARE
                    </Button>
                  </div>
                </Card>
              )}

              <Button
                variant="ghost"
                className="w-full border-dashed border-[#5e503f]/40 hover:border-[#c6ac8f]/50"
                onClick={handleReset}
              >
                PROCES NEW IMAGE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionAnalyzer;
