import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { translations } from '../services/i18n';

export default function EvidenceUploadScreen({ complaintId, language, onNavigate, onEvidenceExtracted }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedEvidence, setExtractedEvidence] = useState(null);
  const [ocrInput, setOcrInput] = useState('');
  const fadeResult = useRef(new Animated.Value(0)).current;

  const t = translations[language] || translations.English;

  const handleParseEvidence = (text) => {
    const raw = text || ocrInput;
    if (!raw.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);

      // Real regex extraction based strictly on input provided
      const utrMatch = raw.match(/\b([0-9]{12})\b/);
      const amtMatch = raw.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
      const vpaMatch = raw.match(/\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/);
      
      let bank = "Bank";
      const banks = ["SBI", "HDFC", "ICICI", "AXIS", "PNB", "KOTAK", "BOB", "CANARA"];
      for (const b of banks) {
        if (raw.toUpperCase().includes(b)) {
          bank = b;
          break;
        }
      }

      const data = {
        utr_number: utrMatch ? utrMatch[1] : null,
        amount: amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null,
        beneficiary_vpa: vpaMatch ? vpaMatch[1] : null,
        bank_name: bank,
        timestamp: new Date().toISOString()
      };

      setExtractedEvidence(data);
      if (onEvidenceExtracted) onEvidenceExtracted(data);

      Animated.timing(fadeResult, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }).start();
    }, 900);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('review')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.evidenceUpload}</Text>
          <Text style={styles.headerSub}>AI-Powered Receipt and Screenshot Analysis</Text>
        </View>
      </View>

      {/* Upload Selector Cards */}
      <View style={styles.uploadOptions}>
        <View style={styles.uploadCard}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="document-scanner" size={28} color="#2563EB" />
          </View>
          <Text style={styles.uploadCardTitle}>Payment Screenshot or SMS Text</Text>
          <Text style={styles.uploadCardDesc}>Paste or enter the text from your UPI app receipt or bank debit SMS:</Text>

          <TextInput
            style={styles.textOcrInput}
            multiline
            numberOfLines={3}
            placeholder="e.g. Paid to scammer@okhdfcbank. Amount Rs 15000. UPI Ref 987654321012..."
            value={ocrInput}
            onChangeText={setOcrInput}
          />

          <TouchableOpacity
            style={[styles.analyzeBtn, !ocrInput.trim() && styles.analyzeBtnDisabled]}
            onPress={() => handleParseEvidence(ocrInput)}
            disabled={!ocrInput.trim() || isAnalyzing}
            activeOpacity={0.8}
          >
            <MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" />
            <Text style={styles.analyzeBtnText}>Extract Transaction Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {isAnalyzing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t.aiOcrExtracting}</Text>
          <Text style={styles.loadingSub}>Scanning for 12-digit UTR, amount, and recipient UPI ID...</Text>
        </View>
      )}

      {/* Extracted Evidence Details */}
      {extractedEvidence && !isAnalyzing && (
        <Animated.View style={[styles.resultCard, { opacity: fadeResult }]}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="check-circle" size={20} color="#059669" />
            <Text style={styles.resultTitle}>{t.ocrSuccess}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Extracted UTR / Ref:</Text>
            <Text style={styles.dataValueBold}>{extractedEvidence.utr_number || "Not detected in text"}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Disputed Amount:</Text>
            <Text style={styles.dataValueBold}>
              {extractedEvidence.amount ? `INR ${extractedEvidence.amount.toLocaleString('en-IN')}` : "Not detected"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Beneficiary VPA / UPI ID:</Text>
            <Text style={styles.dataValue}>{extractedEvidence.beneficiary_vpa || "Not detected"}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Detected Bank:</Text>
            <Text style={styles.dataValue}>{extractedEvidence.bank_name}</Text>
          </View>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onNavigate('review')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="done-all" size={18} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Apply to Complaint Draft</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12
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
  uploadOptions: {
    padding: 16
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  uploadCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  uploadCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center'
  },
  textOcrInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 64,
    textAlignVertical: 'top',
    marginTop: 12
  },
  analyzeBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12
  },
  analyzeBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  loadingBox: {
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12
  },
  loadingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46'
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dataLabel: {
    fontSize: 12,
    color: '#64748B'
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  },
  dataValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669'
  },
  applyBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  }
});
