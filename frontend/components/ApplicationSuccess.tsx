import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Job } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface ApplicationSuccessProps {
  job: Job;
  onContinue: () => void;
  onViewApplication: () => void;
}

export default function ApplicationSuccess({
  job,
  onContinue,
  onViewApplication,
}: ApplicationSuccessProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  useEffect(() => {
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate check mark
    checkScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    checkOpacity.value = withTiming(1, { duration: 300 });

    // Animate content with delay
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    contentTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 200 }));
  }, [checkOpacity, checkScale, contentOpacity, contentTranslateY]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Success Icon */}
      <Animated.View
        style={[
          styles.checkContainer,
          { backgroundColor: colors.successLight },
          checkStyle,
        ]}
      >
        <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>Application Sent!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your application for {job.title} at {job.company.name} has been submitted successfully.
        </Text>

        {/* Job Info Card */}
        <View style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.jobIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="briefcase" size={24} color={colors.primary} />
          </View>
          <View style={styles.jobInfo}>
            <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={[styles.jobCompany, { color: colors.textSecondary }]}>
              {job.company.name}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.tipsText, { color: colors.primary }]}>
            Tip: Applications with personalized cover letters get 50% more responses!
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, contentStyle]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onContinue}
        >
          <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>
            Keep Swiping
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onViewApplication}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            View My Applications
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  checkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  jobIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  jobCompany: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    gap: Spacing.sm,
  },
  tipsText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  primaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});