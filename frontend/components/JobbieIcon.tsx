import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JobbieIconProps {
  size?: number;
  color?: string;
}

export default function JobbieIcon({ size = 24, color = '#FFFFFF' }: JobbieIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Ionicons name="briefcase" size={size * 0.8} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
