import { ORACLE_COMMENTARY } from '../constants/gameConstants';

class VoiceAssistant {
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private language: 'bn' | 'en' = 'bn';
  private enabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.updateVoices();
      window.speechSynthesis.onvoiceschanged = () => this.updateVoices();
    }
  }

  private updateVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    const isExplicitlyMale = (v: SpeechSynthesisVoice) => /\bmale\b/i.test(v.name) && !/female/i.test(v.name);
    const isExplicitlyFemale = (v: SpeechSynthesisVoice) => /female/i.test(v.name);
    const femaleHints = [
      'zira', 'samantha', 'victoria', 'karen', 'tessa', 'moira', 'susan', 'fiona',
      'kalpana', 'heera', 'google uk english female', 'google us english', 'shreya',
      'veena', 'lekha', 'aditi', 'female'
    ];
    const looksFemale = (v: SpeechSynthesisVoice) => femaleHints.some(h => v.name.toLowerCase().includes(h));

    // Try finding language-specific female voice first
    const langCode = this.language === 'bn' ? 'bn' : 'en';
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));

    const femaleLangVoice = langVoices.find(v => isExplicitlyFemale(v) || looksFemale(v));
    if (femaleLangVoice) {
      this.femaleVoice = femaleLangVoice;
      return;
    }

    const neutralLangVoice = langVoices.find(v => !isExplicitlyMale(v));
    if (neutralLangVoice) {
      this.femaleVoice = neutralLangVoice;
      return;
    }

    // Global fallback female voice
    const anyFemale = voices.find(v => isExplicitlyFemale(v) || looksFemale(v));
    this.femaleVoice = anyFemale || voices.find(v => !isExplicitlyMale(v)) || voices[0] || null;
  }

  public setLanguage(lang: 'bn' | 'en'): void {
    this.language = lang;
    this.updateVoices();
  }

  public getLanguage(): 'bn' | 'en' {
    return this.language;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public speak(text: string, onEnd?: () => void): void {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';

      if (this.femaleVoice) {
        utter.voice = this.femaleVoice;
      }

      // Warm, pleasant pitch & speed adjustments
      utter.pitch = 1.2;
      utter.rate = 0.98;
      utter.volume = 1;

      if (onEnd) {
        utter.onend = () => onEnd();
        utter.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utter);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public getCommentary(key: string): string {
    const list = ORACLE_COMMENTARY[key];
    if (Array.isArray(list) && list.length > 0) {
      return list[Math.floor(Math.random() * list.length)];
    }
    return '';
  }
}


export const voiceAssistant = new VoiceAssistant();
