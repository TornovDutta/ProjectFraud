import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { translations } from '../services/i18n';

export default function ExtractionSummaryCard({ extracted = {}, missing = [], language = 'English' }) {
  const t = translations[language] || translations.English;
  
  const totalMandatory = 4;
  const collectedCount = totalMandatory - missing.length;
  const progressPercent = Math.min(100, Math.max(0, Math.round((collectedCount / totalMandatory) * 100)));

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [progressPercent]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const hasAnyData = Object.keys(extracted).length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="fact-check" size={18} color="#2563EB" />
          <Text style={styles.title}>{t.extractedDetails}</Text>
        </View>
        <Text style={styles.badge}>{progressPercent}% Complete</Text>
      </View>

      {/* Animated Progress Bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: animatedWidth }]} />
      </View>

      {/* Extracted Chips */}
      {hasAnyData ? (
        <View style={styles.chipsContainer}>
          {extracted.fraud_amount ? (
            <View style={[styles.chip, styles.chipFilled]}>
              <MaterialIcons name="currency-rupee" size={14} color="#059669" />
              <Text style={styles.chipTextBold}>INR {Number(extracted.fraud_amount).toLocaleString('en-IN')}</Text>
            </View>
          ) : null}

          {extracted.payment_method ? (
            <View style={[styles.chip, styles.chipFilled]}>
              <MaterialIcons name="payment" size={14} color="#059669" />
              <Text style={styles.chipTextBold}>{extracted.payment_method}</Text>
            </View>
          ) : null}

          {extracted.transaction_id ? (
            <View style={[styles.chip, styles.chipFilled]}>
              <MaterialIcons name="receipt-long" size={14} color="#059669" />
              <Text style={styles.chipTextBold}>UTR: {extracted.transaction_id}</Text>
            </View>
          ) : null}

          {extracted.incident_date ? (
            <View style={[styles.chip, styles.chipFilled]}>
              <MaterialIcons name="event" size={14} color="#059669" />
              <Text style={styles.chipTextBold}>{extracted.incident_date}</Text>
            </View>
          ) : null}

          {extracted.suspect_phone ? (
            <View style={[styles.chip, styles.chipFilled]}>
              <MaterialIcons name="phone" size={14} color="#D97706" />
              <Text style={styles.chipTextBold}>Suspect: {extracted.suspect_phone}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.noDataHint}>Speak to begin automatic field extraction.</Text>
      )}

      {/* Missing Info Prompt */}
      {missing.length > 0 && (
        <View style={styles.missingContainer}>
          <Text style={styles.missingLabel}>{t.missingInfo}:</Text>
          <View style={styles.missingChips}>
            {missing.map((field) => (
              <View key={field} style={styles.missingBadge}>
                <Text style={styles.missingText}>
                  {field === 'fraud_amount' ? 'Amount (INR)' :
                   field === 'payment_method' ? 'Payment Method' :
                   field === 'incident_date' ? 'Date & Time' : 'Transaction ID / UTR'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Security Guarantee without emoji */}
      <View style={styles.securityBox}>
        <MaterialIcons name="security" size={14} color="#475569" style={{ marginRight: 6 }} />
        <Text style={styles.securityText}>{t.securityWarning}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3
  },
  noDataHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 4
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4
  },
  chipFilled: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  chipTextBold: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46'
  },
  missingContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  missingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6
  },
  missingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  missingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  missingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E'
  },
  securityBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15
  }
});
