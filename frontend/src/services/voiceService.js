// Placeholder voice service - no actual implementation
// This is just a placeholder as per requirements

export const transcribeAudio = async (audioBlob) => {
  // Placeholder - returns mock transcription
  // In future, this would call the backend voice transcription endpoint
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: 'Voice transcription coming soon. Please use text input for now.'
      });
    }, 500);
  });
};

export const isVoiceSupported = () => {
  // Check if browser supports voice recording
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};
