// Browser-based Voice Modulation using SpeechSynthesisUtterance
import { createEmotionalUtterance } from './emotionalVoiceModulation';

export interface BrowserVoiceConfig {
  enabled: boolean;
  fallbackToBrowser: boolean;
  useEmotionalModulation: boolean;
}

export class BrowserVoiceModulation {
  private config: BrowserVoiceConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(config: BrowserVoiceConfig = {
    enabled: true,
    fallbackToBrowser: true,
    useEmotionalModulation: true
  }) {
    this.config = config;
  }

  /**
   * Play text with emotional voice modulation using browser's Speech Synthesis
   */
  async playWithEmotion(
    text: string, 
    emotion: string, 
    intensity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Browser voice modulation is disabled');
    }

    return new Promise((resolve, reject) => {
      try {
        // Stop any current speech
        this.stop();

        // Create emotional utterance
        const utterance = createEmotionalUtterance(text, emotion, intensity);
        
        // Set up event handlers
        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (error) => {
          this.currentUtterance = null;
          reject(new Error(`Speech synthesis error: ${error.error}`));
        };

        utterance.onstart = () => {
          console.log(`Speaking with ${emotion} emotion (${intensity} intensity)`);
        };

        // Store current utterance for control
        this.currentUtterance = utterance;

        // Start speaking
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(new Error(`Failed to create emotional utterance: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Play text with standard voice (no emotional modulation)
   */
  async playStandard(text: string): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Browser voice modulation is disabled');
    }

    return new Promise((resolve, reject) => {
      try {
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (error) => {
          this.currentUtterance = null;
          reject(new Error(`Speech synthesis error: ${error.error}`));
        };

        this.currentUtterance = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(new Error(`Failed to create standard utterance: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.currentUtterance && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.currentUtterance && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return speechSynthesis.speaking;
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return speechSynthesis.paused;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  /**
   * Get voice by name
   */
  getVoiceByName(name: string): SpeechSynthesisVoice | undefined {
    const voices = this.getAvailableVoices();
    return voices.find(voice => voice.name.includes(name));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BrowserVoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
  }
}

// Export singleton instance
export const browserVoiceModulation = new BrowserVoiceModulation();
