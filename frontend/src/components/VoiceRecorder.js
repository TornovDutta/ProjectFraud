import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { audioService } from '../services/audio.js';
import { translations } from '../services/i18n.js';

export default function VoiceRecorder({ language = 'English', onTranscript, isProcessing = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognizerRef = useRef(null);
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
      // Button Pulse Loop
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

      // Audio Wave Bars Loop
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

  const toggleRecording = () => {
    if (isProcessing) return;

    if (isRecording) {
      setIsRecording(false);
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    } else {
      setIsRecording(true);
      
      const recognizer = audioService.createSpeechRecognizer(
        language,
        (text) => {
          setIsRecording(false);
          if (onTranscript) onTranscript(text);
        },
        (error) => {
          console.warn("Speech error:", error);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        try {
          recognizer.start();
        } catch (e) {
          console.warn("Could not start recognition:", e);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hintText}>
        {isRecording ? t.speakNow : isProcessing ? "Processing analysis..." : t.tapToSpeak}
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
            isProcessing && styles.micButtonDisabled
          ]}
          onPress={toggleRecording}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={isRecording ? "stop" : isProcessing ? "hourglass-empty" : "mic"}
            size={34}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtext}>
        {isRecording ? t.recording : t.listeningHint}
      </Text>
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
    marginBottom: 8
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
  }
});
