import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ExtractionSummaryCard from '../components/ExtractionSummaryCard';
import VoiceRecorder from '../components/VoiceRecorder';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import { translations } from '../services/i18n';

export default function VoiceAssistantScreen({ language, onNavigate, onComplaintReady }) {
  const [complaintId, setComplaintId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [extractedFields, setExtractedFields] = useState({});
  const [missingFields, setMissingFields] = useState(["fraud_amount", "payment_method", "incident_date"]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");
  const [quickOptions, setQuickOptions] = useState(null);

  const scrollViewRef = useRef();
  const t = translations[language] || translations.English;

  useEffect(() => {
    initChat();
  }, [language]);

  const initChat = async () => {
    setIsProcessing(true);
    const res = await api.startConversation(language);
    setComplaintId(res.complaint_id);
    setMessages([
      { id: 'msg_0', sender: 'assistant', text: res.assistant_message }
    ]);
    setExtractedFields(res.extracted_fields || {});
    setMissingFields(res.missing_fields || []);
    setIsProcessing(false);
    audioService.speak(res.assistant_message, language);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    setInputText("");
    const userMsg = { id: `msg_u_${Date.now()}`, sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await api.sendMessage(complaintId, text, language);
      const asstMsg = { id: `msg_a_${Date.now()}`, sender: 'assistant', text: res.assistant_message };
      setMessages((prev) => [...prev, asstMsg]);
      setExtractedFields(res.extracted_fields || {});
      setMissingFields(res.missing_fields || []);
      setIsCompleted(res.is_completed || false);
      setQuickOptions(res.quick_options || null);
      if (res.security_warning) {
        setSecurityWarning(res.security_warning);
      }
      audioService.speak(res.assistant_message, language);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToReview = () => {
    if (onComplaintReady) {
      onComplaintReady(complaintId, extractedFields);
    }
    onNavigate('review');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t.appName} Voice Assistant</Text>
          <Text style={styles.headerSub}>{language} Mode</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('emergency')}>
          <View style={styles.emergencyPill}>
            <MaterialIcons name="phone" size={14} color="#DC2626" />
            <Text style={styles.emergencyPillText}>1930</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Live Extraction Summary Card */}
      <ExtractionSummaryCard
        extracted={extractedFields}
        missing={missingFields}
        language={language}
      />

      {/* Security Warning Banner if PIN/OTP was detected and redacted */}
      {securityWarning ? (
        <View style={styles.alertBanner}>
          <MaterialIcons name="shield" size={18} color="#DC2626" />
          <Text style={styles.alertText}>{securityWarning}</Text>
        </View>
      ) : null}

      {/* Messages Scroll View */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.userWrapper : styles.assistantWrapper
              ]}
            >
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
                  {m.text}
                </Text>
                {!isUser && (
                  <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => audioService.speak(m.text, language)}
                  >
                    <MaterialIcons name="volume-up" size={18} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {isProcessing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>CyberSathi is analyzing...</Text>
          </View>
        )}

        {/* Quick Options Chips */}
        {quickOptions && quickOptions.length > 0 && !isProcessing && (
          <View style={styles.quickOptionsRow}>
            {quickOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.quickOptionChip}
                onPress={() => handleSendMessage(opt)}
              >
                <Text style={styles.quickOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ready Action Bar */}
      {(isCompleted || extractedFields.fraud_amount) && (
        <View style={styles.readyBar}>
          <TouchableOpacity
            style={styles.readyButton}
            onPress={handleProceedToReview}
            activeOpacity={0.85}
          >
            <MaterialIcons name="fact-check" size={20} color="#FFFFFF" />
            <Text style={styles.readyButtonText}>{t.reviewComplaint} →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Recorder & Text Input Controls */}
      <View style={styles.inputArea}>
        <VoiceRecorder
          language={language}
          onTranscript={(text) => handleSendMessage(text)}
          isProcessing={isProcessing}
        />

        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Or type what happened here..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backButton: {
    padding: 6,
    marginRight: 8
  },
  headerTextContainer: {
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B'
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4
  },
  emergencyPillText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12
  },
  alertBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  alertText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 11,
    lineHeight: 15
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20
  },
  bubbleWrapper: {
    marginVertical: 4,
    flexDirection: 'row'
  },
  userWrapper: {
    justifyContent: 'flex-end'
  },
  assistantWrapper: {
    justifyContent: 'flex-start'
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: '#FFFFFF'
  },
  assistantText: {
    color: '#1E293B'
  },
  speakButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    padding: 2
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B'
  },
  quickOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  quickOptionChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  quickOptionText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600'
  },
  readyBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 10,
    paddingHorizontal: 16
  },
  readyButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  readyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  sendButton: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1'
  }
});
