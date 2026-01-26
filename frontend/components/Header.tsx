import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

interface HeaderProps {
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onFilterPress?: () => void;
}

export default function Header({ onProfilePress, onSettingsPress, onFilterPress }: HeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
      {/* Profile Button */}
      <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={18} color={colors.textInverse} />
        </View>
      </TouchableOpacity>

      {/* Logo/Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.primary }]}>Jobbie</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Swipe your career</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.xs,
    marginTop: -2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});