import React from 'react';
import Navbar from './Navbar';
import Disclaimer from './Disclaimer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f3]">
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {children}
      </main>
      <footer className="mt-auto border-t border-[#e6e2d6] bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Disclaimer />
          <p className="text-center text-xs text-[#7b8593]">
            © {new Date().getFullYear()} Cura · Built for educational use.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
