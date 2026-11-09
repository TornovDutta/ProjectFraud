import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { translations } from '../services/i18n';

export default function ServicesScreen({ language = 'English', onNavigate }) {
  const t = translations[language] || translations.English;

  // Active sub-service tab
  const [activeTab, setActiveTab] = useState('SCANNER'); // 'SCANNER' | 'RBI_CLAIM' | 'SANCHAR_SAATHI' | 'SCAM_ALERTS' | 'USSD'

  // 1. Scanner State
  const [scanQuery, setScanQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // 2. RBI Claim Form State
  const [complainantName, setComplainantName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [last4Digits, setLast4Digits] = useState('');
  const [fraudAmount, setFraudAmount] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedClaim, setGeneratedClaim] = useState(null);
  const [claimCopied, setClaimCopied] = useState(false);

  // 3. Sanchar Saathi & Alerts Data
  const [sancharData, setSancharData] = useState(null);
  const [scamAlerts, setScamAlerts] = useState([]);
  const [quickActions, setQuickActions] = useState(null);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    const sData = await api.getSancharSaathi();
    setSancharData(sData);
    const alerts = await api.getTrendingScams();
    setScamAlerts(alerts);
    const qActions = await api.getQuickActions();
    setQuickActions(qActions);
  };

  const handleScan = async (queryToScan) => {
    const q = (queryToScan || scanQuery).trim();
    if (!q) return;

    setIsScanning(true);
    const res = await api.scanFraudRisk(q);
    setScanResult(res);
    setIsScanning(false);
  };

  const handleGenerateRbiClaim = async () => {
    if (!complainantName.trim() || !fraudAmount) return;

    const res = await api.generateRbiClaim({
      complainant_name: complainantName.trim(),
      bank_name: bankName,
      account_or_card_last4: last4Digits || 'XXXX',
      fraud_amount: parseFloat(fraudAmount) || 0,
      transaction_date: incidentDate,
      report_date: reportDate
    });
    setGeneratedClaim(res);
  };

  const handleCopyClaim = () => {
    setClaimCopied(true);
    setTimeout(() => setClaimCopied(false), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t.servicesTitle}</Text>
          <Text style={styles.headerSub}>Cyber Defense and Citizen Tools</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('emergency')}>
          <View style={styles.emergencyPill}>
            <MaterialIcons name="phone" size={14} color="#DC2626" />
            <Text style={styles.emergencyPillText}>1930</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Segmented Service Selector Tabs */}
      <View style={styles.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'SCANNER' && styles.tabButtonActive]}
            onPress={() => setActiveTab('SCANNER')}
          >
            <MaterialIcons
              name="security"
              size={16}
              color={activeTab === 'SCANNER' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'SCANNER' && styles.tabTextActive]}>
              Risk Scanner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'RBI_CLAIM' && styles.tabButtonActive]}
            onPress={() => setActiveTab('RBI_CLAIM')}
          >
            <MaterialIcons
              name="account-balance"
              size={16}
              color={activeTab === 'RBI_CLAIM' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'RBI_CLAIM' && styles.tabTextActive]}>
              RBI Bank Claim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'SANCHAR_SAATHI' && styles.tabButtonActive]}
            onPress={() => setActiveTab('SANCHAR_SAATHI')}
          >
            <MaterialIcons
              name="phonelink-lock"
              size={16}
              color={activeTab === 'SANCHAR_SAATHI' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'SANCHAR_SAATHI' && styles.tabTextActive]}>
              Sanchar Saathi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'SCAM_ALERTS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('SCAM_ALERTS')}
          >
            <MaterialIcons
              name="campaign"
              size={16}
              color={activeTab === 'SCAM_ALERTS' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'SCAM_ALERTS' && styles.tabTextActive]}>
              Scam Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'USSD' && styles.tabButtonActive]}
            onPress={() => setActiveTab('USSD')}
          >
            <MaterialIcons
              name="dialpad"
              size={16}
              color={activeTab === 'USSD' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'USSD' && styles.tabTextActive]}>
              USSD Codes
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
        {/* ============================================================== */}
        {/* TAB 1: FRAUD RISK SCANNER                                      */}
        {/* ============================================================== */}
        {activeTab === 'SCANNER' && (
          <View style={styles.sectionContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="radar" size={24} color="#2563EB" />
              <View>
                <Text style={styles.sectionTitle}>{t.fraudScanner}</Text>
                <Text style={styles.sectionSubtitle}>{t.fraudScannerDesc}</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter suspect phone, UPI ID, link, or paste SMS..."
                placeholderTextColor="#94A3B8"
                value={scanQuery}
                onChangeText={setScanQuery}
                onSubmitEditing={() => handleScan()}
              />
              <TouchableOpacity
                style={[styles.scanActionBtn, !scanQuery.trim() && styles.scanActionDisabled]}
                onPress={() => handleScan()}
                disabled={!scanQuery.trim() || isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="search" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Test Chips */}
            <Text style={styles.quickChipLabel}>Quick Modus Operandi Tests:</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => {
                  const val = "Dear consumer your electricity power will be disconnected tonight at 9:30 PM. Call officer at 9876543210";
                  setScanQuery(val);
                  handleScan(val);
                }}
              >
                <Text style={styles.quickChipText}>Electricity Bill SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => {
                  const val = "+92 300 1234567";
                  setScanQuery(val);
                  handleScan(val);
                }}
              >
                <Text style={styles.quickChipText}>VoIP / Spoof Call (+92)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => {
                  const val = "http://sbi-yono-update.com/download.apk";
                  setScanQuery(val);
                  handleScan(val);
                }}
              >
                <Text style={styles.quickChipText}>Fake Bank .APK Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => {
                  const val = "sbi.customer.support@oksbi";
                  setScanQuery(val);
                  handleScan(val);
                }}
              >
                <Text style={styles.quickChipText}>Imposter Support UPI</Text>
              </TouchableOpacity>
            </View>

            {/* Scan Results Card */}
            {scanResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultTopRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{scanResult.category_title}</Text>
                    <Text style={styles.categoryCode}>Type: {scanResult.query_type}</Text>
                  </View>
                  <View
                    style={[
                      styles.riskBadge,
                      scanResult.risk_level === 'CRITICAL'
                        ? styles.badgeCritical
                        : scanResult.risk_level === 'HIGH'
                        ? styles.badgeHigh
                        : styles.badgeMedium
                    ]}
                  >
                    <Text style={styles.riskBadgeText}>{scanResult.risk_level} RISK</Text>
                  </View>
                </View>

                {/* Risk Score Meter */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Threat Probability Score:</Text>
                  <Text style={styles.scoreValue}>{scanResult.risk_score} / 100</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${scanResult.risk_score}%` },
                      scanResult.risk_score >= 70
                        ? { backgroundColor: '#DC2626' }
                        : scanResult.risk_score >= 40
                        ? { backgroundColor: '#EA580C' }
                        : { backgroundColor: '#EAB308' }
                    ]}
                  />
                </View>

                {/* Red Flags */}
                {scanResult.red_flags && scanResult.red_flags.length > 0 && (
                  <View style={styles.flagsBox}>
                    <Text style={styles.flagsHeader}>Identified Red Flags:</Text>
                    {scanResult.red_flags.map((flag, idx) => (
                      <View key={idx} style={styles.flagItem}>
                        <MaterialIcons name="report" size={16} color="#DC2626" />
                        <Text style={styles.flagText}>{flag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Citizen Advisory */}
                <View style={styles.advisoryBox}>
                  <View style={styles.advisoryHeaderRow}>
                    <MaterialIcons name="verified-user" size={16} color="#059669" />
                    <Text style={styles.advisoryTitle}>Immediate Safety Advisory:</Text>
                  </View>
                  {scanResult.advisories.map((adv, idx) => (
                    <Text key={idx} style={styles.advisoryText}>- {adv}</Text>
                  ))}
                </View>

                {/* 1930 Emergency Action if High Risk */}
                {scanResult.risk_score >= 50 && (
                  <TouchableOpacity
                    style={styles.scannerCallBtn}
                    onPress={() => Linking.openURL('tel:1930')}
                  >
                    <MaterialIcons name="phone" size={18} color="#FFFFFF" />
                    <Text style={styles.scannerCallText}>Report to 1930 Cyber Fraud Helpline</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: RBI ZERO LIABILITY CLAIM GENERATOR                      */}
        {/* ============================================================== */}
        {activeTab === 'RBI_CLAIM' && (
          <View style={styles.sectionContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="account-balance" size={24} color="#059669" />
              <View>
                <Text style={styles.sectionTitle}>{t.rbiClaim}</Text>
                <Text style={styles.sectionSubtitle}>{t.rbiClaimDesc}</Text>
              </View>
            </View>

            <View style={styles.infoCallout}>
              <MaterialIcons name="info" size={18} color="#1E3A8A" />
              <Text style={styles.infoCalloutText}>
                Under RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18, if an unauthorized transaction is reported within 3 working days, customer liability is ZERO and bank must provide shadow reversal within 10 days.
              </Text>
            </View>

            {/* Input Form */}
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Complainant Full Name:</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Rahul Sharma"
                value={complainantName}
                onChangeText={setComplainantName}
              />

              <Text style={styles.fieldLabel}>Bank Name:</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. State Bank of India / HDFC Bank"
                value={bankName}
                onChangeText={setBankName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Account / Card Last 4:</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 4321"
                    keyboardType="numeric"
                    maxLength={4}
                    value={last4Digits}
                    onChangeText={setLast4Digits}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Fraud Amount (INR):</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 25000"
                    keyboardType="numeric"
                    value={fraudAmount}
                    onChangeText={setFraudAmount}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  (!complainantName.trim() || !fraudAmount) && styles.actionDisabled
                ]}
                onPress={handleGenerateRbiClaim}
                disabled={!complainantName.trim() || !fraudAmount}
              >
                <MaterialIcons name="description" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Generate RBI Refund Notice</Text>
              </TouchableOpacity>
            </View>

            {/* Generated Legal Notice Output */}
            {generatedClaim && (
              <View style={styles.claimResultBox}>
                <View style={styles.claimHeaderRow}>
                  <Text style={styles.claimResultTitle}>Formal RBI Notice Prepared</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopyClaim}>
                    <MaterialIcons name={claimCopied ? "check" : "content-copy"} size={16} color="#2563EB" />
                    <Text style={styles.copyBtnText}>{claimCopied ? "Copied" : "Copy Notice"}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.legalNoticeScroll} nestedScrollEnabled>
                  <Text style={styles.legalNoticeCode}>{generatedClaim.formal_claim_text}</Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.ombudsmanBtn}
                  onPress={() => Linking.openURL(generatedClaim.ombudsman_url)}
                >
                  <MaterialIcons name="open-in-new" size={16} color="#059669" />
                  <Text style={styles.ombudsmanBtnText}>Open RBI Banking Ombudsman (cms.rbi.org.in)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SANCHAR SAATHI & CEIR STOLEN PHONE BLOCKING             */}
        {/* ============================================================== */}
        {activeTab === 'SANCHAR_SAATHI' && (
          <View style={styles.sectionContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="phonelink-lock" size={24} color="#7C3AED" />
              <View>
                <Text style={styles.sectionTitle}>{t.sancharSaathi}</Text>
                <Text style={styles.sectionSubtitle}>{t.sancharSaathiDesc}</Text>
              </View>
            </View>

            {sancharData?.services?.map((svc) => (
              <View key={svc.code} style={styles.serviceItemCard}>
                <View style={styles.serviceItemHeader}>
                  <Text style={styles.serviceItemTitle}>{svc.title}</Text>
                  <View style={styles.govBadge}>
                    <Text style={styles.govBadgeText}>DoT Official</Text>
                  </View>
                </View>

                <Text style={styles.serviceItemDesc}>{svc.description}</Text>

                <Text style={styles.checklistTitle}>Required Checklist:</Text>
                {svc.checklist.map((item, i) => (
                  <View key={i} style={styles.checkRow}>
                    <MaterialIcons name="check-circle" size={14} color="#059669" />
                    <Text style={styles.checkText}>{item}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.portalActionBtn}
                  onPress={() => Linking.openURL(svc.official_url)}
                >
                  <Text style={styles.portalActionText}>Open Official Portal</Text>
                  <MaterialIcons name="open-in-new" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TRENDING SCAM MODUS OPERANDI BULLETINS                  */}
        {/* ============================================================== */}
        {activeTab === 'SCAM_ALERTS' && (
          <View style={styles.sectionContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="campaign" size={24} color="#EA580C" />
              <View>
                <Text style={styles.sectionTitle}>{t.scamAlerts}</Text>
                <Text style={styles.sectionSubtitle}>{t.scamAlertsDesc}</Text>
              </View>
            </View>

            {scamAlerts.map((scam) => (
              <View key={scam.id} style={styles.scamCard}>
                <View style={styles.scamTopRow}>
                  <Text style={styles.scamTitle}>{scam.title}</Text>
                  <View style={styles.scamBadge}>
                    <Text style={styles.scamBadgeText}>{scam.risk}</Text>
                  </View>
                </View>

                <Text style={styles.scamSectionHeader}>Modus Operandi (How Fraudsters Trap Victims):</Text>
                <Text style={styles.scamDescText}>{scam.modus_operandi}</Text>

                <View style={styles.defenseBox}>
                  <MaterialIcons name="shield" size={16} color="#059669" />
                  <Text style={styles.defenseText}>{scam.safety_rule}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 5: OFFLINE USSD EMERGENCY CODES                            */}
        {/* ============================================================== */}
        {activeTab === 'USSD' && (
          <View style={styles.sectionContainer}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="dialpad" size={24} color="#2563EB" />
              <View>
                <Text style={styles.sectionTitle}>{t.quickUssd}</Text>
                <Text style={styles.sectionSubtitle}>Offline Emergency Bank & UPI De-linking Codes</Text>
              </View>
            </View>

            {/* Universal UPI De-link USSD */}
            <View style={styles.universalUssdCard}>
              <View style={styles.ussdHeader}>
                <MaterialIcons name="flash-on" size={22} color="#DC2626" />
                <Text style={styles.universalUssdTitle}>Universal UPI De-Link Code</Text>
              </View>
              <Text style={styles.universalUssdCode}>{quickActions?.universal_upi_delink_ussd || "*99*99#"}</Text>
              <Text style={styles.universalUssdDesc}>
                Dial from your registered mobile SIM. Immediately removes and de-links UPI payment profiles across all banks in India without needing internet.
              </Text>
              <TouchableOpacity
                style={styles.ussdDialBtn}
                onPress={() => Linking.openURL('tel:*99*99%23')}
              >
                <MaterialIcons name="phone" size={18} color="#FFFFFF" />
                <Text style={styles.ussdDialText}>Dial *99*99# Now</Text>
              </TouchableOpacity>
            </View>

            {/* Bank Card & NetBanking Freeze Directory */}
            <Text style={styles.bankDirectoryTitle}>Bank Emergency Fraud Desks:</Text>
            {quickActions?.bank_emergency_actions?.map((b, idx) => (
              <View key={idx} style={styles.bankActionCard}>
                <View style={styles.bankTopRow}>
                  <Text style={styles.bankName}>{b.bank}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${b.toll_free.split(' ')[0]}`)}>
                    <View style={styles.bankCallBadge}>
                      <MaterialIcons name="phone" size={12} color="#2563EB" />
                      <Text style={styles.bankCallText}>Call</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.bankDetailItem}>Toll-Free: {b.toll_free}</Text>
                <Text style={styles.bankDetailItem}>SMS Freeze: {b.sms_block}</Text>
                <Text style={styles.bankDetailItem}>USSD Menu: {b.ussd}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 12,
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
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14
  },
  emergencyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  tabScrollContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  bodyScroll: {
    flex: 1
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40
  },
  sectionContainer: {
    gap: 12
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 290
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8
  },
  scanActionBtn: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanActionDisabled: {
    backgroundColor: '#CBD5E1'
  },
  quickChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  quickChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF'
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  categoryInfo: {
    flex: 1
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  categoryCode: {
    fontSize: 11,
    color: '#64748B'
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeCritical: {
    backgroundColor: '#FEE2E2'
  },
  badgeHigh: {
    backgroundColor: '#FFEDD5'
  },
  badgeMedium: {
    backgroundColor: '#FEF9C3'
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  flagsBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 8,
    padding: 10,
    gap: 6
  },
  flagsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B'
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6
  },
  flagText: {
    flex: 1,
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16
  },
  advisoryBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    gap: 4
  },
  advisoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534'
  },
  advisoryText: {
    fontSize: 11,
    color: '#14532D',
    lineHeight: 16
  },
  scannerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4
  },
  scannerCallText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A'
  },
  formRow: {
    flexDirection: 'row',
    gap: 10
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 6
  },
  actionDisabled: {
    backgroundColor: '#94A3B8'
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  claimResultBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10
  },
  claimHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  claimResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669'
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
  },
  legalNoticeScroll: {
    maxHeight: 220,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10
  },
  legalNoticeCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 16
  },
  ombudsmanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8
  },
  ombudsmanBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D'
  },
  serviceItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
    gap: 8
  },
  serviceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  serviceItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  govBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED'
  },
  serviceItemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  checkText: {
    fontSize: 11,
    color: '#475569'
  },
  portalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4
  },
  portalActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  scamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
    gap: 6
  },
  scamTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  scamTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  scamBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  scamBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626'
  },
  scamSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4
  },
  scamDescText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  defenseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 8,
    marginTop: 4
  },
  defenseText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15
  },
  universalUssdCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8
  },
  ussdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  universalUssdTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239'
  },
  universalUssdCode: {
    fontSize: 26,
    fontWeight: '800',
    color: '#BE123C',
    letterSpacing: 2
  },
  universalUssdDesc: {
    fontSize: 11,
    color: '#881337',
    textAlign: 'center',
    lineHeight: 16
  },
  ussdDialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BE123C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4
  },
  ussdDialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  bankDirectoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6
  },
  bankActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 6,
    gap: 4
  },
  bankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  bankCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  bankCallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
  },
  bankDetailItem: {
    fontSize: 11,
    color: '#64748B'
  }
});
