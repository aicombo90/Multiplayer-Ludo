import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Wifi, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { verifyPeerConnections } from '../services/voiceChat';

interface VoiceChatControlsProps {
  isMicOn: boolean;
  isSpeakerOn: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  disabled?: boolean;
  connectedPeers?: string[];
  expectedPlayerIds?: string[];
  myUserId?: string;
  onResync?: () => void;
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  isMicOn,
  isSpeakerOn,
  onToggleMic,
  onToggleSpeaker,
  disabled,
  connectedPeers = [],
  expectedPlayerIds = [],
  myUserId = '',
  onResync
}) => {
  const [showDiagModal, setShowDiagModal] = useState<boolean>(false);
  const [isResyncing, setIsResyncing] = useState<boolean>(false);

  const diag = verifyPeerConnections(connectedPeers, expectedPlayerIds, myUserId);

  const handleResync = async () => {
    if (!onResync) return;
    setIsResyncing(true);
    try {
      await onResync();
    } finally {
      setTimeout(() => setIsResyncing(false), 800);
    }
  };

  return (
    <div className="relative flex items-center gap-1.5 p-1 bg-zinc-950 border border-white/20 rounded-md shadow-md">
      {/* 🎤 Microphone Button (Mute / Unmute) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleMic}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase tracking-wider border rounded transition-all cursor-pointer ${
          isMicOn
            ? 'bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41]/30 shadow-[0_0_8px_rgba(0,255,65,0.4)]'
            : 'bg-rose-950/80 border-rose-600 text-rose-400 hover:bg-rose-900'
        }`}
        title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {isMicOn ? (
          <>
            <Mic className="w-3.5 h-3.5 text-[#00FF41] animate-pulse" />
            <span>MIC ON</span>
          </>
        ) : (
          <>
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
            <span>MIC OFF</span>
          </>
        )}
      </button>

      {/* 🔊 Speaker Button (Incoming Audio ON / OFF) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleSpeaker}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase tracking-wider border rounded transition-all cursor-pointer ${
          isSpeakerOn
            ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/30 shadow-[0_0_8px_rgba(255,215,0,0.4)]'
            : 'bg-zinc-900 border-white/30 text-white/50 hover:text-white'
        }`}
        title={isSpeakerOn ? 'Turn Off Speaker Audio' : 'Turn On Speaker Audio'}
      >
        {isSpeakerOn ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>SPEAKER ON</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-white/50" />
            <span>SPEAKER OFF</span>
          </>
        )}
      </button>

      {/* 🟢/🟡 Visual 'Connection Health' Indicator */}
      {expectedPlayerIds.length > 1 && (
        <button
          type="button"
          onClick={() => setShowDiagModal(true)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase border rounded transition-all cursor-pointer ${
            diag.isSynced
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 hover:bg-emerald-900/80'
              : 'bg-amber-950/90 border-amber-500 text-amber-300 hover:bg-amber-900 animate-pulse'
          }`}
          title={
            diag.isSynced
              ? `Voice Connection Health: Healthy (${diag.connectedCount}/${diag.expectedCount} connected)`
              : `Voice Sync Warning: ${diag.missingPeerIds.length} peer(s) missing connection. Click for diagnostics.`
          }
        >
          {diag.isSynced ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>SYNCED ({diag.connectedCount}/{diag.expectedCount})</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>WARN ({diag.connectedCount}/{diag.expectedCount})</span>
            </>
          )}
        </button>
      )}

      {/* 🔍 Connection Health & Peer Sync Diagnostic Modal */}
      {showDiagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-white/30 p-5 shadow-2xl rounded-lg font-mono text-white space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                {diag.isSynced ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
                <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                  Voice Chat Diagnostic
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Health Status Summary */}
            <div className={`p-3 border rounded text-xs leading-relaxed ${
              diag.isSynced
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-sm mb-1">
                <span>STATUS: {diag.isSynced ? 'ALL PEERS CONNECTED' : 'PEER SYNC MISMATCH'}</span>
                <span>{diag.connectedCount} / {diag.expectedCount} Connected</span>
              </div>
              <p className="text-[11px] opacity-90">
                {diag.isSynced
                  ? 'WebRTC peer-to-peer audio channels are fully established with all room participants.'
                  : `Warning: You are currently missing audio connection with ${diag.missingPeerIds.length} player(s).`}
              </p>
            </div>

            {/* Peer List Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-white/80 uppercase text-[11px]">
                Expected Room Participants ({expectedPlayerIds.length}):
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-white/10 p-2 bg-black/60 rounded">
                {expectedPlayerIds.map(id => {
                  const isSelf = id === myUserId;
                  const isConnected = connectedPeers.includes(id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-1.5 rounded bg-zinc-900 border border-white/10 text-[11px]"
                    >
                      <div className="truncate font-mono">
                        <span className="text-white/50">{isSelf ? '[YOU] ' : '[PEER] '}</span>
                        <span className="font-bold text-white">{id}</span>
                      </div>
                      <div>
                        {isSelf ? (
                          <span className="text-white/40 text-[10px] font-bold uppercase">LOCAL</span>
                        ) : isConnected ? (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase">
                            CONNECTED
                          </span>
                        ) : (
                          <span className="bg-rose-950 text-rose-400 border border-rose-600/60 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase">
                            DISCONNECTED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/20">
              {onResync && (
                <button
                  type="button"
                  onClick={handleResync}
                  disabled={isResyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4D00] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded border border-[#FF4D00] transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin' : ''}`} />
                  <span>{isResyncing ? 'RE-CONNECTING...' : 'RE-CONNECT VOICE'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDiagModal(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded border border-white/20 transition-all cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
