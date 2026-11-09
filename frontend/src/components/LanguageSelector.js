import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const LANGUAGES = [
  { code: 'English', label: 'English', native: 'English' },
  { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'Bengali', label: 'Bengali', native: 'বাংলা' }
];

export default function LanguageSelector({ currentLanguage, onSelectLanguage }) {
  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => {
        const isSelected = currentLanguage === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[styles.pill, isSelected && styles.pillActive]}
            onPress={() => onSelectLanguage(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
              {lang.native}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
    alignSelf: 'center',
    marginVertical: 8
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  pillActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  pillTextActive: {
    color: '#FFFFFF'
  }
});
