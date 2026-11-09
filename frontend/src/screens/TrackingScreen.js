import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function TrackingScreen({ language, defaultAck, onNavigate }) {
  const [identifier, setIdentifier] = useState(defaultAck || '20261184920193');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language] || translations.English;

  useEffect(() => {
    if (identifier) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!identifier.trim()) return;
    setIsLoading(true);
    const data = await api.getTrackingStatus(identifier.trim());
    setTrackingData(data);
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.trackStatus}</Text>
          <Text style={styles.headerSub}>National Cybercrime Portal Status</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>{t.acknowledgementNumber}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 20261184920193"
            value={identifier}
            onChangeText={setIdentifier}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
            <MaterialIcons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Connecting to status registry...</Text>
        </View>
      )}

      {/* Tracking Result Card */}
      {trackingData && !isLoading && (
        <View style={styles.resultContainer}>
          {/* Status Header Badge */}
          <View style={styles.summaryBadge}>
            <View>
              <Text style={styles.ackNoText}>
                Ack No: {trackingData.government_acknowledgement || identifier}
              </Text>
              <Text style={styles.categoryText}>
                {trackingData.fraud_type || 'UPI Fraud'} • ₹{Number(trackingData.fraud_amount || 15000).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>ACTIVE</Text>
            </View>
          </View>

          {/* Official Verification Notice */}
          <View style={styles.officialNotice}>
            <MaterialIcons name="verified-user" size={18} color="#059669" />
            <Text style={styles.officialNoticeText}>
              Status synchronized with Citizen Financial Cyber Fraud Reporting System (CFCFRMS).
            </Text>
          </View>

          {/* Timeline of updates */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeading}>{t.timelineTitle}</Text>

            {trackingData.timeline?.map((item, idx) => {
              const isLast = idx === trackingData.timeline.length - 1;
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemSource}>{item.source}</Text>
                      <Text style={styles.itemTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Direct Government Status Page Link */}
          <TouchableOpacity
            style={styles.portalCheckBtn}
            onPress={() => Linking.openURL(trackingData.official_tracking_url || 'https://www.cybercrime.gov.in/Webform/chkackstatus.aspx')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="launch" size={18} color="#FFFFFF" />
            <Text style={styles.portalCheckBtnText}>{t.officialTrackingBtn}</Text>
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
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    width: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingBox: {
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8
  },
  resultContainer: {
    marginHorizontal: 16,
    marginTop: 14
  },
  summaryBadge: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ackNoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  categoryText: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 2
  },
  liveTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  officialNotice: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  officialNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  timelineHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12
  },
  timelineLeft: {
    alignItems: 'center',
    width: 16
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    marginTop: 2
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  itemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  itemSource: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
  },
  itemTime: {
    fontSize: 10,
    color: '#94A3B8'
  },
  portalCheckBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  portalCheckBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  }
});
