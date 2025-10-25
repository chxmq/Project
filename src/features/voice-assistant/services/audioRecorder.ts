export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      if (this.mediaRecorder.state !== 'recording') {
        reject(new Error('MediaRecorder is not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Validate blob
          if (audioBlob.size === 0) {
            this.cleanupInternal();
            reject(new Error('No audio data recorded'));
            return;
          }
          
          this.cleanupInternal();
          console.log('Recording stopped, blob size:', audioBlob.size);
          resolve(audioBlob);
        } catch (error) {
          this.cleanupInternal();
          reject(new Error(`Failed to create audio blob: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        this.cleanupInternal();
        reject(new Error(`Recording error: ${error}`));
      };

      try {
        this.mediaRecorder.stop();
      } catch (error) {
        this.cleanupInternal();
        reject(new Error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  private cleanupInternal(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Add cleanup method for component unmount
  public cleanup(): void {
    this.cleanupInternal();
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
