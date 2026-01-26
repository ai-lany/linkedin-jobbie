import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Double tap gesture to expand card
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}/${salary.period === 'yearly' ? 'yr' : salary.period === 'monthly' ? 'mo' : 'hr'}`;
  };

  const formatPostedTime = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getLocationIcon = (type: Job['locationType']) => {
    switch (type) {
      case 'remote': return 'globe-outline';
      case 'hybrid': return 'business-outline';
      case 'onsite': return 'location-outline';
    }
  };

  const getExperienceLabel = (level: Job['experienceLevel']) => {
    const labels = {
      'entry': 'Entry Level',
      'associate': 'Associate',
      'mid-senior': 'Mid-Senior',
      'director': 'Director',
      'executive': 'Executive',
    };
    return labels[level];
  };

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      {/* Company Header */}
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: colors.background }]}>
          {job.company.logo ? (
            <Image source={{ uri: job.company.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.logoText, { color: colors.textInverse }]}>
                {job.company.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.companyInfo}>
          <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
            {job.company.name}
          </Text>
          <Text style={[styles.companyMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {job.company.industry} · {job.company.size}
          </Text>
        </View>
        {job.easyApply && (
          <View style={[styles.easyApplyBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="flash" size={12} color={colors.primary} />
            <Text style={[styles.easyApplyText, { color: colors.primary }]}>Easy Apply</Text>
          </View>
        )}
      </View>

      {/* Job Title */}
      <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
        {job.title}
      </Text>

      {/* Location & Type */}
      <View style={styles.locationRow}>
        <View style={styles.locationItem}>
          <Ionicons name={getLocationIcon(job.locationType)} size={16} color={colors.textSecondary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            {job.location}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)}
          </Text>
        </View>
      </View>

      {/* Salary */}
      {job.salary && (
        <View style={styles.salaryRow}>
          <Ionicons name="cash-outline" size={18} color={colors.success} />
          <Text style={[styles.salaryText, { color: colors.success }]}>
            {formatSalary(job.salary)}
          </Text>
        </View>
      )}

      {/* Highlights */}
      <View style={styles.highlightsSection}>
        {job.highlights.slice(0, 3).map((highlight, index) => (
          <View key={index} style={styles.highlightRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.highlightText, { color: colors.text }]} numberOfLines={1}>
              {highlight}
            </Text>
          </View>
        ))}
      </View>

      {/* Skills Tags */}
      <View style={styles.skillsContainer}>
        {job.skills.slice(0, 4).map((skill, index) => (
          <View key={index} style={[styles.skillTag, { backgroundColor: colors.background }]}>
            <Text style={[styles.skillText, { color: colors.textSecondary }]}>{skill}</Text>
          </View>
        ))}
        {job.skills.length > 4 && (
          <View style={[styles.skillTag, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.skillText, { color: colors.primary }]}>
              +{job.skills.length - 4} more
            </Text>
          </View>
        )}
      </View>

      {/* Footer Meta */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={styles.metaItem}>
          <Ionicons name="briefcase-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {getExperienceLabel(job.experienceLevel)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatPostedTime(job.postedAt)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {job.applicants} applicants
          </Text>
        </View>
      </View>

      {/* Tap Hint */}
      <View style={styles.tapHint}>
        <Ionicons name="scan-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.tapHintText, { color: colors.textMuted }]}>Double tap for details</Text>
      </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  companyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  companyName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  companyMeta: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  easyApplyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  easyApplyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  jobTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: FontSize.md,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  salaryText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  highlightsSection: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: FontSize.md,
    flex: 1,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  tapHintText: {
    fontSize: FontSize.sm,
  },
});