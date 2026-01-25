import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'HOME' },
    ...(user ? [{ path: '/history', label: 'HISTORY' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0908]/80 backdrop-blur-lg border-b border-[#c6ac8f]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#5e503f] to-[#c6ac8f] flex items-center justify-center text-[#0a0908] font-black text-2xl shadow-lg transition-transform group-hover:scale-110">
              M
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-[#eae0d5] to-[#c6ac8f]">
              MediAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${isActive(link.path)
                  ? 'bg-[#c6ac8f]/10 text-[#c6ac8f]'
                  : 'text-[#eae0d5]/60 hover:text-[#eae0d5] hover:bg-[#22333b]'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold text-[#c6ac8f]">
                  {user.name.toUpperCase()}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-black uppercase tracking-widest text-[#5e503f] hover:text-[#c6ac8f] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">LOGIN</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">JOIN NOW</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#c6ac8f] hover:text-[#eae0d5] p-2 transition-colors"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0908] border-t border-[#c6ac8f]/10 absolute w-full animate-fade-in shadow-2xl">
          <div className="px-6 pt-4 pb-8 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-4 rounded-2xl text-lg font-bold ${isActive(link.path)
                  ? 'bg-[#c6ac8f]/10 text-[#c6ac8f]'
                  : 'text-[#eae0d5]/60'
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-[#c6ac8f]/10 flex flex-col gap-3">
              {user ? (
                <Button variant="secondary" onClick={logout} className="w-full">LOGOUT</Button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full">LOGIN</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" className="w-full">JOIN NOW</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
