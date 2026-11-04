export interface SpeechOptions {
  lang?: 'en-GB' | 'en-US';
  rate?: number; // 0.8 para estudiantes principiantes / niños
  pitch?: number; // 1.0 a 1.1 para tono amigable
  volume?: number; // 0.0 a 1.0
}

export interface ISpeechService {
  isSupported(): boolean;
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stop(): void;
  getAvailableVoices(): Promise<SpeechSynthesisVoice[]>;
}

class SpeechService implements ISpeechService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported() || !text) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'en-GB';
      utterance.rate = options.rate ?? 0.85;
      utterance.pitch = options.pitch ?? 1.05;
      utterance.volume = options.volume ?? 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve([]);
        return;
      }

      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    });
  }
}

export const speechService = new SpeechService();
