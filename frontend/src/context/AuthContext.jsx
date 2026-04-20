import { useState } from 'react';
import { AuthContext } from './AuthContextBase.js';
import {
  getCurrentUser,
  isAuthenticated,
  logout as authLogout,
  register as authRegister,
  login as authLogin
} from '../services/authService.js';

export const AuthProvider = ({ children }) => {
  const initialUser = isAuthenticated() ? getCurrentUser() : null;
  const [user, setUser] = useState(initialUser);
  const loading = false;

  // Login wrapper around authService so pages can call `login(email, password)`
  const login = async (email, password) => {
    const response = await authLogin(email, password);
    if (response?.success && response?.user) {
      setUser(response.user);
    }
    return response;
  };

  // Register wrapper around authService so pages can call
  // `register(name, email, password)`
  const register = async (name, email, password) => {
    const response = await authRegister(name, email, password);
    if (response?.success && response?.user) {
      setUser(response.user);
    }
    return response;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
