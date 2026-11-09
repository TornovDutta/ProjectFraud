import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export const audioService = {
  // 1. Text-to-Speech (Reads AI replies to user in Hindi / Bengali / English)
  async speak(text, language = 'English') {
    if (!text) return;

    let langCode = 'en-IN';
    if (language === 'Hindi') langCode = 'hi-IN';
    if (language === 'Bengali') langCode = 'bn-IN';

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } else {
        try {
          await Speech.stop();
          Speech.speak(text, {
            language: langCode,
            pitch: 1.0,
            rate: 0.95
          });
        } catch (speechErr) {
          console.warn("Expo Speech error:", speechErr);
        }
      }
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  },

  async stopSpeaking() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else {
        try {
          await Speech.stop();
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  },

  // 2. Web Speech API Recognizer (Runs in browsers like Chrome on mobile or desktop)
  createSpeechRecognizer(language = 'English', onResult, onError, onEnd) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        let langCode = 'en-IN';
        if (language === 'Hindi') langCode = 'hi-IN';
        if (language === 'Bengali') langCode = 'bn-IN';
        recognition.lang = langCode;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (onResult) onResult(transcript);
        };
        recognition.onerror = (event) => {
          if (onError) onError(event.error);
        };
        recognition.onend = () => {
          if (onEnd) onEnd();
        };
        return recognition;
      }
    }
    return null;
  }
};
