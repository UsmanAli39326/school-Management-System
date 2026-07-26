'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { loginUser, logoutUser, resetPassword, getUserProfile } from '@/firebase/auth';
import { getSchoolById, updateSchool } from '@/firebase/db/schools';
import { generateBrandShades, applyBrandToDOM, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from '@/utils/brand';

const AuthContext = createContext({
  currentUser: null,
  userProfile: null,
  role: null,
  schoolId: null,
  schoolDetails: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  sendResetEmail: async () => {},
  updateSchoolBranding: async () => {},
});

export function AuthContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySchoolTheme = useCallback((themeData) => {
    const primaryHex = themeData?.primaryColor || DEFAULT_PRIMARY_COLOR;
    const secondaryHex = themeData?.secondaryColor || DEFAULT_SECONDARY_COLOR;
    const shades = generateBrandShades(primaryHex, secondaryHex);
    applyBrandToDOM(shades);
    return shades;
  }, []);

  const updateSchoolBranding = useCallback(async (newBranding) => {
    if (!schoolId) return;

    const updatedTheme = {
      primaryColor: newBranding.primaryColor || DEFAULT_PRIMARY_COLOR,
      secondaryColor: newBranding.secondaryColor || DEFAULT_SECONDARY_COLOR,
    };

    const shades = applySchoolTheme(updatedTheme);

    const updatedSchoolData = {
      ...schoolDetails,
      logoUrl: newBranding.logoUrl !== undefined ? newBranding.logoUrl : schoolDetails?.logoUrl || '',
      theme: updatedTheme,
    };

    setSchoolDetails(updatedSchoolData);

    // Save to Firestore
    await updateSchool(schoolId, {
      logoUrl: updatedSchoolData.logoUrl,
      theme: updatedTheme,
    });

    // Update Session Cache
    sessionStorage.setItem(`schoolData_${schoolId}`, JSON.stringify(updatedSchoolData));
    sessionStorage.setItem(`schoolTheme_${schoolId}`, JSON.stringify(updatedTheme));

    return shades;
  }, [schoolId, schoolDetails, applySchoolTheme]);

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

        // Profile Caching
        const cachedProfileKey = `userProfile_${user.uid}`;
        const cachedProfile = sessionStorage.getItem(cachedProfileKey);
        if (cachedProfile) {
          setUserProfile(JSON.parse(cachedProfile));
        } else {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          sessionStorage.setItem(cachedProfileKey, JSON.stringify(profile));
        }

        // Apply Dynamic Branding with Caching & Fallback
        if (userSchoolId && userSchoolId !== 'GLOBAL') {
          const cachedSchoolKey = `schoolData_${userSchoolId}`;
          const cachedSchool = sessionStorage.getItem(cachedSchoolKey);
          let school = cachedSchool ? JSON.parse(cachedSchool) : null;

          if (!school) {
            school = await getSchoolById(userSchoolId);
            if (school) {
              sessionStorage.setItem(cachedSchoolKey, JSON.stringify(school));
            }
          }

          setSchoolDetails(school);
          applySchoolTheme(school?.theme);
        } else {
          applySchoolTheme(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        setSchoolId(null);
        setSchoolDetails(null);
        sessionStorage.clear();

        // Reset Branding to Default Red Fallback
        applySchoolTheme(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [applySchoolTheme]);

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
    schoolDetails,
    loading,
    login,
    logout,
    sendResetEmail,
    updateSchoolBranding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

