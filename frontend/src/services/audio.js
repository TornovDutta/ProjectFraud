import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export const audioService = {
  // 1. Text-to-Speech (Speaks AI replies to user)
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
        await Speech.stop();
        Speech.speak(text, {
          language: langCode,
          pitch: 1.0,
          rate: 0.95
        });
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
        await Speech.stop();
      }
    } catch (e) {
      // ignore
    }
  },

  // 2. Hardware Microphone Recording (Expo AV on mobile)
  async requestPermissions() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
      }
      return true;
    } catch (e) {
      console.warn("Permission request error:", e);
      return false;
    }
  },

  async startRecording(onStatusUpdate) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Microphone permission denied");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onStatusUpdate,
        150
      );
      return recording;
    } catch (e) {
      console.warn("Failed to start hardware recording:", e);
      throw e;
    }
  },

  async stopRecording(recordingInstance) {
    if (!recordingInstance) return null;
    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      // Reset audio mode to standard playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true
      });
      return uri;
    } catch (e) {
      console.warn("Failed to stop recording:", e);
      return null;
    }
  },

  // 3. Web Speech Recognition (for browser environments)
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
