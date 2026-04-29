/**
 * Thin wrapper over the Web Speech API.
 *
 * Reality check: Web Speech API support is messy.
 * - Chrome / Edge: works well, requires internet (uses Google servers)
 * - Safari: partial support, often requires user gesture
 * - Firefox / Brave: usually disabled or behind a flag
 *
 * The most common failure modes are:
 * - `not-allowed` — user denied the mic permission
 * - `network`     — offline or DNS issue
 * - `aborted`     — user navigated / clicked something else
 * - `no-speech`   — silence for too long
 *
 * We surface those clearly via onError so the caller can show a useful message.
 */

const getSpeechRecognitionClass = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const isVoiceSupported = () => !!getSpeechRecognitionClass();

const FRIENDLY_ERROR_MESSAGES = {
  'not-allowed':
    'Microphone permission was blocked. Click the camera/lock icon next to the address bar and allow microphone access.',
  'service-not-allowed':
    'Voice recognition was blocked by your browser settings.',
  'no-speech':
    'I didn\'t hear anything. Try again, a bit closer to the mic.',
  'audio-capture':
    'No microphone detected. Make sure one is plugged in and not in use by another app.',
  'network':
    'Voice recognition needs an internet connection. Check that you\'re online.',
  'aborted':
    'Voice capture was cancelled.',
  'bad-grammar':
    'Couldn\'t parse what you said. Try again.',
  'language-not-supported':
    'This language isn\'t supported by your browser\'s voice engine.'
};

const friendlyMessageFor = (errorCode) =>
  FRIENDLY_ERROR_MESSAGES[errorCode] || `Voice error: ${errorCode || 'unknown'}.`;

/**
 * Best-effort precheck for microphone permission. Returns one of:
 *   'granted' | 'denied' | 'prompt' | 'unsupported'
 */
export const checkMicrophonePermission = async () => {
  try {
    if (!navigator.permissions?.query) return 'unsupported';
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'unsupported';
  }
};

export const startSpeechRecognition = ({
  lang = 'en-US',
  continuous = false,
  interimResults = true,
  onResult,
  onError,
  onEnd,
  onStart
} = {}) => {
  const SpeechRecognition = getSpeechRecognitionClass();
  if (!SpeechRecognition) {
    throw new Error(
      'Voice input isn\'t supported in this browser. Try Chrome or Edge on a desktop.'
    );
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript.trim(), event);
  };

  recognition.onerror = (event) => {
    if (onError) {
      onError({
        code: event.error,
        message: friendlyMessageFor(event.error),
        raw: event
      });
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    // Calling .start() twice or while already running throws InvalidStateError.
    if (onError) {
      onError({
        code: 'start-failed',
        message: err?.message || 'Couldn\'t start voice recognition.',
        raw: err
      });
    }
    throw err;
  }

  return recognition;
};

export const stopSpeechRecognition = (recognitionInstance) => {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {
      // Already stopped — ignore.
    }
  }
};
