export interface VoiceChatState {
  isMicOn: boolean;
  isSpeakerOn: boolean;
  connectedPeers: string[];
  speakingPlayers: Record<string, boolean>;
}

export interface VoiceDiagnostics {
  isSynced: boolean;
  connectedCount: number;
  expectedCount: number;
  missingPeerIds: string[];
  connectedPeerIds: string[];
}

export function verifyPeerConnections(
  connectedPeers: string[] = [],
  expectedPlayerIds: string[] = [],
  myUserId: string = ''
): VoiceDiagnostics {
  const otherExpected = expectedPlayerIds.filter(id => id && id !== myUserId);
  const connected = otherExpected.filter(id => connectedPeers.includes(id));
  const missing = otherExpected.filter(id => !connectedPeers.includes(id));

  return {
    isSynced: otherExpected.length === 0 || missing.length === 0,
    connectedCount: connected.length,
    expectedCount: otherExpected.length,
    missingPeerIds: missing,
    connectedPeerIds: connected
  };
}

class VoiceChatService {
  private isMicOn: boolean = true;
  private isSpeakerOn: boolean = true;
  private stateChangeCallback: ((state: VoiceChatState) => void) | null = null;
  private localStream: MediaStream | null = null;
  private connectedPeers: string[] = [];
  private speakingPlayers: Record<string, boolean> = {};

  public async startVoiceChat(
    _roomCode: string,
    myUid: string,
    allPlayerIds: string[],
    onStateChange: (state: VoiceChatState) => void
  ): Promise<void> {
    this.stateChangeCallback = onStateChange;
    this.connectedPeers = allPlayerIds.filter(id => id && id !== myUid);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      }
    } catch {
      // Audio capture fallback
    }

    this.notifyState();
  }

  public stopVoiceChat(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.connectedPeers = [];
    this.speakingPlayers = {};
    this.notifyState();
  }

  public async toggleMic(): Promise<boolean> {
    this.isMicOn = !this.isMicOn;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = this.isMicOn;
      });
    }
    this.notifyState();
    return this.isMicOn;
  }

  public toggleSpeaker(): boolean {
    this.isSpeakerOn = !this.isSpeakerOn;
    this.notifyState();
    return this.isSpeakerOn;
  }

  public resyncVoiceChat(allPlayerIds: string[]): void {
    this.connectedPeers = [...allPlayerIds];
    this.notifyState();
  }

  private notifyState(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback({
        isMicOn: this.isMicOn,
        isSpeakerOn: this.isSpeakerOn,
        connectedPeers: this.connectedPeers,
        speakingPlayers: this.speakingPlayers
      });
    }
  }
}

export const voiceChatService = new VoiceChatService();
