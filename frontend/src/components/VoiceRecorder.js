import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Platform, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { audioService } from '../services/audio';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function VoiceRecorder({ language = 'English', onTranscript, isProcessing = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showDictateModal, setShowDictateModal] = useState(false);
  const [dictatedText, setDictatedText] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingInstanceRef = useRef(null);
  const webRecognizerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const t = translations[language] || translations.English;

  // 5 animated wave bars
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

  const toggleRecording = async () => {
    if (isProcessing || isTranscribing) return;

    if (isRecording) {
      // STOP RECORDING
      setIsRecording(false);
      stopTimer();

      if (Platform.OS === 'web') {
        if (webRecognizerRef.current) {
          try {
            webRecognizerRef.current.stop();
          } catch (e) {
            // ignore
          }
        }
      } else {
        // MOBILE (Expo Go on Android / iOS)
        setIsTranscribing(true);
        try {
          const uri = await audioService.stopRecording(recordingInstanceRef.current);
          recordingInstanceRef.current = null;

          if (uri) {
            // Upload audio to FastAPI backend
            const transcript = await api.uploadAudio(uri, language);
            if (transcript && onTranscript) {
              onTranscript(transcript);
            }
          }
        } catch (e) {
          console.warn("Mobile stop recording error:", e);
          Alert.alert("Recording Error", "Could not process audio. Please try again or use voice typing.");
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      // START RECORDING
      if (Platform.OS === 'web') {
        const recognizer = audioService.createSpeechRecognizer(
          language,
          (text) => {
            setIsRecording(false);
            stopTimer();
            if (onTranscript) onTranscript(text);
          },
          (error) => {
            console.warn("Speech error:", error);
            setIsRecording(false);
            stopTimer();
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
          } catch (e) {
            console.warn("Could not start web recognition:", e);
          }
        } else {
          // If browser speech recognition is not supported (e.g. non-Chrome)
          setShowDictateModal(true);
        }
      } else {
        // MOBILE (Expo Go on Android / iOS)
        try {
          const recording = await audioService.startRecording((status) => {
            // metering updates if needed
          });
          recordingInstanceRef.current = recording;
          setIsRecording(true);
          startTimer();
        } catch (err) {
          console.warn("Could not start hardware recording:", err);
          Alert.alert(
            "Microphone Permission",
            "Please allow microphone access in Expo Go to record your complaint.",
            [
              { text: "OK" },
              { text: "Use Voice Typing", onPress: () => setShowDictateModal(true) }
            ]
          );
        }
      }
    }
  };

  const handleSendDictated = () => {
    if (dictatedText.trim()) {
      setShowDictateModal(false);
      const text = dictatedText.trim();
      setDictatedText("");
      if (onTranscript) onTranscript(text);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hintText}>
        {isRecording
          ? `${t.speakNow} (${formatSeconds(recordingDuration)})`
          : isTranscribing
          ? "Transcribing voice with AI..."
          : isProcessing
          ? "Processing complaint..."
          : t.tapToSpeak}
      </Text>

      {/* Animated Sound Wave Bar Visualization */}
      {isRecording && (
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
      )}

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
          onPress={toggleRecording}
          disabled={isProcessing || isTranscribing}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={isRecording ? "stop" : isTranscribing || isProcessing ? "hourglass-empty" : "mic"}
            size={34}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.subtext}>
          {isRecording
            ? t.recording
            : isTranscribing
            ? "Converting speech to complaint text..."
            : "Tap mic to speak, or use voice dictation button"}
        </Text>

        {/* Alternative Voice Dictation Button */}
        {!isRecording && !isProcessing && !isTranscribing && (
          <TouchableOpacity
            style={styles.dictatePill}
            onPress={() => setShowDictateModal(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="keyboard-voice" size={16} color="#2563EB" />
            <Text style={styles.dictatePillText}>Voice Dictate</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Voice Dictation Modal */}
      <Modal
        visible={showDictateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDictateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="record-voice-over" size={22} color="#1E3A8A" />
              <Text style={styles.modalTitle}>Speak Your Complaint</Text>
              <TouchableOpacity onPress={() => setShowDictateModal(false)}>
                <MaterialIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Tap the microphone key on your mobile keyboard to dictate in Hindi, Bengali, or English:
            </Text>

            <TextInput
              style={styles.modalInput}
              multiline
              autoFocus
              numberOfLines={4}
              placeholder="Speak or type what happened (e.g. Someone called from bank, 15000 was deducted via UPI...)"
              placeholderTextColor="#94A3B8"
              value={dictatedText}
              onChangeText={setDictatedText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDictateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, !dictatedText.trim() && styles.modalSubmitDisabled]}
                onPress={handleSendDictated}
                disabled={!dictatedText.trim()}
              >
                <MaterialIcons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Submit Voice Note</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  hintText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    marginBottom: 8
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#DC2626',
    borderRadius: 2
  },
  micWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 38, 38, 0.25)'
  },
  micButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
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
  bottomRow: {
    alignItems: 'center',
    marginTop: 8
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16
  },
  dictatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6
  },
  dictatePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
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
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
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
