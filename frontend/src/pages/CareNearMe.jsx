import { useState, useEffect } from 'react';
import { getNearbyHospitals, getNearbyPharmacies } from '../services/locationService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Hospital, Pill, MapPin, Phone, Search, Navigation, RefreshCw, AlertCircle } from 'lucide-react';

const CareNearMe = () => {
  const [activeTab, setActiveTab] = useState('hospitals');
  const [hospitals, setHospitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchData();
    }
  }, [userLocation]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation infrastructure unavailable. Defaulting to Central Node.');
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Coordinate detection failed. Defaulting to Central Node.');
        setUserLocation({ lat: 28.6139, lng: 77.2090 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchData = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError('');

    try {
      const { lat, lng } = userLocation;

      const [hospitalsRes, pharmaciesRes] = await Promise.all([
        getNearbyHospitals(lat, lng),
        getNearbyPharmacies(lat, lng)
      ]);

      if (hospitalsRes.success && hospitalsRes.data) {
        setHospitals(Array.isArray(hospitalsRes.data) ? hospitalsRes.data : []);
      }
      if (pharmaciesRes.success && pharmaciesRes.data) {
        setPharmacies(Array.isArray(pharmaciesRes.data) ? pharmaciesRes.data : []);
      }

      if ((!hospitalsRes.success || !hospitalsRes.data || hospitalsRes.data.length === 0) &&
        (!pharmaciesRes.success || !pharmaciesRes.data || pharmaciesRes.data.length === 0)) {
        setError('Zero medical nodes identified in current radius.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Analysis server (5010) is offline.');
      } else {
        setError(err.response?.data?.error || 'Intelligence retrieval failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = (coordinates) => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-black mb-4 text-[#eae0d5] uppercase tracking-tighter sm:text-7xl leading-tight">
          Care <span className="text-gradient">Localizer</span>
        </h1>
        <p className="text-lg text-[#c6ac8fcc] max-w-2xl mx-auto font-medium tracking-wide uppercase italic">
          High-depth mapping of clinical facilities with unyielding accuracy.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {locationError && (
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-[2rem] p-6 mb-10 text-center glass shadow-inner">
          <p className="text-amber-500 text-xs font-black uppercase tracking-[0.2em]">{locationError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-[#5e503f]/20">
            <h3 className="font-black text-[#5e503f] mb-6 uppercase tracking-[0.4em] text-[10px]">Registry Settings</h3>
            <div className="space-y-6">
              <div className="p-5 bg-[#0a0908]/60 rounded-3xl border border-[#5e503f]/30 interior-shadow">
                <p className="text-[10px] text-[#c6ac8fcc] font-black mb-2 uppercase tracking-widest">Active GPS Node</p>
                <p className="text-[#eae0d5] font-black text-xs font-mono tracking-tighter">
                  {userLocation ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}` : 'SCANNING...'}
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full text-xs font-black uppercase tracking-widest border-[#5e503f]/50 hover:bg-[#c6ac8f]/10"
                size="sm"
                onClick={getUserLocation}
                disabled={loading}
              >
                RE-SCAN POSITION
              </Button>
            </div>
          </Card>

          <Card className="p-3 overflow-hidden border-[#5e503f]/20">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500 ${activeTab === 'hospitals'
                  ? 'bg-[#c6ac8f] text-[#0a0908] shadow-2xl scale-[1.03]'
                  : 'text-[#c6ac8fcc] hover:text-[#eae0d5] hover:bg-[#22333b]/40'
                  }`}
              >
                <Hospital size={24} />
                <span className="font-black text-xs uppercase tracking-widest">Clinical Centers</span>
              </button>
              <button
                onClick={() => setActiveTab('pharmacies')}
                className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500 ${activeTab === 'pharmacies'
                  ? 'bg-[#5e503f] text-[#eae0d5] shadow-2xl scale-[1.03]'
                  : 'text-[#c6ac8fcc] hover:text-[#eae0d5] hover:bg-[#22333b]/40'
                  }`}
              >
                <Pill size={24} />
                <span className="font-black text-xs uppercase tracking-widest">Medical Shops</span>
              </button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-32 glass rounded-[3rem] border border-[#5e503f]/20 shadow-inner min-h-[500px]">
              <LoadingSpinner size="lg" className="text-[#c6ac8f]" />
              <p className="mt-8 text-[#5e503f] font-black uppercase tracking-[0.5em] animate-pulse">Scanning Registry...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 animate-slide-up">
              {(activeTab === 'hospitals' ? hospitals : pharmacies).length > 0 ? (
                (activeTab === 'hospitals' ? hospitals : pharmacies).map((place) => (
                  <Card key={place.id || (place.coordinates?.lat + place.name)} className="flex flex-col border-[#5e503f]/30 hover:bg-[#22333b]/40 transition-all duration-700">
                    <div className="mb-8">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h3 className="text-2xl font-black text-[#eae0d5] uppercase tracking-tighter leading-[1.1] italic">{place.name}</h3>
                        <span className="bg-[#5e503f]/40 text-[#eae0d5] px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#5e503f]/50 shadow-sm shrink-0">
                          {place.distance}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#c6ac8fcc] line-clamp-2 min-h-[50px] leading-relaxed uppercase tracking-tighter opacity-80 flex items-start gap-2">
                        NODE <MapPin size={14} className="mt-0.5 shrink-0" /> {place.address}
                      </p>
                    </div>

                    <div className="space-y-6 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {place.phone && place.phone !== 'None' && (
                          <span className="bg-[#0a0908]/60 text-[#eae0d5] border border-[#c6ac8f]/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Phone size={10} /> TEL: {place.phone}
                          </span>
                        )}
                        {place.open24Hours && (
                          <span className="bg-[#c6ac8f]/10 text-[#eae0d5] border border-[#c6ac8f]/40 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            24h DEPLOYED
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleGetDirections(place.coordinates)}
                        className={`w-full tracking-[0.2em] text-xs font-black shadow-none border-b-4 ${activeTab === 'hospitals' ? 'bg-[#c6ac8f] border-[#5e503f] hover:translate-y-[-2px]' : 'bg-[#5e503f] border-[#0a0908] hover:translate-y-[-2px]'}`}
                      >
                        COMMENCE NAVIGATION
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-32 text-center glass rounded-[3rem] border-dashed border-2 border-[#5e503f]/30 shadow-inner">
                  <Search size={64} className="mx-auto mb-8 opacity-20 text-[#eae0d5]" />
                  <h3 className="text-3xl font-black text-[#eae0d5] uppercase tracking-tighter italic">No Registry Data Identified</h3>
                  <p className="text-[#c6ac8fcc] mt-4 font-bold uppercase tracking-widest text-xs">Awaiting positional override or range extension.</p>
                  <Button variant="ghost" className="mt-12 tracking-widest" onClick={fetchData}>RE-INITIALIZE REGISTRY</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareNearMe;
