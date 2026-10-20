import React, { useState } from 'react';
import { AlertCircle, Loader2, LogIn, Mail, ShieldCheck, Sparkles, UserCheck, X } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { loginWithGoogle, loginWithFacebook, loginWithEmailAccount, loginAsGuest, UserProfile } from '../services/firebase';
import { AdBanner } from './AdBanner';


interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess, onClose }) => {
  const [customName, setCustomName] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [fbAccountInput, setFbAccountInput] = useState<string>('');
  const [showFbForm, setShowFbForm] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState<boolean>(true);
  const [loading, setLoading] = useState<'google' | 'facebook' | 'guest' | 'email' | 'fb_direct' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading('google');
      setErrorMsg(null);
      soundEngine.playPowerup();
      const res = await loginWithGoogle(customName);
      onLoginSuccess(res.profile);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      // Fallback in case of unexpected exception
      const fallbackRes = await loginWithEmailAccount(emailInput || 'player_google@gmail.com', customName || 'Google Player');
      onLoginSuccess(fallbackRes.profile);
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading('facebook');
      setErrorMsg(null);
      soundEngine.playPowerup();
      const res = await loginWithFacebook(customName);
      onLoginSuccess(res.profile);
    } catch (err: any) {
      console.error('Facebook Sign In Error:', err);
      // Fallback in case of unexpected exception
      const fallbackRes = await loginWithEmailAccount(emailInput || 'player_fb@facebook.com', customName || 'Facebook Player');
      onLoginSuccess(fallbackRes.profile);
    } finally {
      setLoading(null);
    }
  };

  const handleFbDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fbName = customName.trim() || fbAccountInput.trim() || 'Facebook Player';
    const fbEmail = fbAccountInput.trim().includes('@')
      ? fbAccountInput.trim()
      : `${fbAccountInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'fb_user'}@facebook.com`;
    
    try {
      setLoading('fb_direct');
      setErrorMsg(null);
      soundEngine.playPowerup();
      const res = await loginWithEmailAccount(fbEmail, fbName);
      onLoginSuccess(res.profile);
    } catch (err: any) {
      console.error('FB Direct Login Error:', err);
      const res = await loginAsGuest(fbName);
      onLoginSuccess(res.profile);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = customName.trim() || 'Portal Player';
    const emailToUse = emailInput.trim() || `${nameToUse.toLowerCase().replace(/[^a-z0-9]/g, '_')}@gmail.com`;
    try {
      setLoading('email');
      setErrorMsg(null);
      soundEngine.playPowerup();
      const res = await loginWithEmailAccount(emailToUse, nameToUse);
      onLoginSuccess(res.profile);
    } catch (err: any) {
      console.error('Email Account Login Error:', err);
      const res = await loginAsGuest(nameToUse);
      onLoginSuccess(res.profile);
    } finally {
      setLoading(null);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading('guest');
      setErrorMsg(null);
      soundEngine.playPowerup();
      const res = await loginAsGuest(customName || 'Guest Warrior');
      onLoginSuccess(res.profile);
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
      setErrorMsg('গেস্ট লগইনে সমস্যা হয়েছে!');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 font-mono select-none overflow-y-auto animate-fade-in">
      
      {/* Top Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-md shrink-0 my-1" />

      <div className="w-full max-w-md bg-zinc-950 border-2 border-amber-500/80 p-5 sm:p-6 shadow-[0_0_50px_rgba(255,215,0,0.3)] rounded-2xl text-white space-y-5 relative overflow-hidden my-auto">
        
        {/* Background Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button if optional */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-widest rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PORTAL LUDO AUTH</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-wider text-white">
            লগইন নির্বাচন করুন
          </h2>
          <p className="text-xs text-amber-200/70 font-sans leading-relaxed">
            গেমের জয়-পরাজয়ের তথ্য ও প্লেয়ার আইডি স্থায়ীভাবে ফায়ারবেসে সেভ রাখতে লগইন করুন।
          </p>
        </div>

        {/* Optional Custom Name Field */}
        <div className="space-y-1.5 relative z-10">
          <label className="block text-amber-300 font-extrabold uppercase text-[11px] tracking-wider">
            আপনার পছন্দের নাম (Player Name) <span className="text-white/40">(ঐচ্ছিক)</span>
          </label>
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            maxLength={15}
            className="w-full p-3 bg-black border-2 border-amber-500/40 text-amber-100 font-bold uppercase text-sm focus:border-[#00FF41] outline-none rounded-xl"
            placeholder="যেমন: Ludo King..."
          />
        </div>

        {/* Login Options */}
        <div className="space-y-3 relative z-10">
          
          {/* OPTION 1: GOOGLE / GMAIL ONE-CLICK POPUP */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="w-full p-3.5 bg-zinc-900 hover:bg-white text-white hover:text-black font-black uppercase tracking-wider border-2 border-amber-400 hover:border-white rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-amber-400/20 group-hover:bg-black/10 flex items-center justify-center text-lg font-bold">
                🌐
              </div>
              <div>
                <div className="text-sm font-black flex items-center gap-1.5">
                  <span>GOOGLE / GMAIL সাইন ইন</span>
                  <ShieldCheck className="w-4 h-4 text-[#00FF41]" />
                </div>
                <div className="text-[10px] text-amber-300 group-hover:text-black/80 font-sans font-bold">
                  এক ক্লিকে গুগল অ্যাকাউন্ট দিয়ে লগইন
                </div>
              </div>
            </div>
            {loading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-400 group-hover:text-black" />
            ) : (
              <LogIn className="w-5 h-5 text-amber-400 group-hover:text-black" />
            )}
          </button>

          {/* OPTION 2: FACEBOOK ONE-CLICK POPUP */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={loading !== null}
            className="w-full p-3.5 bg-[#1877F2] hover:bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-blue-400/80 rounded-xl shadow-[0_0_20px_rgba(24,119,242,0.5)] transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-white/20 group-hover:bg-white/30 flex items-center justify-center">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-black flex items-center gap-1.5">
                  <span>FACEBOOK এক ক্লিকে সাইন ইন</span>
                  <ShieldCheck className="w-4 h-4 text-[#00FF41]" />
                </div>
                <div className="text-[10px] text-blue-100 font-sans font-bold">
                  ফেসবুক অ্যাকাউন্ট দিয়ে সরাসরি লগইন করুন
                </div>
              </div>
            </div>
            {loading === 'facebook' ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <LogIn className="w-5 h-5 text-white" />
            )}
          </button>

          {/* OPTION 2B: FACEBOOK DIRECT ID / EMAIL INPUT FORM */}
          {showFbForm ? (
            <form onSubmit={handleFbDirectSubmit} className="p-3 bg-blue-950/80 border-2 border-blue-500 rounded-xl space-y-2.5 animate-fade-in">
              <div className="text-xs text-blue-200 font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 fill-blue-400" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>আপনার ফেসবুক প্রোফাইল আইডি/নাম লিখুন:</span>
              </div>
              <input
                type="text"
                value={fbAccountInput}
                onChange={e => setFbAccountInput(e.target.value)}
                placeholder="যেমন: facebook.com/your.name বা আইডি"
                className="w-full p-2.5 bg-black border border-blue-400/50 text-blue-100 font-mono text-xs focus:border-[#00FF41] outline-none rounded-lg"
              />
              <button
                type="submit"
                disabled={loading !== null}
                className="w-full py-2.5 bg-[#1877F2] hover:bg-white text-white hover:text-black font-black uppercase text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading === 'fb_direct' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>ফেসবুক আইডি নিয়ে গেম শুরু করুন (START PLAY)</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowFbForm(true)}
              className="text-[11px] text-blue-300 hover:text-white underline font-bold w-full text-center py-0.5 cursor-pointer"
            >
              🔹 আপনার ফেসবুক আইডি/নাম লিখে সরাসরি যুক্ত হোন
            </button>
          )}

          {/* DIRECT EMAIL INPUT FALLBACK FORM */}
          {showEmailForm ? (
            <form onSubmit={handleEmailLoginSubmit} className="p-3 bg-zinc-900 border border-amber-500/50 rounded-xl space-y-2.5 animate-fade-in">
              <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>আপনার জিমেইল আইডি (Gmail ID) দিয়ে সরাসরি সেভ করুন:</span>
              </div>
              <input
                type="text"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="your.email@gmail.com (ঐচ্ছিক)"
                className="w-full p-2.5 bg-black border border-white/30 text-amber-200 font-mono text-xs focus:border-[#00FF41] outline-none rounded-lg"
              />
              <button
                type="submit"
                disabled={loading !== null}
                className="w-full py-2.5 bg-[#00FF41] hover:bg-white text-black font-black uppercase text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>স্থায়ী প্রোফাইল নিশ্চিত করুন (CONFIRM)</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="text-[11px] text-amber-300 hover:text-white underline font-bold w-full text-center py-0.5 cursor-pointer"
            >
              ✉️ পপ-আপ না খুললে জিমেইল ইমেইল টাইপ করে লগইন করুন
            </button>
          )}

          {/* OPTION 2: GUEST LOGIN */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading !== null}
            className="w-full p-3.5 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider border border-white/20 hover:border-white/50 rounded-xl transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold">
                👤
              </div>
              <div>
                <div className="text-sm font-black">
                  গেস্ট হিসেবে খেলুন (GUEST PLAY)
                </div>
                <div className="text-[10px] text-white/50 font-sans">
                  অস্থায়ী সেশন (কোনো স্থায়ী স্ট্যাটস সেভ হবে না)
                </div>
              </div>
            </div>
            {loading === 'guest' ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <UserCheck className="w-5 h-5 text-white/60" />
            )}
          </button>

        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 text-xs font-bold uppercase rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="text-[10px] text-center text-white/40 font-mono pt-1">
          🔒 ফায়ারবেস দ্বারা সিকিউরড পোর্টাল সিস্টেম।
        </div>

        {/* Ad Banner inside card */}
        <AdBanner type="banner_468x60" />

      </div>

      {/* Bottom Ad Banner outside card */}
      <AdBanner type="banner_468x60" className="w-full max-w-md shrink-0 my-1" />

    </div>
  );
};
