import React, { useState } from 'react';
import {
  BarChart2,
  Clock,
  HelpCircle,
  History,
  Languages,
  LogOut,
  Mic,
  MicOff,
  Moon,
  MoreVertical,
  Music,
  RotateCcw,
  Smile,
  Sparkles,
  Sun,
  Users,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Zap
} from 'lucide-react';
import { GameSettings } from '../types';
import { UserProfile } from '../services/firebase';
import { LatencyIndicator } from './LatencyIndicator';


interface TopBarProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onOpenRules: () => void;
  onOpenStats: () => void;
  onOpenMoveLog: () => void;
  onOpenOnlineRoom: () => void;
  activeRoomCode: string | null;
  onNewGame: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  voiceChatState?: { isMicOn: boolean; isSpeakerOn: boolean };
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
  onSendEmote?: (emoji: string) => void;
  onOpenExitModal?: () => void;
  userProfile?: UserProfile | null;
  onOpenLoginModal?: () => void;
  matchDurationSeconds?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  settings,
  onUpdateSettings,
  onOpenRules,
  onOpenStats,
  onOpenMoveLog,
  onOpenOnlineRoom,
  activeRoomCode,
  onNewGame,
  isLightMode,
  onToggleTheme,
  voiceChatState,
  onToggleMic,
  onToggleSpeaker,
  onSendEmote,
  onOpenExitModal,
  userProfile,
  onOpenLoginModal,
  matchDurationSeconds = 0
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const EMOTE_LIST = ['🔥', '😎', '⚔️', '😱', '👑', '💣', '🎲', '👏', '🎯', '🚀'];

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto flex items-center justify-between px-3 py-1.5 bg-zinc-950/95 border-b border-amber-500/40 font-mono text-white relative z-40 shadow-lg">
      {/* App Branding Title & User Badge */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg border border-amber-400/50 bg-black flex items-center justify-center text-base shadow-md">
          🎲
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-black text-sm sm:text-base uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
            <span>Portal <span className="text-[#FF4D00]">Ludo</span></span>
            {activeRoomCode && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#00FF41]/20 border border-[#00FF41] text-[#00FF41] rounded font-bold animate-pulse">
                {activeRoomCode}
              </span>
            )}
          </h1>

          {/* User Profile Badge */}
          {userProfile && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="mt-0.5 text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to Switch Account or View Profile"
            >
              <span>{userProfile.isGuest ? '👤' : '🌐'}</span>
              <span className="truncate max-w-[80px] sm:max-w-[110px] uppercase">{userProfile.displayName}</span>
              <span className="text-[#00FF41] font-mono">🏆{userProfile.totalWins || 0}</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Match Timer & Latency Indicator Pill - Center Space */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-1 bg-black/90 border border-amber-400/60 rounded-full text-xs font-mono font-bold text-amber-300 shadow-[0_0_12px_rgba(255,215,0,0.3)]">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{formatTimer(matchDurationSeconds)}</span>
        </div>

        {/* Mobile Battle Royale Style Real-Time WiFi Network Latency Indicator */}
        <LatencyIndicator size="sm" showQualityLabel={false} />
      </div>

      {/* Action Buttons: Online Quick Join + EXIT + 3-Dots Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenExitModal && (
          <button
            type="button"
            onClick={onOpenExitModal}
            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 hover:border-rose-500 text-rose-300 text-xs font-black uppercase tracking-wider rounded flex items-center gap-1 transition-all cursor-pointer shadow-md"
            title="Exit Game (গেম ত্যাগ করুন)"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>EXIT</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenOnlineRoom}
          className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border rounded cursor-pointer ${
            activeRoomCode
              ? 'border-[#00FF41] bg-[#00FF41]/20 text-[#00FF41]'
              : 'border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-white'
          }`}
          title="Play Online Multiplayer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{activeRoomCode ? 'ROOM' : 'ONLINE'}</span>
        </button>

        {/* 3-Dots Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMenu(prev => !prev)}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/50 rounded-lg text-white transition-all cursor-pointer hover:border-[#FF4D00] active:scale-95"
          title="Game Settings & Options (সব অপশন)"
        >
          <MoreVertical className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* 3-Dots Options Modal Dropdown */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-950 border-2 border-amber-500/80 p-4 shadow-2xl rounded-2xl text-white space-y-3.5 font-mono relative max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                  গেম অপশন ও সেটিং
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Emote Reactions Section */}
            {onSendEmote && (
              <div className="space-y-1.5 bg-zinc-900/90 p-2.5 rounded-xl border border-amber-500/30">
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>ইমোজি রিয়েকশন পাঠান (SEND EMOTE)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {EMOTE_LIST.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSendEmote(emoji);
                        setShowMenu(false);
                      }}
                      className="p-2 bg-black/60 hover:bg-[#FF4D00] hover:scale-125 transition-all text-base rounded-lg border border-white/10 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Options List */}
            <div className="space-y-2 text-xs">

              {/* Online Room */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenOnlineRoom();
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-[#FF4D00] hover:text-black border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>🌐 অনলাইন রুম (ONLINE MULTIPLAYER)</span>
                </span>
                <span className="text-[10px] opacity-70">{activeRoomCode ? activeRoomCode : 'JOIN'}</span>
              </button>

              {/* Game Speed */}
              <button
                type="button"
                onClick={() => {
                  const nextSpeed = settings.speed === 1 ? 1.5 : settings.speed === 1.5 ? 2.5 : 1;
                  onUpdateSettings({ speed: nextSpeed });
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FF4D00]" />
                  <span>⚡ গেম স্পিড (SPEED)</span>
                </span>
                <span className="px-2 py-0.5 bg-[#FF4D00]/20 text-[#FF4D00] rounded font-black">
                  {settings.speed}X
                </span>
              </button>

              {/* Voice Commentary ON/OFF Toggle */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceEnabled: !settings.voiceEnabled })}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {settings.voiceEnabled ? <Volume2 className="w-4 h-4 text-[#00FF41]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                  <span>🗣️ অডিও ধারাভাষ্য (VOICE COMMENTARY)</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-black ${settings.voiceEnabled ? 'text-[#00FF41] bg-[#00FF41]/20' : 'text-zinc-400 bg-zinc-800'}`}>
                  {settings.voiceEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Voice Oracle Language */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = settings.voiceLanguage === 'bn' ? 'en' : 'bn';
                  onUpdateSettings({ voiceLanguage: nextLang });
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span>🗣️ ধারাভাষ্য ভাষা (LANGUAGE)</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 rounded font-black">
                  {settings.voiceLanguage === 'bn' ? 'বাংলা' : 'ENGLISH'}
                </span>
              </button>

              {/* Sound Effects */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ soundMuted: !settings.soundMuted })}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {settings.soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#00FF41]" />}
                  <span>🔊 সাউন্ড ইফেক্ট (SOUND)</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-black ${settings.soundMuted ? 'text-rose-400 bg-rose-950' : 'text-[#00FF41] bg-[#00FF41]/20'}`}>
                  {settings.soundMuted ? 'MUTED' : 'ON'}
                </span>
              </button>

              {/* Music */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ ambientMusic: !settings.ambientMusic })}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>🎵 ব্যাকগ্রাউন্ড মিউজিক (MUSIC)</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-black ${settings.ambientMusic ? 'text-purple-300 bg-purple-950' : 'text-zinc-500 bg-zinc-900'}`}>
                  {settings.ambientMusic ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Voice Chat Mic Toggle (If in Room) */}
              {onToggleMic && (
                <button
                  type="button"
                  onClick={onToggleMic}
                  className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {voiceChatState?.isMicOn ? <Mic className="w-4 h-4 text-[#00FF41]" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                    <span>🎤 ভয়েস চ্যাট মাইক (MIC)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-black ${voiceChatState?.isMicOn ? 'text-[#00FF41] bg-[#00FF41]/20' : 'text-rose-400 bg-rose-950'}`}>
                    {voiceChatState?.isMicOn ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* Voice Chat Speaker Toggle (If in Room) */}
              {onToggleSpeaker && (
                <button
                  type="button"
                  onClick={onToggleSpeaker}
                  className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {voiceChatState?.isSpeakerOn ? <Volume2 className="w-4 h-4 text-[#00FF41]" /> : <Volume1 className="w-4 h-4 text-zinc-500" />}
                    <span>🔊 ভয়েস চ্যাট স্পিকার (SPEAKER)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-black ${voiceChatState?.isSpeakerOn ? 'text-[#00FF41] bg-[#00FF41]/20' : 'text-rose-400 bg-rose-950'}`}>
                    {voiceChatState?.isSpeakerOn ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isLightMode ? <Moon className="w-4 h-4 text-[#FF4D00]" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>☀️ লাইট / ডার্ক থিম (THEME)</span>
                </span>
                <span className="text-zinc-400 font-bold">{isLightMode ? 'LIGHT' : 'DARK'}</span>
              </button>

              {/* Move Log */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenMoveLog();
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  <span>📜 মুভ হিস্ট্রি (MOVE LOG)</span>
                </span>
              </button>

              {/* Match Stats */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenStats();
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                  <span>📊 ম্যাচ স্ট্যাটাস (STATISTICS)</span>
                </span>
              </button>

              {/* Rules / How to play */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenRules();
                }}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <span>❓ কিভাবে খেলবেন? (RULES)</span>
                </span>
              </button>

              {/* New Game */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onNewGame();
                }}
                className="w-full p-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-xl flex items-center justify-between font-bold uppercase transition-all cursor-pointer mt-2"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>🔄 নতুন খেলা শুরু (NEW MATCH)</span>
                </span>
              </button>

            </div>

          </div>
        </div>
      )}
    </header>
  );
};
