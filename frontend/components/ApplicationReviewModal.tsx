import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job, EasyApplyData } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface ApplicationReviewModalProps {
  job: Job;
  applicationData: EasyApplyData;
  appliedAt: string;
  onClose: () => void;
}

export default function ApplicationReviewModal({
  job,
  applicationData,
  appliedAt,
  onClose,
}: ApplicationReviewModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileName = (path: string) => {
    if (!path) return 'No resume';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Application Review</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Job Summary */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.jobHeader}>
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
            <View style={styles.jobInfo}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>
                {job.company.name}
              </Text>
              <Text style={[styles.location, { color: colors.textMuted }]}>
                {job.location} • {job.locationType}
              </Text>
            </View>
          </View>

          <View style={[styles.statusContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Applied {formatDate(appliedAt)}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{applicationData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{applicationData.phone}</Text>
            </View>
          </View>
        </View>

        {/* Resume */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resume</Text>

          {/* Show refined resume if available from agent */}
          {applicationData.refinedResume ? (
            <>
              <View style={[styles.resumeCard, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                <View style={[styles.resumeIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="sparkles" size={24} color={colors.success} />
                </View>
                <View style={styles.resumeInfo}>
                  <Text style={[styles.resumeName, { color: colors.text }]}>
                    AI-Tailored Resume
                  </Text>
                  <Text style={[styles.resumeMeta, { color: colors.textMuted }]}>
                    Customized for this position
                  </Text>
                </View>
              </View>
              <Text style={[styles.refinedResumeText, { color: colors.text }]}>
                {applicationData.refinedResume}
              </Text>
            </>
          ) : (
            <View style={[styles.resumeCard, { backgroundColor: colors.background, borderColor: colors.divider }]}>
              <View style={[styles.resumeIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeName, { color: colors.text }]}>
                  {getFileName(applicationData.resume || '')}
                </Text>
                <Text style={[styles.resumeMeta, { color: colors.textMuted }]}>
                  Submitted resume
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Cover Letter */}
        {applicationData.coverLetter && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cover Letter</Text>
            <Text style={[styles.coverLetterText, { color: colors.text }]}>
              {applicationData.coverLetter}
            </Text>
          </View>
        )}

        {/* Job Questions & Answers */}
        {applicationData.jobQuestions && applicationData.jobQuestions.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Answers</Text>

            {applicationData.jobQuestions.map((item, index) => (
              <View key={index} style={styles.questionBlock}>
                <Text style={[styles.questionText, { color: colors.textSecondary }]}>
                  {index + 1}. {item.question}
                </Text>
                <Text style={[styles.answerText, { color: colors.text }]}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Preferences & EEO */}
        {applicationData.preferences && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & EEO Information</Text>

            <View style={styles.preferenceGroup}>
              <Text style={[styles.preferenceGroupTitle, { color: colors.text }]}>Work Authorization</Text>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>
                  Authorized to work in country?
                </Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]}>
                  {applicationData.preferences.workAuthorizationInCountry ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>
                  Need visa sponsorship?
                </Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]}>
                  {applicationData.preferences.needsVisa ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>
                  Willing to relocate?
                </Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]}>
                  {applicationData.preferences.willingToRelocate ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <View style={styles.preferenceGroup}>
              <Text style={[styles.preferenceGroupTitle, { color: colors.text }]}>Equal Opportunity Information</Text>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>Gender</Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]}>
                  {applicationData.preferences.gender}
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>Ethnicity</Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]}>
                  {applicationData.preferences.ethnicity}
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>Veteran Status</Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]} numberOfLines={2}>
                  {applicationData.preferences.veteran}
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <Text style={[styles.preferenceLabel, { color: colors.textMuted }]}>Disability Status</Text>
                <Text style={[styles.preferenceValue, { color: colors.text }]} numberOfLines={2}>
                  {applicationData.preferences.disability}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Job Description */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Job Description</Text>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {job.description}
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
    width: 40,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  jobInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  jobTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  companyName: {
    fontSize: FontSize.md,
    marginBottom: 4,
  },
  location: {
    fontSize: FontSize.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeInfo: {
    flex: 1,
  },
  resumeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  resumeMeta: {
    fontSize: FontSize.sm,
  },
  refinedResumeText: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  coverLetterText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  questionBlock: {
    marginBottom: Spacing.md,
  },
  questionText: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  answerText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  preferenceGroup: {
    marginBottom: Spacing.md,
  },
  preferenceGroupTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  preferenceLabel: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  preferenceValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
});
