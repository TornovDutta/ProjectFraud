import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function EmergencyScreen({ language, onNavigate }) {
  const [emergencyData, setEmergencyData] = useState(null);
  const t = translations[language] || translations.English;

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    const data = await api.getEmergencyInfo();
    setEmergencyData(data);
  };

  const dialNumber = (num) => {
    const cleanNum = num.split('/')[0].trim();
    Linking.openURL(`tel:${cleanNum}`).catch(() => {
      alert(`Please dial ${cleanNum} from your dialer.`);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.emergencyHelpline}</Text>
          <Text style={styles.headerSub}>Active Fraud Response Desk</Text>
        </View>
      </View>

      {/* Hero 1930 Call Action */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <MaterialIcons name="phone-in-talk" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.heroNumber}>1930</Text>
        <Text style={styles.heroTitle}>National Cyber Financial Fraud Helpline</Text>
        <Text style={styles.heroSubtitle}>
          Toll-free 24x7 government helpline connecting police directly with major banks and payment gateways.
        </Text>
        <TouchableOpacity style={styles.callNowBtn} onPress={() => dialNumber('1930')} activeOpacity={0.85}>
          <MaterialIcons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.callNowBtnText}>Call 1930 Immediately</Text>
        </TouchableOpacity>
      </View>

      {/* The Golden Hour Protocol */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="timer" size={22} color="#D97706" />
          <Text style={styles.cardTitle}>{t.goldenHourTitle} (2 to 24 Hours)</Text>
        </View>
        <Text style={styles.cardBody}>{t.goldenHourDesc}</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitleText}>Call 1930 Within 2 Hours</Text>
              <Text style={styles.stepDescText}>Triggers CFCFRMS automated alert across 250+ connected banks to freeze destination account.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitleText}>Block UPI / NetBanking Channel</Text>
              <Text style={styles.stepDescText}>Call your issuing bank's toll-free line below to block your netbanking and card immediately.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitleText}>CyberSathi Formal Filing</Text>
              <Text style={styles.stepDescText}>CyberSathi organizes your evidence and generates the official cybercrime.gov.in petition.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bank Emergency Helplines Directory */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="account-balance" size={22} color="#1E3A8A" />
          <Text style={styles.cardTitle}>{t.banksDirectory}</Text>
        </View>

        {emergencyData?.bank_helplines?.map((bank, idx) => (
          <View key={idx} style={styles.bankItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>{bank.bank}</Text>
              <Text style={styles.bankPhone}>{bank.phone}</Text>
              <Text style={styles.bankSms}>{bank.block_sms}</Text>
            </View>
            <TouchableOpacity
              style={styles.bankCallBtn}
              onPress={() => dialNumber(bank.phone)}
            >
              <MaterialIcons name="call" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
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
  heroCard: {
    backgroundColor: '#991B1B',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  heroNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#FEE2E2',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17
  },
  callNowBtn: {
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  cardBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17
  },
  stepsContainer: {
    marginTop: 12,
    gap: 12
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706'
  },
  stepTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  stepDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  bankPhone: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1
  },
  bankSms: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  bankCallBtn: {
    backgroundColor: '#059669',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
