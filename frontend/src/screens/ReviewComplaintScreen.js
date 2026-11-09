import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function ReviewComplaintScreen({ complaintId, initialData, language, onNavigate }) {
  // Real user state only, no hardcoded sample values
  const [formData, setFormData] = useState({
    fraud_amount: initialData?.fraud_amount ? String(initialData.fraud_amount) : '',
    payment_method: initialData?.payment_method || '',
    transaction_id: initialData?.transaction_id || '',
    incident_date: initialData?.incident_date || new Date().toISOString().split('T')[0],
    suspect_phone: initialData?.suspect_phone || '',
    suspect_upi_id: initialData?.suspect_upi_id || '',
    incident_description: initialData?.incident_description || ''
  });

  const [narrative, setNarrative] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const t = translations[language] || translations.English;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true
    }).start();

    if (complaintId) {
      handleGenerateNarrative();
    }
  }, [complaintId]);

  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    const res = await api.generateNarrative(complaintId);
    setNarrative(res.narrative);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(narrative);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('chat')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.reviewComplaint}</Text>
          <Text style={styles.headerSub}>Verify and finalize legal draft</Text>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Editable Fields Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Structured Complaint Fields</Text>
          <Text style={styles.cardSubtitle}>Confirm or correct values before official submission.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.fraudAmount} (INR)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              keyboardType="numeric"
              value={formData.fraud_amount}
              onChangeText={(val) => setFormData({ ...formData, fraud_amount: val })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.paymentMethod}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. UPI, Debit Card, Net Banking"
              value={formData.payment_method}
              onChangeText={(val) => setFormData({ ...formData, payment_method: val })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.transactionId} (12-digit UTR)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12-digit UTR number"
              value={formData.transaction_id}
              onChangeText={(val) => setFormData({ ...formData, transaction_id: val })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.incidentDate}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.incident_date}
              onChangeText={(val) => setFormData({ ...formData, incident_date: val })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.suspectPhone}</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile if known"
              value={formData.suspect_phone}
              onChangeText={(val) => setFormData({ ...formData, suspect_phone: val })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Incident Narrative / Modus Operandi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Explain how the incident took place..."
              multiline
              numberOfLines={3}
              value={formData.incident_description}
              onChangeText={(val) => setFormData({ ...formData, incident_description: val })}
            />
          </View>
        </View>

        {/* Evidence Attach Card */}
        <TouchableOpacity
          style={styles.evidenceButton}
          onPress={() => onNavigate('evidence')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="attachment" size={20} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.evidenceTitle}>Attach Payment Screenshots / Receipts</Text>
            <Text style={styles.evidenceSubtitle}>AI extracts UTR and amounts automatically from receipts</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>

        {/* Formal Legal Narrative Generated Preview */}
        <View style={styles.narrativeCard}>
          <View style={styles.narrativeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="description" size={18} color="#059669" />
              <Text style={styles.narrativeTitle}>Official Legal Petition Preview</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard} activeOpacity={0.7}>
              <MaterialIcons name={copySuccess ? "done" : "content-copy"} size={16} color="#2563EB" />
              <Text style={styles.copyBtnText}>{copySuccess ? t.copied : "Copy"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.narrativeBox} nestedScrollEnabled>
            <Text style={styles.narrativeText}>
              {narrative || "Generating official legal petition narrative with statutory sections..."}
            </Text>
          </ScrollView>
        </View>

        {/* Submit to Government Portal CTA */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => onNavigate('handoff')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="cloud-upload" size={22} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>{t.proceedToSubmission}</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B'
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12
  },
  fieldGroup: {
    marginBottom: 10
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top'
  },
  evidenceButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  evidenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF'
  },
  evidenceSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  narrativeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  narrativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  narrativeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
  },
  narrativeBox: {
    maxHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  narrativeText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    lineHeight: 16
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  }
});
