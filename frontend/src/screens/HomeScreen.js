import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Emergency1930Banner from '../components/Emergency1930Banner';
import LanguageSelector from '../components/LanguageSelector';
import { translations } from '../services/i18n';

export default function HomeScreen({ language, onSelectLanguage, onNavigate }) {
  const t = translations[language] || translations.English;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar with Language Selector */}
      <View style={styles.topBar}>
        <View style={styles.branding}>
          <MaterialIcons name="security" size={26} color="#1E3A8A" />
          <View>
            <Text style={styles.appTitle}>{t.appName}</Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>
        </View>
      </View>

      <LanguageSelector
        currentLanguage={language}
        onSelectLanguage={onSelectLanguage}
      />

      {/* 1930 Emergency Helpline Banner */}
      <Emergency1930Banner
        language={language}
        onOpenGuide={() => onNavigate('emergency')}
      />

      {/* Main Voice Report CTA */}
      <View style={styles.mainActionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.micCircle}>
            <MaterialIcons name="mic" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{t.reportFraud}</Text>
            <Text style={styles.cardDesc}>{t.reportFraudDesc}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.voiceCtaButton}
          onPress={() => onNavigate('chat')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="record-voice-over" size={22} color="#FFFFFF" />
          <Text style={styles.voiceCtaText}>{t.startVoiceReport}</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.subActionCard}
          onPress={() => onNavigate('tracking')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="search" size={24} color="#2563EB" />
          <Text style={styles.subActionTitle}>{t.trackStatus}</Text>
          <Text style={styles.subActionDesc}>Check official updates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subActionCard}
          onPress={() => onNavigate('emergency')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="bolt" size={24} color="#DC2626" />
          <Text style={styles.subActionTitle}>Golden Hour</Text>
          <Text style={styles.subActionDesc}>Bank freeze instructions</Text>
        </TouchableOpacity>
      </View>

      {/* Official Government Portal Info Box */}
      <View style={styles.govtBox}>
        <View style={styles.govtHeader}>
          <MaterialIcons name="account-balance" size={20} color="#0F172A" />
          <Text style={styles.govtTitle}>Official Cybercrime Portal</Text>
        </View>
        <Text style={styles.govtDesc}>
          CyberSathi is an AI assistant that prepares structured complaints for filing on the official National Cyber Crime Reporting Portal (cybercrime.gov.in).
        </Text>
        <TouchableOpacity
          style={styles.portalLink}
          onPress={() => Linking.openURL('https://cybercrime.gov.in')}
          activeOpacity={0.7}
        >
          <Text style={styles.portalLinkText}>Visit cybercrime.gov.in</Text>
          <MaterialIcons name="open-in-new" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Common Scam Types Guide */}
      <View style={styles.scamSection}>
        <Text style={styles.sectionHeader}>Common Cyber Frauds in India</Text>
        
        <View style={styles.scamItem}>
          <MaterialIcons name="qr-code-scanner" size={22} color="#D97706" />
          <View style={styles.scamText}>
            <Text style={styles.scamTitle}>UPI QR Code Scam</Text>
            <Text style={styles.scamDesc}>Entering UPI PIN to "receive" money. (PIN is ONLY used to send money!)</Text>
          </View>
        </View>

        <View style={styles.scamItem}>
          <MaterialIcons name="support-agent" size={22} color="#DC2626" />
          <View style={styles.scamText}>
            <Text style={styles.scamTitle}>Fake Bank Manager Call</Text>
            <Text style={styles.scamDesc}>Caller asking for OTP to stop KYC suspension or block unauthorized card charges.</Text>
          </View>
        </View>

        <View style={styles.scamItem}>
          <MaterialIcons name="work-outline" size={22} color="#2563EB" />
          <View style={styles.scamText}>
            <Text style={styles.scamTitle}>Telegram / Part-Time Job Scam</Text>
            <Text style={styles.scamDesc}>Promises of daily earnings for rating videos or investing in fake crypto platforms.</Text>
          </View>
        </View>
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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5
  },
  tagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  mainActionCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14
  },
  micCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardHeaderText: {
    flex: 1
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  cardDesc: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 4,
    lineHeight: 16
  },
  voiceCtaButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  voiceCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14
  },
  subActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  subActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8
  },
  subActionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  govtBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  govtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  govtTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  govtDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    lineHeight: 17
  },
  portalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4
  },
  portalLinkText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 12
  },
  scamSection: {
    marginHorizontal: 16,
    marginTop: 20
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10
  },
  scamItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  scamText: {
    flex: 1
  },
  scamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  scamDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15
  }
});
