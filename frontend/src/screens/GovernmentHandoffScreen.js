import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Linking, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function GovernmentHandoffScreen({ complaintId, language, onNavigate, onAckLinked }) {
  const [submissionData, setSubmissionData] = useState(null);
  const [ackInput, setAckInput] = useState('');
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);
  const [ackResult, setAckResult] = useState(null);
  const [currentStage, setCurrentStage] = useState('READY'); // READY, SUBMITTED, ACKNOWLEDGED
  const [copied, setCopied] = useState(false);

  const t = translations[language] || translations.English;

  useEffect(() => {
    loadGuidedPacket();
  }, [complaintId]);

  const loadGuidedPacket = async () => {
    const data = await api.getGuidedSubmission(complaintId);
    setSubmissionData(data);
  };

  const handleSimulateAuthorizedApi = async () => {
    setIsSubmittingApi(true);
    const result = await api.submitAuthorizedAPI(complaintId);
    setIsSubmittingApi(false);
    setAckResult(result);
    setCurrentStage('ACKNOWLEDGED');
    if (onAckLinked) onAckLinked(result.acknowledgement_number);
  };

  const handleLinkManualAck = async () => {
    if (!ackInput.trim()) return;
    await api.attachAcknowledgement(complaintId, ackInput.trim());
    setCurrentStage('ACKNOWLEDGED');
    setAckResult({ acknowledgement_number: ackInput.trim() });
    if (onAckLinked) onAckLinked(ackInput.trim());
  };

  const copyPacket = () => {
    if (!submissionData) return;
    const text = `NATIONAL CYBER CRIME REPORTING PORTAL DETAILS:
Category: ${submissionData.prefilled_fields.category}
Sub-Category: ${submissionData.prefilled_fields.sub_category}
Amount: INR ${submissionData.prefilled_fields.loss_amount}
Transaction UTR: ${submissionData.prefilled_fields.utr_or_txn_id}
Incident Narrative: Attached in petition.`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('review')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Government Portal Handoff</Text>
          <Text style={styles.headerSub}>National Cyber Crime Reporting Portal</Text>
        </View>
      </View>

      {/* 3-State Lifecycle Indicator */}
      <View style={styles.lifecycleCard}>
        <Text style={styles.lifecycleTitle}>Complaint Lifecycle Progression</Text>
        <View style={styles.stageRow}>
          <View style={[styles.stageBadge, styles.stageCompleted]}>
            <MaterialIcons name="check-circle" size={16} color="#059669" />
            <Text style={styles.stageTextCompleted}>1. Drafted</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={14} color="#94A3B8" />
          <View style={[styles.stageBadge, currentStage !== 'READY' ? styles.stageCompleted : styles.stageActive]}>
            <MaterialIcons name={currentStage !== 'READY' ? "check-circle" : "radio-button-checked"} size={16} color={currentStage !== 'READY' ? "#059669" : "#2563EB"} />
            <Text style={currentStage !== 'READY' ? styles.stageTextCompleted : styles.stageTextActive}>2. Submitted</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={14} color="#94A3B8" />
          <View style={[styles.stageBadge, currentStage === 'ACKNOWLEDGED' ? styles.stageCompleted : styles.stagePending]}>
            <MaterialIcons name={currentStage === 'ACKNOWLEDGED' ? "check-circle" : "radio-button-unchecked"} size={16} color={currentStage === 'ACKNOWLEDGED' ? "#059669" : "#94A3B8"} />
            <Text style={currentStage === 'ACKNOWLEDGED' ? styles.stageTextCompleted : styles.stageTextPending}>3. Acknowledged</Text>
          </View>
        </View>
      </View>

      {/* Success Banner if Acknowledged */}
      {ackResult && (
        <View style={styles.successBanner}>
          <MaterialIcons name="verified" size={28} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Officially Acknowledged by Government</Text>
            <Text style={styles.successAck}>Ack No: {ackResult.acknowledgement_number}</Text>
            <Text style={styles.successSub}>1930 / I4C Bank Freeze alert has been dispatched to recipient bank.</Text>
          </View>
          <TouchableOpacity
            style={styles.trackNowBtn}
            onPress={() => onNavigate('tracking')}
          >
            <Text style={styles.trackNowText}>Track →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Option 1: User-Assisted Official Submission */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="touch-app" size={22} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Option A: Guided Official Submission (Standard)</Text>
            <Text style={styles.cardSubtitle}>Submit manually on cybercrime.gov.in using citizen OTP</Text>
          </View>
        </View>

        {submissionData?.checklist.map((step) => (
          <View key={step.step} style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>{step.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.instruction}</Text>
            </View>
          </View>
        ))}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.copyPacketBtn}
            onPress={copyPacket}
            activeOpacity={0.8}
          >
            <MaterialIcons name="content-copy" size={16} color="#2563EB" />
            <Text style={styles.copyPacketText}>{copied ? "Copied!" : "Copy Portal Fields"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openPortalBtn}
            onPress={() => Linking.openURL('https://cybercrime.gov.in')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="open-in-new" size={16} color="#FFFFFF" />
            <Text style={styles.openPortalText}>Open cybercrime.gov.in</Text>
          </TouchableOpacity>
        </View>

        {/* Enter Ack Number after manual submission */}
        <View style={styles.manualAckBox}>
          <Text style={styles.manualAckLabel}>Got your Acknowledgement Number from the portal?</Text>
          <View style={styles.manualAckInputRow}>
            <TextInput
              style={styles.manualAckInput}
              placeholder="e.g. 20261184920193"
              value={ackInput}
              onChangeText={setAckInput}
            />
            <TouchableOpacity
              style={[styles.linkBtn, !ackInput.trim() && styles.linkBtnDisabled]}
              onPress={handleLinkManualAck}
              disabled={!ackInput.trim()}
            >
              <Text style={styles.linkBtnText}>Link Ack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Option 2: Authorized Government API Integration */}
      <View style={[styles.card, styles.authorizedCard]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="api" size={22} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Option B: Authorized Government API Mode</Text>
            <Text style={styles.cardSubtitle}>Direct submission via official gateway partnership (Simulation / Live)</Text>
          </View>
        </View>

        <Text style={styles.authNotice}>
          In an authorized state or future phase, CyberSathi submits the payload directly to the National Cybercrime API and receives the 14-digit acknowledgement number automatically.
        </Text>

        <TouchableOpacity
          style={styles.simulateApiBtn}
          onPress={handleSimulateAuthorizedApi}
          disabled={isSubmittingApi}
          activeOpacity={0.85}
        >
          <MaterialIcons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.simulateApiText}>
            {isSubmittingApi ? "Submitting to Gateway..." : "Submit via Authorized API Gateway (Simulate)"}
          </Text>
        </TouchableOpacity>
      </View>
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
  lifecycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  lifecycleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  stageCompleted: {
    backgroundColor: '#ECFDF5'
  },
  stageActive: {
    backgroundColor: '#EFF6FF'
  },
  stagePending: {
    backgroundColor: '#F1F5F9'
  },
  stageTextCompleted: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  stageTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  stageTextPending: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8'
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46'
  },
  successAck: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2
  },
  successSub: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 15
  },
  trackNowBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  trackNowText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
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
  authorizedCard: {
    borderColor: '#A7F3D0'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  stepItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start'
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  copyPacketBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  copyPacketText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 12
  },
  openPortalBtn: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  openPortalText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  manualAckBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  manualAckLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6
  },
  manualAckInputRow: {
    flexDirection: 'row',
    gap: 8
  },
  manualAckInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12
  },
  linkBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  linkBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12
  },
  authNotice: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12
  },
  simulateApiBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  simulateApiText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  }
});
