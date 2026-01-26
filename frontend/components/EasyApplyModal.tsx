import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  useColorScheme,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job, EasyApplyData } from '../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface EasyApplyModalProps {
  job: Job;
  onClose: () => void;
  onSubmit: (data: EasyApplyData) => void;
}

type Step = 'contact' | 'resume' | 'questions' | 'review';

export default function EasyApplyModal({ job, onClose, onSubmit }: EasyApplyModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [formData, setFormData] = useState<EasyApplyData>({
    resume: null,
    phone: '',
    email: '',
    additionalQuestions: [],
    coverLetter: '',
  });

  const steps: Step[] = ['contact', 'resume', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 'contact':
        return !formData.email || !formData.phone;
      case 'resume':
        return !formData.resume;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'contact':
        return 'Contact Info';
      case 'resume':
        return 'Resume';
      case 'review':
        return 'Review Application';
      default:
        return '';
    }
  };

  const renderContactStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        How can {job.company.name} reach you?
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Email *</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Phone *</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="call-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={colors.textMuted}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Cover Letter (Optional)</Text>
        <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Tell them why you're a great fit..."
            placeholderTextColor={colors.textMuted}
            value={formData.coverLetter}
            onChangeText={(text) => setFormData({ ...formData, coverLetter: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  );

  const renderResumeStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Upload your resume or select a saved one
      </Text>

      {/* Mock saved resumes */}
      <View style={styles.resumeList}>
        {['My_Resume_2024.pdf', 'Tech_Resume.pdf'].map((resume, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.resumeItem,
              { backgroundColor: colors.cardBackground, borderColor: formData.resume === resume ? colors.primary : colors.border },
            ]}
            onPress={() => setFormData({ ...formData, resume })}
          >
            <View style={styles.resumeIcon}>
              <Ionicons
                name="document-text"
                size={24}
                color={formData.resume === resume ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.resumeInfo}>
              <Text style={[styles.resumeName, { color: colors.text }]}>{resume}</Text>
              <Text style={[styles.resumeMeta, { color: colors.textMuted }]}>
                Last updated: Jan 2024
              </Text>
            </View>
            {formData.resume === resume && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload new */}
      <TouchableOpacity
        style={[styles.uploadButton, { borderColor: colors.primary }]}
        onPress={() => setFormData({ ...formData, resume: 'New_Upload.pdf' })}
      >
        <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
        <Text style={[styles.uploadText, { color: colors.primary }]}>Upload New Resume</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Review your application before submitting
      </Text>

      {/* Job Summary */}
      <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.reviewHeader}>
          <View style={[styles.smallLogo, { backgroundColor: colors.background }]}>
            {job.company.logo ? (
              <Image source={{ uri: job.company.logo }} style={styles.smallLogoImage} />
            ) : (
              <Text style={[styles.smallLogoText, { color: colors.primary }]}>
                {job.company.name.charAt(0)}
              </Text>
            )}
          </View>
          <View style={styles.reviewJobInfo}>
            <Text style={[styles.reviewJobTitle, { color: colors.text }]}>{job.title}</Text>
            <Text style={[styles.reviewCompany, { color: colors.textSecondary }]}>
              {job.company.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Application Summary */}
      <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>Your Application</Text>

        <View style={styles.reviewItem}>
          <Ionicons name="mail" size={18} color={colors.textMuted} />
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.email}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Ionicons name="call" size={18} color={colors.textMuted} />
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.phone}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Ionicons name="document-text" size={18} color={colors.textMuted} />
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.resume}</Text>
        </View>

        {formData.coverLetter && (
          <View style={styles.reviewItem}>
            <Ionicons name="create" size={18} color={colors.textMuted} />
            <Text style={[styles.reviewValue, { color: colors.text }]} numberOfLines={2}>
              {formData.coverLetter}
            </Text>
          </View>
        )}
      </View>

      {/* Consent */}
      <View style={[styles.consentBox, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.consentText, { color: colors.textSecondary }]}>
          By submitting, you agree to share your information with {job.company.name} for this job application.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Easy Apply</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {job.company.name}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.divider }]}>
          <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
        </View>

        {/* Step Title */}
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>{getStepTitle()}</Text>
          <Text style={[styles.stepCounter, { color: colors.textMuted }]}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {currentStep === 'contact' && renderContactStep()}
          {currentStep === 'resume' && renderResumeStep()}
          {currentStep === 'review' && renderReviewStep()}
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.divider }]}>
          {currentStepIndex > 0 && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: isNextDisabled() ? colors.border : colors.primary },
              currentStepIndex === 0 && styles.fullWidthButton,
            ]}
            onPress={handleNext}
            disabled={isNextDisabled()}
          >
            <Text style={[styles.nextButtonText, { color: colors.textInverse }]}>
              {currentStep === 'review' ? 'Submit Application' : 'Continue'}
            </Text>
            {currentStep !== 'review' && (
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    height: 3,
  },
  progressBar: {
    height: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  stepCounter: {
    fontSize: FontSize.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    paddingHorizontal: Spacing.lg,
  },
  stepDescription: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  textArea: {
    fontSize: FontSize.md,
    minHeight: 100,
  },
  resumeList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resumeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeInfo: {
    flex: 1,
  },
  resumeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  resumeMeta: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  uploadText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  smallLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  smallLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  smallLogoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  reviewJobInfo: {
    flex: 1,
  },
  reviewJobTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  reviewCompany: {
    fontSize: FontSize.md,
    marginTop: 2,
  },
  reviewSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reviewValue: {
    fontSize: FontSize.md,
    flex: 1,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  consentText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});