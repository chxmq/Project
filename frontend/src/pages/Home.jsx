import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Stethoscope, FileText, ArrowRight } from 'lucide-react';
import PixelSnow from '../components/ui/PixelSnow';

const Home = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <div className="relative isolate pt-12 lg:pt-24 min-h-[90vh] flex items-center">
        {/* Immersive Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
          <PixelSnow
            color="#c6ac8f"
            flakeSize={0.015}
            minFlakeSize={1.5}
            pixelResolution={300}
            speed={0.8}
            density={0.25}
            direction={150}
            brightness={1.2}
            depthFade={10}
            farPlane={30}
            gamma={0.5}
            variant="snowflake"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#0a0908]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-black tracking-tighter text-[#eae0d5] sm:text-7xl mb-8 uppercase leading-[0.9] animate-fade-in">
              Sophisticated <span className="text-gradient">Medical Intelligence</span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-[#c6ac8fcc] max-w-2xl mx-auto font-medium animate-slide-up">
              Radiating unmatched sophistication and strength. Experience high-depth AI analysis for prescriptions and symptoms with unyielding reliability.
            </p>

            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
              <Link to="/prescription" className="group animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Card className="h-full flex flex-col items-center justify-center p-12 text-center group-hover:bg-[#22333b] transition-all duration-500 bg-[#22333b]/40 backdrop-blur-xl border-[#c6ac8f]/10">
                  <div className="w-24 h-24 bg-[#5e503f]/20 text-[#c6ac8f] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#5e503f]/40 transition-all duration-500">
                    <FileText size={48} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-3xl font-black text-[#eae0d5] mb-4 uppercase tracking-tight">Prescription Lab</h2>
                  <p className="text-[#c6ac8fcc] font-medium leading-relaxed">
                    Unmatched strength in vision. Extract medical data with unparalleled depth.
                  </p>
                  <div className="mt-8 text-[#eae0d5] font-black uppercase text-xs tracking-[0.2em] group-hover:tracking-[0.3em] transition-all flex items-center gap-2">
                    Process Image <ArrowRight size={14} />
                  </div>
                </Card>
              </Link>

              <Link to="/symptoms" className="group animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Card className="h-full flex flex-col items-center justify-center p-12 text-center group-hover:bg-[#22333b] transition-all duration-500 bg-[#22333b]/40 backdrop-blur-xl border-[#c6ac8f]/10">
                  <div className="w-24 h-24 bg-[#5e503f]/20 text-[#c6ac8f] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#5e503f]/40 transition-all duration-500">
                    <Stethoscope size={48} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-3xl font-black text-[#eae0d5] mb-4 uppercase tracking-tight">Symptom Checker</h2>
                  <p className="text-[#c6ac8fcc] font-medium leading-relaxed">
                    Understated elegance in diagnosis. Analyze symptoms with quiet sophistication.
                  </p>
                  <div className="mt-8 text-[#eae0d5] font-black uppercase text-xs tracking-[0.2em] group-hover:tracking-[0.3em] transition-all flex items-center gap-2">
                    Initialize Analysis <ArrowRight size={14} />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
