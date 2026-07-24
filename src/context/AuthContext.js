'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { loginUser, logoutUser, resetPassword, getUserProfile } from '@/firebase/auth';
import { getSchoolById } from '@/firebase/db/schools';

const AuthContext = createContext({
  currentUser: null,
  userProfile: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  sendResetEmail: async () => {},
});

export function AuthContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        const tokenResult = await user.getIdTokenResult(true);
        const userRole = tokenResult.claims.role ? String(tokenResult.claims.role).toUpperCase() : null;
        const userSchoolId = tokenResult.claims.schoolId || null;

        setRole(userRole);
        setSchoolId(userSchoolId);

        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);

        // Apply Dynamic Branding
        if (userSchoolId && userSchoolId !== 'GLOBAL') {
          const school = await getSchoolById(userSchoolId);
          if (school && school.theme) {
            document.documentElement.style.setProperty('--primary-color', school.theme.primaryColor || '#4f46e5');
            document.documentElement.style.setProperty('--secondary-accent', school.theme.secondaryColor || '#0ea5e9');
          }
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        setSchoolId(null);

        // Reset Branding
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--secondary-accent');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await loginUser(email, password);
  };

  const logout = async () => {
    return await logoutUser();
  };

  const sendResetEmail = async (email) => {
    return await resetPassword(email);
  };

  const value = {
    currentUser,
    userProfile,
    role,
    schoolId,
    loading,
    login,
    logout,
    sendResetEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
