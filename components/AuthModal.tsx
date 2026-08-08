import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockDatabase';
import { KeyRound, Mail, User, Sparkles, X, CheckCircle2, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ssoProcessing, setSsoProcessing] = useState<'google' | 'apple' | null>(null);

  // Helper to retrieve registered users list from localStorage or fallback to INITIAL_USERS
  const getRegisteredUsers = (): UserProfile[] => {
    try {
      const stored = localStorage.getItem('celestial_registered_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error reading registered users from localStorage", err);
    }
    return INITIAL_USERS;
  };

  const saveRegisteredUsers = (users: UserProfile[]) => {
    try {
      localStorage.setItem('celestial_registered_users', JSON.stringify(users));
    } catch (err) {
      console.error("Error saving registered users to localStorage", err);
    }
  };

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const users = getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      // Account exists, successfully sign in
      const loggedInUser: UserProfile = {
        ...existing,
        isLoggedIn: true
      };
      localStorage.setItem('jwt_token', `simulated_jwt_${loggedInUser.id}_${Date.now()}`);
      onLoginSuccess(loggedInUser);
      onClose();
    } else {
      // Account NOT found in database -> prompt user to create new registration
      setErrorMessage(`No account found registered under "${cleanEmail}". Please fill in your name below to create a new registration.`);
      setIsRegister(true);
      if (!name) {
        const suggestedName = cleanEmail.split('@')[0];
        setName(suggestedName ? suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1) : '');
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const users = getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      setErrorMessage(`An account with email "${cleanEmail}" already exists. Please sign in instead.`);
      setIsRegister(false);
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim() || 'Spiritual Seeker',
      email: cleanEmail,
      role: role,
      ageGroup: '25-34',
      spiritualGoals: ['Personal Development', 'Spiritual Clarity'],
      interests: ['Tarot', 'Palmistry'],
      readingPreferences: {
        preferredDeck: 'Rider-Waite Classic',
        focusAreas: ['Career', 'Relationships'],
        dailyAlerts: true
      },
      createdAt: new Date().toISOString().split('T')[0],
      isLoggedIn: true
    };

    const updatedList = [...users, newUser];
    saveRegisteredUsers(updatedList);

    localStorage.setItem('jwt_token', `simulated_jwt_${newUser.id}_${Date.now()}`);
    setSuccessMessage("Registration successful! Signing you in...");
    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 600);
  };

  const handleSSO = (provider: 'google' | 'apple') => {
    setSsoProcessing(provider);
    setErrorMessage(null);
    setSuccessMessage(null);

    setTimeout(() => {
      setSsoProcessing(null);
      const ssoEmail = provider === 'google' ? 'user.google@palmistry.ai' : 'user.apple@icloud.com';
      const ssoName = provider === 'google' ? 'Google Seeker' : 'Apple Seeker';

      const users = getRegisteredUsers();
      const existing = users.find(u => u.email.toLowerCase() === ssoEmail);

      if (existing) {
        const loggedInUser: UserProfile = {
          ...existing,
          isLoggedIn: true
        };
        localStorage.setItem('jwt_token', `simulated_jwt_${loggedInUser.id}_${Date.now()}`);
        onLoginSuccess(loggedInUser);
        onClose();
      } else {
        // User not found in DB -> prompt for quick new registration prefilled with SSO data
        setEmail(ssoEmail);
        setName(ssoName);
        setIsRegister(true);
        setErrorMessage(`Connected with ${provider === 'google' ? 'Google' : 'Apple'}! No previous profile was found for ${ssoEmail}. Click 'Register Account' below to complete your registration.`);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-[#E0E0E6]">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-violet-950 via-[#0D0D14] to-amber-950/40 px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-amber-400 border border-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Celestial Portal Access</h3>
              <p className="text-[10px] font-mono text-violet-300 uppercase tracking-wider">
                {isRegister ? 'Create a New Account' : 'Sign In to Your Account'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* SSO Quick Buttons (Google & Apple) */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={ssoProcessing !== null}
              onClick={() => handleSSO('google')}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-3 transition-all hover:border-white/20 disabled:opacity-50"
            >
              {ssoProcessing === 'google' ? (
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={ssoProcessing !== null}
              onClick={() => handleSSO('apple')}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-3 transition-all hover:border-white/20 disabled:opacity-50"
            >
              {ssoProcessing === 'apple' ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.09-3.26-2.62-7.14-7.24-11.64-13.84-6.75-9.81-12.02-20.73-15.82-32.74-3.8-12.02-5.7-23.51-5.7-34.47 0-14.59 3.65-26.69 10.96-36.28 7.31-9.59 16.48-14.46 27.52-14.61 4.68 0 9.87 1.15 15.57 3.45 5.7 2.3 9.61 3.46 11.72 3.46 1.85 0 5.83-1.19 11.95-3.57 6.12-2.38 11.33-3.48 15.63-3.29 12.19.98 21.82 5.56 28.9 13.73-10.77 6.53-16.03 15.66-15.79 27.39.24 9.15 3.82 16.78 10.73 22.88 6.91 6.1 15.02 9.58 24.32 10.45-2.29 6.86-5.23 13.52-8.83 19.98zM119.22 31.85c0-6.97 2.48-13.68 7.43-20.13 4.95-6.45 11.23-10.58 18.84-12.39.22 1.42.33 2.72.33 3.92 0 6.86-2.58 13.63-7.75 20.31-5.17 6.68-11.45 10.7-18.85 12.06-.21-.87-.32-2.12-.32-3.77z"/>
                </svg>
              )}
              <span>Continue with Apple</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono text-white/40 uppercase tracking-widest">or sign in with email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Error / Alert Banner */}
          {errorMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleSignIn} className="space-y-4">
            
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aria Vance"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Select Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="user">Spiritual Seeker (User)</option>
                  <option value="reader">Tarot Reader</option>
                  <option value="consultant">Spiritual Consultant</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-[0.15em] rounded-xl text-xs sleek-glow-violet transition-all flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center space-x-1 mx-auto"
            >
              <span>{isRegister ? 'Already have an account? Sign in here' : 'New user? Create a new account'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
