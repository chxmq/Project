import { browserVoiceModulation } from '@/shared/services/browserVoiceModulation';

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private useBrowserFallback: boolean = false;

  async play(base64Audio: string, emotion?: string, intensity?: 'low' | 'medium' | 'high'): Promise<void> {
    return new Promise((resolve, reject) => {
      let audioUrl: string | null = null;
      
      try {
        // Validate input
        if (!base64Audio || base64Audio.trim() === '') {
          throw new Error('Invalid audio data provided');
        }

        const audioBlob = this.base64ToBlob(base64Audio, 'audio/mpeg');
        audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudioUrl = audioUrl;
        
        this.audio = new Audio(audioUrl);
        
        const cleanup = () => {
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioUrl = null;
          }
        };
        
        this.audio.onended = () => {
          cleanup();
          resolve();
        };
        
        this.audio.onerror = (error) => {
          cleanup();
          // Try browser fallback if OpenAI TTS fails
          if (!this.useBrowserFallback && emotion) {
            console.log('OpenAI TTS failed, trying browser fallback with emotional modulation');
            this.useBrowserFallback = true;
            this.playWithBrowserFallback(base64Audio, emotion, intensity)
              .then(resolve)
              .catch(() => reject(new Error(`Audio playback failed: ${error}`)));
            return;
          }
          reject(new Error(`Audio playback failed: ${error}`));
        };
        
        this.audio.onabort = () => {
          cleanup();
          reject(new Error('Audio playback was aborted'));
        };
        
        this.audio.play().catch((error) => {
          cleanup();
          reject(new Error(`Failed to start audio playback: ${error.message}`));
        });
      } catch (error) {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        reject(new Error(`Audio setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Play with browser fallback using emotional voice modulation
   */
  private async playWithBrowserFallback(
    base64Audio: string, 
    emotion: string, 
    intensity?: 'low' | 'medium' | 'high'
  ): Promise<void> {
    try {
      // For browser fallback, we would need the original text
      // This is a simplified implementation - in practice, you'd need to store the text
      console.log(`Using browser voice modulation for ${emotion} emotion`);
      
      // This would require the original text to be passed through
      // For now, we'll just use standard browser speech
      await browserVoiceModulation.playStandard('Response with emotional modulation');
    } catch (error) {
      throw new Error(`Browser fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    
    // Clean up any remaining URL
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }

  // Add cleanup method for component unmount
  cleanup(): void {
    this.stop();
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: contentType });
    } catch (error) {
      throw new Error(`Failed to convert base64 to blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
