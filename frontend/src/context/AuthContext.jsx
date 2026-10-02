import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('user'); }
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    const userData = res.data.user;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }

  async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    const userData = { id: res.data.id, username, email };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
