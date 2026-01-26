import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface ActionButtonsProps {
  onSkip: () => void;
  onSave: () => void;
  onApply: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ActionButtons({
  onSkip,
  onSave,
  onApply,
  onUndo,
  canUndo = false,
}: ActionButtonsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Animation values for button press feedback
  const skipScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const applyScale = useSharedValue(1);
  const undoScale = useSharedValue(1);

  const createPressHandler = (
    scale: Animated.SharedValue<number>,
    onPress: () => void
  ) => ({
    onPressIn: () => {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    },
    onPressOut: () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    },
    onPress,
  });

  const skipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipScale.value }],
  }));

  const saveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const applyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: applyScale.value }],
  }));

  const undoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: undoScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Undo Button (small) - only show when can undo */}
      <View style={styles.undoContainer}>
        {canUndo && onUndo ? (
          <AnimatedTouchable
            style={[
              styles.smallButton,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
              undoStyle,
            ]}
            {...createPressHandler(undoScale, onUndo)}
          >
            <Ionicons name="refresh" size={20} color={colors.textMuted} />
          </AnimatedTouchable>
        ) : null}
      </View>

      {/* Main action buttons */}
      <View style={styles.mainButtons}>
        {/* Skip Button (large) */}
        <AnimatedTouchable
          style={[
            styles.actionButton,
            styles.skipButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.swipeLeft },
            skipStyle,
          ]}
          {...createPressHandler(skipScale, onSkip)}
        >
          <Ionicons name="close" size={32} color={colors.swipeLeft} />
        </AnimatedTouchable>

        {/* Save Button (medium) */}
        <AnimatedTouchable
          style={[
            styles.actionButton,
            styles.saveButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.swipeUp },
            saveStyle,
          ]}
          {...createPressHandler(saveScale, onSave)}
        >
          <Ionicons name="bookmark" size={24} color={colors.swipeUp} />
        </AnimatedTouchable>

        {/* Apply Button (large) */}
        <AnimatedTouchable
          style={[
            styles.actionButton,
            styles.applyButton,
            { backgroundColor: colors.swipeRight },
            applyStyle,
          ]}
          {...createPressHandler(applyScale, onApply)}
        >
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </AnimatedTouchable>
      </View>

      {/* Spacer for balance */}
      <View style={styles.undoContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  undoContainer: {
    width: 50,
    alignItems: 'center',
  },
  smallButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mainButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButton: {
    width: 60,
    height: 60,
    borderWidth: 2,
  },
  saveButton: {
    width: 50,
    height: 50,
    borderWidth: 2,
  },
  applyButton: {
    width: 60,
    height: 60,
  },
});