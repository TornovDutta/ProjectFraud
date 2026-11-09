import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { translations } from '../services/i18n';

export default function EvidenceUploadScreen({ complaintId, language, onNavigate, onEvidenceExtracted }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedEvidence, setExtractedEvidence] = useState(null);
  const t = translations[language] || translations.English;

  const handleSimulateUpload = (type) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      let data = {
        utr_number: '987654321012',
        amount: 15000,
        beneficiary_vpa: 'scammer.fraud@paytm',
        bank_name: 'State Bank of India',
        timestamp: new Date().toISOString()
      };
      if (type === 'sms') {
        data = {
          utr_number: '234567890123',
          amount: 25000,
          beneficiary_vpa: 'fraudster@okhdfcbank',
          bank_name: 'HDFC Bank',
          timestamp: new Date().toISOString()
        };
      }
      setExtractedEvidence(data);
      if (onEvidenceExtracted) onEvidenceExtracted(data);
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('review')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.evidenceUpload}</Text>
          <Text style={styles.headerSub}>AI-Powered Receipt & Screenshot Analysis</Text>
        </View>
      </View>

      {/* Upload Selector Cards */}
      <View style={styles.uploadOptions}>
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => handleSimulateUpload('upi')}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="qr-code" size={28} color="#2563EB" />
          </View>
          <Text style={styles.uploadCardTitle}>UPI App Payment Screenshot</Text>
          <Text style={styles.uploadCardDesc}>GPay, PhonePe, Paytm, BHIM receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => handleSimulateUpload('sms')}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <MaterialIcons name="sms" size={28} color="#059669" />
          </View>
          <Text style={styles.uploadCardTitle}>Bank Debit Alert SMS</Text>
          <Text style={styles.uploadCardDesc}>SMS showing deduction & UTR reference</Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {isAnalyzing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t.aiOcrExtracting}</Text>
          <Text style={styles.loadingSub}>Scanning 12-digit UTR, amount, and recipient UPI handle...</Text>
        </View>
      )}

      {/* Extracted Evidence Details */}
      {extractedEvidence && !isAnalyzing && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="check-circle" size={20} color="#059669" />
            <Text style={styles.resultTitle}>{t.ocrSuccess}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Extracted UTR / Ref:</Text>
            <Text style={styles.dataValueBold}>{extractedEvidence.utr_number}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Disputed Amount:</Text>
            <Text style={styles.dataValueBold}>₹{extractedEvidence.amount.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Beneficiary VPA / UPI ID:</Text>
            <Text style={styles.dataValue}>{extractedEvidence.beneficiary_vpa}</Text>
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
            <Text style={styles.applyBtnText}>Apply to Complaint Draft →</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 16,
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
    padding: 16,
    gap: 12
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
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
    marginTop: 2
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
