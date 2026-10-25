import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/quiz';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  registerTeacher: (name: string, email: string, password: string) => Promise<void>;
  loginTeacher: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
    case 'auth/invalid-email':
      return 'Định dạng email không hợp lệ.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Mật khẩu chưa được bật trong Firebase Console (Authentication > Sign-in method). Vui lòng bật tính năng này hoặc sử dụng Đăng nhập bằng Google.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng đặt mật khẩu tối thiểu 8 ký tự.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ quản trị viên.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại hoặc đăng ký.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng đợi trong giây lát hoặc đặt lại mật khẩu.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet của bạn.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/cancelled-popup-request':
      return 'Thao tác đăng nhập bị hủy do có yêu cầu mới.';
    default:
      return 'Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync user profile from Firestore or create default teacher profile
  const syncUserProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Giáo viên',
          role: 'teacher',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not sync user profile to Firestore:', err);
      // Fallback local memory profile so user can still operate
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Giáo viên',
        role: 'teacher',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerTeacher = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim() && cred.user) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: name.trim() || 'Giáo viên',
        role: 'teacher',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (dbErr) {
        console.warn('Failed to save profile to Firestore:', dbErr);
      }
      setUserProfile(newProfile);
    } catch (err: any) {
      console.error('Registration error code:', err?.code, err?.message);
      const message = getFriendlyAuthErrorMessage(err?.code || '');
      setError(message);
      throw new Error(message);
    }
  };

  const loginTeacher = async (email: string, password: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserProfile(cred.user);
    } catch (err: any) {
      console.error('Login error code:', err?.code, err?.message);
      const message = getFriendlyAuthErrorMessage(err?.code || '');
      setError(message);
      throw new Error(message);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await syncUserProfile(cred.user);
    } catch (err: any) {
      console.error('Google login error code:', err?.code, err?.message);
      const message = getFriendlyAuthErrorMessage(err?.code || '');
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error code:', err?.code, err?.message);
      const message = getFriendlyAuthErrorMessage(err?.code || '');
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        clearError,
        registerTeacher,
        loginTeacher,
        loginWithGoogle,
        resetPassword,
        logout,
      }}
    >
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
