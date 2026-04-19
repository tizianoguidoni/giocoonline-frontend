import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacter = async () => {
    try {
      const response = await axios.get(`${API}/characters/me`);
      setCharacter(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch character:', error);
      }
      setCharacter(null);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    await fetchCharacter();
    return userData;
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API}/auth/register`, { username, email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setCharacter(null);
  };

  const createCharacter = async (data) => {
    const response = await axios.post(`${API}/characters`, data);
    setCharacter(response.data);
    return response.data;
  };

  const refreshCharacter = async () => {
    await fetchCharacter();
  };

  return (
    <AuthContext.Provider value={{
      user,
      character,
      token,
      loading,
      login,
      register,
      logout,
      createCharacter,
      refreshCharacter,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
