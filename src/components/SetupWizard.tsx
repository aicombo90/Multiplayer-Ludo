import React, { useState } from 'react';
import { GameMode, AIDifficulty, HouseRules, RealmId } from '../types';
import { REALMS } from '../constants/gameConstants';
import { AdBanner } from './AdBanner';
import { 
  Play, 
  Users, 
  Globe, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  Shield, 
  Flame, 
  Dice5, 
  Clock, 
  Sliders 
} from 'lucide-react';

interface SetupWizardProps {
  onStartGame: (
    playerRealms: RealmId[],
    slotIsAI: boolean[],
    mode: GameMode,
    aiDifficulty: AIDifficulty,
    houseRules: HouseRules
  ) => void;
  onOpenOnlineRoom: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  onStartGame,
  onOpenOnlineRoom
}) => {
  const [step, setStep] = useState<'mode' | 'players' | 'custom'>('mode');
  const [mode, setMode] = useState<GameMode>('classic');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerRealms, setPlayerRealms] = useState<RealmId[]>([0, 1, 2, 3]);
  const [slotIsAI, setSlotIsAI] = useState<boolean[]>([false, true, true, true]);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('tactician');
  const [houseRules, setHouseRules] = useState<HouseRules>({
    enablePowerups: true,
    starBlessing: true,
    realmBlessing: true,
    threeSixesPenalty: true,
    blitzStartTokensOut: 0,
    turnTimerSeconds: 0
  });

  const handleStart = () => {
    // Slice realms and AI flags for active player count
    const activeRealms = playerRealms.slice(0, playerCount);
    const activeAI = slotIsAI.slice(0, playerCount);
    onStartGame(activeRealms, activeAI, mode, aiDifficulty, houseRules);
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    if (count === 2) {
      setPlayerRealms([0, 2, 1, 3]);
      setSlotIsAI([false, true, true, true]);
    } else if (count === 3) {
      setPlayerRealms([0, 1, 2, 3]);
      setSlotIsAI([false, true, true, true]);
    } else {
      setPlayerRealms([0, 1, 2, 3]);
      setSlotIsAI([false, true, true, true]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between items-center p-3 sm:p-4 overflow-y-auto font-mono select-none">
      <div className="w-full max-w-lg my-auto bg-zinc-950 border-2 border-amber-500/80 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white space-y-5">
        
        {/* Header */}
        <div className="text-center space-y-1 pb-3 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTAL OF LEGENDS • MYTHIC LUDO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
            {step === 'mode' && 'গেম মোড বেছে নিন (SELECT MODE)'}
            {step === 'players' && 'খেলোয়াড় সংখ্যা (PLAYER COUNT)'}
            {step === 'custom' && 'ম্যাচ কাস্টমাইজেশন (CUSTOMIZE)'}
          </h1>
          <p className="text-xs text-zinc-400">
            {step === 'mode' && 'অনলাইন রুম অথবা লোকাল এআই ম্যাচ তৈরি করুন'}
            {step === 'players' && 'কয়জন যোদ্ধা একসাথে রণক্ষেত্রে নামবে?'}
            {step === 'custom' && 'রিয়েলম ও এআই বুদ্ধিমত্তা নির্ধারণ করুন'}
          </p>
        </div>

        {/* Step 1: Mode Selection */}
        {step === 'mode' && (
          <div className="space-y-4">
            {/* Online Multiplayer Banner Button */}
            <button
              type="button"
              onClick={onOpenOnlineRoom}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-2 border-emerald-500/80 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-emerald-300 uppercase tracking-wider">
                      অনলাইন রুম (ONLINE ROOM)
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    বন্ধুদের সাথে রুম কোড দিয়ে রিয়েল-টাইম মাল্টিপ্লেয়ার খেলুন
                  </p>
                </div>
              </div>
              <span className="text-emerald-400 text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                অথবা লোকাল এআই মোড (LOCAL MODES)
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Local Modes Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'classic' as GameMode, title: 'ক্লাসিক (CLASSIC)', desc: 'ঐতিহ্যবাহী লুডো নিয়মাবলী', icon: Dice5, color: 'border-amber-500/40 hover:border-amber-400' },
                { id: 'blitz' as GameMode, title: 'ব্লিটজ (BLITZ)', desc: '১ গুটি বাইরে, দ্রুত জয়', icon: Zap, color: 'border-cyan-500/40 hover:border-cyan-400' },
                { id: 'relic' as GameMode, title: 'রেলিক (RELIC HUNT)', desc: 'বোর্ডে ছড়িয়ে থাকা পাওয়ার-আপ', icon: Flame, color: 'border-purple-500/40 hover:border-purple-400' },
                { id: 'team' as GameMode, title: 'টিম ব্যাটল (2v2 TEAM)', desc: 'কোণাকুণি পার্টনার সাহায্য', icon: Shield, color: 'border-rose-500/40 hover:border-rose-400' },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      setStep('players');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : `bg-zinc-900/80 ${m.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white uppercase">{m.title}</span>
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Player Count Selection */}
        {step === 'players' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { count: 2, label: '২ জন (2 PLAYERS)', emoji: '2️⃣' },
                { count: 3, label: '৩ জন (3 PLAYERS)', emoji: '3️⃣' },
                { count: 4, label: '৪ জন (4 PLAYERS)', emoji: '4️⃣' },
              ].map(p => (
                <button
                  key={p.count}
                  type="button"
                  onClick={() => handlePlayerCountChange(p.count)}
                  className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    playerCount === p.count
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="font-black text-xs text-white">{p.label}</div>
                </button>
              ))}
            </div>

            {/* Player Slots Configuration Preview */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
                খেলোয়াড় কনফিগারেশন (HUMAN vs AI)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: playerCount }).map((_, i) => {
                  const realm = REALMS[playerRealms[i] || 0];
                  const isAI = slotIsAI[i];
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-white/10 bg-zinc-900/60 flex flex-col items-center gap-1.5 text-center"
                    >
                      <div className="text-xl">{realm?.emoji || '👑'}</div>
                      <span className="text-[11px] font-bold text-white truncate max-w-full">
                        {realm?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSlotIsAI(prev => {
                            const next = [...prev];
                            next[i] = !next[i];
                            return next;
                          });
                        }}
                        className={`w-full py-1 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          isAI
                            ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 hover:bg-purple-800'
                            : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-800'
                        }`}
                      >
                        {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{isAI ? 'এআই (AI)' : 'হিউম্যান (YOU)'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('mode')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                পিছনে (BACK)
              </button>
              <button
                type="button"
                onClick={() => setStep('custom')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-4 h-4" />
                <span>কাস্টমাইজ (CUSTOMIZE)</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customization & Rules */}
        {step === 'custom' && (
          <div className="space-y-4 text-xs">
            {/* AI Difficulty */}
            <div className="space-y-1.5">
              <span className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                এআই বুদ্ধিমত্তা (AI DIFFICULTY)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'apprentice' as AIDifficulty, label: 'সহজ (NOVICE)' },
                  { id: 'tactician' as AIDifficulty, label: 'ট্যাকটিশিয়ান (TACTICIAN)' },
                  { id: 'grandmaster' as AIDifficulty, label: 'মাস্টার (MASTER)' },
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setAiDifficulty(d.id)}
                    className={`py-2 px-1 rounded-lg border text-center font-bold text-[11px] uppercase transition-all cursor-pointer ${
                      aiDifficulty === d.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* House Rules Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] block">
                রুলস ও পাওয়ার-আপ (HOUSE RULES)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houseRules.enablePowerups}
                    onChange={e => setHouseRules(prev => ({ ...prev, enablePowerups: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span>ম্যাজিক পাওয়ার-আপ</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houseRules.threeSixesPenalty}
                    onChange={e => setHouseRules(prev => ({ ...prev, threeSixesPenalty: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span>৩ ছক্কায় জরিমানা</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houseRules.starBlessing}
                    onChange={e => setHouseRules(prev => ({ ...prev, starBlessing: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span>স্টার আশীর্বাদ</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houseRules.realmBlessing}
                    onChange={e => setHouseRules(prev => ({ ...prev, realmBlessing: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span>রিয়েলম স্পেশাল পাওয়ার</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('players')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                পিছনে (BACK)
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>ম্যাচ শুরু করুন (START GAME)</span>
              </button>
            </div>
          </div>
        )}

        {/* Ad Banner inside card */}
        <AdBanner type="banner_468x60" className="pt-2" />
      </div>

      {/* Bottom Ad Banner */}
      <AdBanner type="banner_468x60" className="w-full max-w-md shrink-0 my-1" />
    </div>
  );
};
