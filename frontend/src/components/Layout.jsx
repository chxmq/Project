import React from 'react';
import Navbar from './Navbar';
import Disclaimer from './Disclaimer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0908]">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        {children}
      </main>
      <footer className="bg-[#0a0908] mt-auto py-10 border-t border-[#c6ac8f]/10">
        <div className="container mx-auto px-4 text-center">
          <Disclaimer />
          <p className="text-[#5e503f] text-[10px] font-black uppercase tracking-[0.4em] mt-8">
            © {new Date().getFullYear()} MediAI REGISTRY ACCESS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
