import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { audioService } from '../services/audio';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function VoiceRecorder({ language = 'English', onTranscript, isProcessing = false }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const webRecognizerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const t = translations[language] || translations.English;

  // Animated wave bars (5 live bars)
  const waveBars = [
    useRef(new Animated.Value(6)).current,
    useRef(new Animated.Value(14)).current,
    useRef(new Animated.Value(22)).current,
    useRef(new Animated.Value(12)).current,
    useRef(new Animated.Value(8)).current,
  ];

  useEffect(() => {
    let pulseLoop;
    let waveLoops = [];

    if (isRecording) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();

      waveBars.forEach((bar, idx) => {
        const minH = 6;
        const maxH = 26 + (idx % 3) * 6;
        const waveLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: maxH,
              duration: 250 + idx * 70,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false
            }),
            Animated.timing(bar, {
              toValue: minH,
              duration: 250 + idx * 70,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false
            })
          ])
        );
        waveLoop.start();
        waveLoops.push(waveLoop);
      });
    } else {
      pulseAnim.setValue(1);
      waveBars.forEach((bar) => bar.setValue(8));
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      waveLoops.forEach((l) => l.stop());
    };
  }, [isRecording]);

  const startTimer = () => {
    setRecordingDuration(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMicPress = async () => {
    if (isProcessing || isTranscribing) return;

    if (isRecording) {
      // 1. STOP RECORDING
      setIsRecording(false);
      stopTimer();

      if (Platform.OS === 'web' && webRecognizerRef.current) {
        try {
          webRecognizerRef.current.stop();
        } catch (e) {
          // ignore
        }
        webRecognizerRef.current = null;
        return;
      }

      // Stop native hardware recorder
      setIsTranscribing(true);
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          const transcript = await api.uploadAudio(uri, language);
          if (transcript && onTranscript) {
            onTranscript(transcript);
          }
        }
      } catch (err) {
        console.warn("Stop recording error:", err);
        setShowVoiceModal(true);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // 2. START RECORDING
      // Web platform: Try Web Speech API for immediate streaming speech-to-text
      if (Platform.OS === 'web') {
        const recognizer = audioService.createSpeechRecognizer(
          language,
          (text) => {
            setIsRecording(false);
            stopTimer();
            if (onTranscript) onTranscript(text);
          },
          async (error) => {
            console.warn("Web Speech API note, falling back to audio recorder:", error);
            try {
              await recorder.prepareToRecordAsync();
              recorder.record();
              setIsRecording(true);
              startTimer();
            } catch (recErr) {
              setShowVoiceModal(true);
            }
          },
          () => {
            setIsRecording(false);
            stopTimer();
          }
        );

        if (recognizer) {
          webRecognizerRef.current = recognizer;
          try {
            recognizer.start();
            setIsRecording(true);
            startTimer();
            return;
          } catch (e) {
            console.warn("Web recognizer start failed:", e);
          }
        }
      }

      // Native mobile hardware recording (Android / iOS)
      try {
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== 'granted') {
          setShowVoiceModal(true);
          return;
        }

        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
        startTimer();
      } catch (err) {
        console.warn("Audio recording start error:", err);
        // Fallback to dictation note modal if hardware recording encounters issues
        setShowVoiceModal(true);
      }
    }
  };

  const handleSendSpokenText = () => {
    const text = spokenText.trim();
    if (text) {
      setShowVoiceModal(false);
      setSpokenText("");
      if (onTranscript) onTranscript(text);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hintText}>
        {isTranscribing
          ? "Transcribing your voice..."
          : isRecording
          ? `${t.speakNow} (${formatSeconds(recordingDuration)})`
          : isProcessing
          ? "Processing complaint..."
          : t.voiceInputTitle || t.tapToSpeak}
      </Text>

      {/* Animated Sound Wave Bar Visualization & Timer */}
      {isRecording && (
        <View style={styles.recordingStatusRow}>
          <View style={styles.liveBadge}>
            <View style={styles.redDot} />
            <Text style={styles.timerText}>{formatSeconds(recordingDuration)}</Text>
          </View>
          <View style={styles.waveformContainer}>
            {waveBars.map((barAnim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.waveformBar,
                  { height: barAnim }
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Central Microphone Button */}
      <View style={styles.micWrapper}>
        {isRecording && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] }
            ]}
          />
        )}
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording ? styles.micButtonRecording : styles.micButtonIdle,
            (isProcessing || isTranscribing) && styles.micButtonDisabled
          ]}
          onPress={handleMicPress}
          disabled={isProcessing || isTranscribing}
          activeOpacity={0.8}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons
              name={isRecording ? "stop" : isProcessing ? "hourglass-empty" : "mic"}
              size={36}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subtext}>
        {isTranscribing
          ? "Extracting details from voice note..."
          : isRecording
          ? t.stopRecording || "Tap red button to finish and send voice"
          : "Tap microphone to speak your cyber fraud complaint"}
      </Text>

      {/* Voice Dictation Sheet Fallback (If mic permissions blocked) */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialIcons name="mic" size={22} color="#2563EB" />
                <Text style={styles.modalTitle}>Voice Complaint Input</Text>
              </View>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Tap the microphone icon on your keyboard to speak in Hindi, Bengali, or English:
            </Text>

            <TextInput
              style={styles.modalInput}
              multiline
              autoFocus
              numberOfLines={4}
              placeholder={
                language === "Hindi"
                  ? "यहाँ बोलें या लिखें (जैसे: बैंक अधिकारी बनकर फोन आया था, 15000 रुपये कट गए...)"
                  : language === "Bengali"
                  ? "এখানে বলুন বা লিখুন (যেমন: ব্যাঙ্ক কর্মী সেজে ফোন করেছিল, ১৫০০০ টাকা কেটে নিয়েছে...)"
                  : "Speak or type here (e.g. Someone called from bank, 15000 was deducted via UPI...)"
              }
              placeholderTextColor="#94A3B8"
              value={spokenText}
              onChangeText={setSpokenText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowVoiceModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, !spokenText.trim() && styles.modalSubmitDisabled]}
                onPress={handleSendSpokenText}
                disabled={!spokenText.trim()}
                activeOpacity={0.85}
              >
                <MaterialIcons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Submit Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  hintText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center'
  },
  recordingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626'
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#DC2626',
    borderRadius: 2
  },
  micWrapper: {
    width: 82,
    height: 82,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  pulseRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(220, 38, 38, 0.25)'
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  micButtonIdle: {
    backgroundColor: '#2563EB'
  },
  micButtonRecording: {
    backgroundColor: '#DC2626'
  },
  micButtonDisabled: {
    backgroundColor: '#94A3B8'
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
    lineHeight: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  closeBtn: {
    padding: 4
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 14
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  modalSubmitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  modalSubmitDisabled: {
    backgroundColor: '#94A3B8'
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
