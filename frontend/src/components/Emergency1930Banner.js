import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { translations } from '../services/i18n';

export default function Emergency1930Banner({ language = 'English', onOpenGuide }) {
  const t = translations[language] || translations.English;

  const handleCall = () => {
    Linking.openURL('tel:1930').catch(() => {
      alert("Please dial 1930 from your phone dialer.");
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <MaterialIcons name="phone-in-talk" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t.emergencyHelpline}</Text>
          <Text style={styles.subtitle}>{t.emergencyDesc}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
          <MaterialIcons name="call" size={18} color="#FFFFFF" />
          <Text style={styles.callButtonText}>{t.call1930}</Text>
        </TouchableOpacity>
        {onOpenGuide && (
          <TouchableOpacity style={styles.guideButton} onPress={onOpenGuide} activeOpacity={0.8}>
            <MaterialIcons name="security" size={16} color="#DC2626" />
            <Text style={styles.guideButtonText}>Freeze Guide</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B'
  },
  subtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 16
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10
  },
  callButton: {
    flex: 1.2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  guideButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  guideButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12
  }
});
