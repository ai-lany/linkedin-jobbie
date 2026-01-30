import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface ExpandedJobCardProps {
  job: Job;
  onClose: () => void;
  onApply: () => void;
  onSkip: () => void;
  onSave: () => void;
}

export default function ExpandedJobCard({
  job,
  onClose,
  onApply,
  onSkip,
  onSave,
}: ExpandedJobCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    const periodLabel = salary.period === 'yearly' ? 'year' : salary.period === 'monthly' ? 'month' : 'hour';
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)} per ${periodLabel}`;
  };

  const formatPostedTime = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} months ago`;
  };

  const getExperienceLabel = (level: Job['experienceLevel']) => {
    const labels = {
      'entry': 'Entry Level',
      'associate': 'Associate',
      'mid-senior': 'Mid-Senior Level',
      'director': 'Director',
      'executive': 'Executive',
    };
    return labels[level];
  };

  const SectionTitle = ({ children }: { children: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Job Details</Text>
        <TouchableOpacity onPress={onSave} style={styles.saveButton}>
          <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Card */}
        <View style={[styles.companyCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.companyHeader}>
            <View style={[styles.logoContainer, { backgroundColor: colors.background }]}>
              {job.company.logo && job.company.logo.length > 0 ? (
                <Image source={{ uri: job.company.logo }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.logoText, { color: colors.textInverse }]}>
                    {job.company.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: colors.text }]}>{job.company.name}</Text>
              <Text style={[styles.companyMeta, { color: colors.textSecondary }]}>
                {job.company.industry}
              </Text>
              <Text style={[styles.companyMeta, { color: colors.textSecondary }]}>
                {job.company.size} · {job.company.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Title Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>

          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{job.employmentType}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.background }]}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{job.locationType}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.background }]}>
              <Ionicons name="trending-up-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {getExperienceLabel(job.experienceLevel)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{job.location}</Text>
          </View>

          {job.salary && (
            <View style={styles.metaRow}>
              <Ionicons name="cash" size={16} color={colors.success} />
              <Text style={[styles.salaryText, { color: colors.success }]}>
                {formatSalary(job.salary)}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="time" size={16} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatPostedTime(job.postedAt)} · {job.applicants} applicants
            </Text>
          </View>

          {job.applicationType === 'direct' && (
            <View style={[styles.easyApplyBanner, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="flash" size={18} color={colors.primary} />
              <Text style={[styles.easyApplyText, { color: colors.primary }]}>
                Easy Apply available
              </Text>
            </View>
          )}
        </View>

        {/* Skills */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <SectionTitle>Skills Required</SectionTitle>
          <View style={styles.skillsContainer}>
            {job.skills.map((skill, index) => (
              <View key={index} style={[styles.skillTag, { backgroundColor: colors.background }]}>
                <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <SectionTitle>About This Role</SectionTitle>
          <Text style={[styles.description, { color: colors.text }]}>{job.description}</Text>
        </View>

        {/* Responsibilities */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <SectionTitle>Responsibilities</SectionTitle>
          {job.responsibilities.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Qualifications */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <SectionTitle>Qualifications</SectionTitle>
          {job.qualifications.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        {job.benefits.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <SectionTitle>Benefits</SectionTitle>
            <View style={styles.benefitsGrid}>
              {job.benefits.map((benefit, index) => (
                <View key={index} style={[styles.benefitItem, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="gift-outline" size={16} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.success }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About Company */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <SectionTitle>About {job.company.name}</SectionTitle>
          <Text style={[styles.description, { color: colors.text }]}>{job.aboutCompany}</Text>
        </View>

        {/* Bottom Padding for action buttons */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton, { borderColor: colors.swipeLeft }]}
          onPress={onSkip}
        >
          <Ionicons name="close" size={28} color={colors.swipeLeft} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={onApply}
        >
          <Ionicons name="checkmark" size={28} color={colors.textInverse} />
          <Text style={[styles.applyButtonText, { color: colors.textInverse }]}>
            {job.applicationType === 'direct' ? 'Easy Apply' : 'Apply'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.saveActionButton, { borderColor: colors.swipeUp }]}
          onPress={onSave}
        >
          <Ionicons name="bookmark-outline" size={24} color={colors.swipeUp} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  saveButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  companyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
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
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  companyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  companyName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  companyMeta: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  jobTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: FontSize.md,
  },
  salaryText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  easyApplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  easyApplyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  description: {
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  listText: {
    flex: 1,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  benefitText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  skipButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
  },
  applyButton: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  applyButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  saveActionButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
  },
});