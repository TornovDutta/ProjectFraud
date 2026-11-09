import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Platform, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { audioService } from '../services/audio';
import { translations } from '../services/i18n';

export default function VoiceRecorder({ language = 'English', onTranscript, isProcessing = false }) {
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const webRecognizerRef = useRef(null);
  const t = translations[language] || translations.English;

  // Animated wave bars
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

    if (isListening) {
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
  }, [isListening]);

  const handleMicPress = () => {
    if (isProcessing) return;

    if (Platform.OS === 'web') {
      // Browser Web Speech Recognition
      if (isListening) {
        setIsListening(false);
        if (webRecognizerRef.current) {
          try {
            webRecognizerRef.current.stop();
          } catch (e) {
            // ignore
          }
        }
      } else {
        const recognizer = audioService.createSpeechRecognizer(
          language,
          (text) => {
            setIsListening(false);
            if (onTranscript) onTranscript(text);
          },
          (error) => {
            console.warn("Speech recognition error:", error);
            setIsListening(false);
            // Open dictation modal if browser speech recognition is denied
            setShowVoiceModal(true);
          },
          () => {
            setIsListening(false);
          }
        );

        if (recognizer) {
          webRecognizerRef.current = recognizer;
          try {
            recognizer.start();
            setIsListening(true);
          } catch (e) {
            console.warn("Could not start web speech recognizer:", e);
            setShowVoiceModal(true);
          }
        } else {
          setShowVoiceModal(true);
        }
      }
    } else {
      // Mobile (Expo Go): Open native voice dictation sheet with zero native module crashes
      setShowVoiceModal(true);
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
        {isListening
          ? t.speakNow
          : isProcessing
          ? "Processing complaint..."
          : t.tapToSpeak}
      </Text>

      {/* Animated Sound Wave Bar Visualization */}
      {isListening && (
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
        {isListening && (
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
            isListening ? styles.micButtonRecording : styles.micButtonIdle,
            isProcessing && styles.micButtonDisabled
          ]}
          onPress={handleMicPress}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={isListening ? "stop" : isProcessing ? "hourglass-empty" : "mic"}
            size={34}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtext}>
        {isListening
          ? t.recording
          : "Tap mic to speak your cyber fraud complaint"}
      </Text>

      {/* Voice Dictation Sheet for Mobile Phone */}
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
              Tap the microphone icon on your phone keyboard to speak in Hindi, Bengali, or English:
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
