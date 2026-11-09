import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import VoiceAssistantScreen from './src/screens/VoiceAssistantScreen';
import ReviewComplaintScreen from './src/screens/ReviewComplaintScreen';
import GovernmentHandoffScreen from './src/screens/GovernmentHandoffScreen';
import EvidenceUploadScreen from './src/screens/EvidenceUploadScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';

function MainApp() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [language, setLanguage] = useState('English');
  const [activeComplaintId, setActiveComplaintId] = useState(null);
  const [complaintData, setComplaintData] = useState(null);
  const [lastAckNumber, setLastAckNumber] = useState(null); // Real state: no demo data

  const handleComplaintReady = (id, extracted) => {
    setActiveComplaintId(id);
    setComplaintData(extracted);
  };

  const handleEvidenceExtracted = (data) => {
    setComplaintData((prev) => ({
      ...prev,
      transaction_id: data.utr_number || prev?.transaction_id,
      fraud_amount: data.amount || prev?.fraud_amount,
      suspect_upi_id: data.beneficiary_vpa || prev?.suspect_upi_id
    }));
  };

  const handleAckLinked = (ack) => {
    setLastAckNumber(ack);
  };

  // Dynamic notch/camera-hole safe top padding
  const dynamicTopInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : (Platform.OS === 'ios' ? 44 : 0)
  );

  const dynamicBottomInset = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.rootContainer, { paddingTop: dynamicTopInset }]}>
      <ExpoStatusBar style="dark" />
      <View style={styles.appContainer}>
        {/* Main Screen Content */}
        <View style={styles.screenContainer}>
          {currentScreen === 'home' && (
            <HomeScreen
              language={language}
              onSelectLanguage={setLanguage}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'chat' && (
            <VoiceAssistantScreen
              language={language}
              onNavigate={setCurrentScreen}
              onComplaintReady={handleComplaintReady}
            />
          )}

          {currentScreen === 'review' && (
            <ReviewComplaintScreen
              complaintId={activeComplaintId}
              initialData={complaintData}
              language={language}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'handoff' && (
            <GovernmentHandoffScreen
              complaintId={activeComplaintId}
              language={language}
              onNavigate={setCurrentScreen}
              onAckLinked={handleAckLinked}
            />
          )}

          {currentScreen === 'evidence' && (
            <EvidenceUploadScreen
              complaintId={activeComplaintId}
              language={language}
              onNavigate={setCurrentScreen}
              onEvidenceExtracted={handleEvidenceExtracted}
            />
          )}

          {currentScreen === 'tracking' && (
            <TrackingScreen
              language={language}
              defaultAck={lastAckNumber}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'emergency' && (
            <EmergencyScreen
              language={language}
              onNavigate={setCurrentScreen}
            />
          )}
        </View>

        {/* Persistent Bottom Tab Bar with dynamic safe area inset */}
        <View style={[styles.bottomTabBar, { paddingBottom: dynamicBottomInset }]}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('home')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="home"
              size={22}
              color={currentScreen === 'home' ? '#2563EB' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, currentScreen === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('chat')}
            activeOpacity={0.7}
          >
            <View style={styles.centerMicPill}>
              <MaterialIcons name="mic" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.tabLabel, currentScreen === 'chat' && styles.tabLabelActive]}>
              Assistant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('tracking')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="timeline"
              size={22}
              color={currentScreen === 'tracking' ? '#2563EB' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, currentScreen === 'tracking' && styles.tabLabelActive]}>
              Track
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('emergency')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="warning"
              size={22}
              color={currentScreen === 'emergency' ? '#DC2626' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, currentScreen === 'emergency' && styles.tabLabelEmergency]}>
              1930
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  appContainer: {
    flex: 1,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    } : {})
  },
  screenContainer: {
    flex: 1
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  centerMicPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700'
  },
  tabLabelEmergency: {
    color: '#DC2626',
    fontWeight: '800'
  }
});
