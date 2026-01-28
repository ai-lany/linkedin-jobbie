import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JobbieIcon from './JobbieIcon';
import { Job } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface LinkedInJobDetailModalProps {
  job: Job;
  onClose: () => void;
  onJobbieClick?: () => void;
}

export default function LinkedInJobDetailModal({ job, onClose, onJobbieClick }: LinkedInJobDetailModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatPostedTime = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handleJobbieClick = () => {
    onClose();
    if (onJobbieClick) {
      onJobbieClick();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.headerHandle} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info */}
        <View style={styles.companySection}>
          <View style={[styles.companyLogo, { backgroundColor: colors.cardBackground }]}>
            {job.company.logo && job.company.logo.length > 0 ? (
              <Image source={{ uri: job.company.logo }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.logoText, { color: colors.textInverse }]}>
                  {job.company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.companyName, { color: colors.text }]}>{job.company.name}</Text>
        </View>

        {/* Job Title */}
        <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>

        {/* Job Meta */}
        <View style={styles.metaSection}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {job.location} · {formatPostedTime(job.postedAt)} · Over 100 applicants
          </Text>
          <Text style={[styles.metaSubtext, { color: colors.textSecondary }]}>
            Promoted by hirer · <Text style={{ color: colors.success }}>Actively reviewing applicants</Text>
          </Text>
        </View>

        {/* Job Type Badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { borderColor: colors.border }]}>
            <Ionicons name="checkmark" size={18} color={colors.text} />
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)}
            </Text>
          </View>
          <View style={[styles.badge, { borderColor: colors.border }]}>
            <Ionicons name="checkmark" size={18} color={colors.text} />
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {job.employmentType.charAt(0).toUpperCase() + job.employmentType.slice(1).replace('-', ' ')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.easyApplyButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={20} color={colors.textInverse} />
            <Text style={[styles.easyApplyText, { color: colors.textInverse }]}>Easy Apply</Text>
          </TouchableOpacity>

          {/* Jobbie Icon Button */}
          <TouchableOpacity
            style={[styles.jobbieButton, { backgroundColor: '#FF6B6B', borderColor: '#FF4757' }]}
            onPress={handleJobbieClick}
            activeOpacity={0.8}
          >
            <JobbieIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { borderColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Jobbie Helper Text */}
        <View style={styles.jobbieHelperContainer}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={[styles.jobbieHelperText, { color: colors.textMuted }]}>
            Tap the 💼 Jobbie button to start swiping on similar jobs
          </Text>
        </View>

        {/* Premium Section */}
        <View style={[styles.premiumSection, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.premiumHeader}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>💎</Text>
              <Text style={[styles.premiumLabel, { color: '#B8860B' }]}>Premium</Text>
            </View>
          </View>
          <Text style={[styles.premiumTitle, { color: colors.text }]}>Use AI to assess how you fit</Text>
          <View style={styles.premiumActions}>
            <TouchableOpacity style={[styles.premiumButton, { borderColor: colors.border }]}>
              <Text style={styles.premiumButtonIcon}>✨</Text>
              <Text style={[styles.premiumButtonText, { color: colors.text }]}>Show match details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.premiumButton, { borderColor: colors.border }]}>
              <Text style={styles.premiumButtonIcon}>✨</Text>
              <Text style={[styles.premiumButtonText, { color: colors.text }]}>Create cover letter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About the Job */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About the job</Text>
          <Text style={[styles.sectionContent, { color: colors.text }]}>{job.description}</Text>
        </View>

        {/* Key Tools & Technologies */}
        {job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Tools & Technologies</Text>
            <View style={styles.skillsContainer}>
              {job.skills.map((skill, index) => (
                <View key={index} style={[styles.skillChip, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Requirements */}
        {job.qualifications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements added by the job poster</Text>
            {job.qualifications.map((qual, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={[styles.bulletText, { color: colors.text }]}>• {qual}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: BorderRadius.full,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.sm,
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  companySection: {
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  companyLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  logoImage: {
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
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  companyName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  metaSection: {
    marginBottom: Spacing.md,
  },
  metaText: {
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  metaSubtext: {
    fontSize: FontSize.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: 6,
  },
  badgeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  easyApplyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  easyApplyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  jobbieButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  jobbieIcon: {
    fontSize: 24,
  },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  jobbieHelperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  jobbieHelperText: {
    fontSize: FontSize.sm,
    flex: 1,
    textAlign: 'center',
  },
  premiumSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumIcon: {
    fontSize: 16,
  },
  premiumLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  premiumTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  premiumActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  premiumButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  premiumButtonIcon: {
    fontSize: 16,
  },
  premiumButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  sectionContent: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  bulletPoint: {
    marginBottom: Spacing.sm,
  },
  bulletText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
});
