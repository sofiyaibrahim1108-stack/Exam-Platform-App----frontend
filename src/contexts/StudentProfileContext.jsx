import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

const StudentProfileContext = createContext(null);

export const StudentProfileProvider = ({ children }) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [profileData, setProfileData] = useState(null);

  /** Called after a successful photo upload — updates every consumer at once */
  const updatePhoto = useCallback((url) => {
    setPhotoUrl(url || '');
    if (profileData) {
      setProfileData((prev) => ({ ...prev, photoUrl: url || '' }));
    }
  }, [profileData]);

  /** Full profile refresh — called on mount from StudentProfile / StudentDashboard */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/profile');
      if (res.data?.success) {
        const data = res.data.data || {};
        setProfileData(data);
        if (data.photoUrl) setPhotoUrl(data.photoUrl);
      }
    } catch (err) {
      console.warn('StudentProfileContext: refresh failed', err);
    }
  }, []);

  return (
    <StudentProfileContext.Provider value={{ photoUrl, profileData, updatePhoto, refreshProfile }}>
      {children}
    </StudentProfileContext.Provider>
  );
};

export const useStudentProfile = () => {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) throw new Error('useStudentProfile must be used inside StudentProfileProvider');
  return ctx;
};
