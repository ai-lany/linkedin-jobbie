import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job, EasyApplyData } from '../types/job';
import { User } from '../types/auth';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import * as DocumentPicker from 'expo-document-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

interface EasyApplyModalProps {
  job: Job;
  currentUser: User | null;
  token: string | null;
  onClose: () => void;
  onSubmit: (data: EasyApplyData) => void;
}

type Step = 'contact' | 'resume' | 'questions' | 'preferences' | 'review';

export default function EasyApplyModal({ job, currentUser, token, onClose, onSubmit }: EasyApplyModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form data with user info
  const [formData, setFormData] = useState<EasyApplyData>({
    resume: currentUser?.resume || null,
    phone: currentUser?.phoneNumber || '',
    email: currentUser?.email || '',
    coverLetter: '',
    jobQuestions: [],
    preferences: {
      workAuthorizationInCountry: currentUser?.additionalInfo?.workAuthorizationInCountry || false,
      needsVisa: currentUser?.additionalInfo?.needsVisa || false,
      ethnicity: currentUser?.additionalInfo?.ethnicity || 'Prefer not to say',
      veteran: currentUser?.additionalInfo?.veteran || 'Prefer not to say',
      disability: currentUser?.additionalInfo?.disability || 'Prefer not to say',
      gender: currentUser?.additionalInfo?.gender || 'Prefer not to say',
      willingToRelocate: currentUser?.additionalInfo?.willingToRelocate || false,
    },
  });

  // Initialize job questions
  useEffect(() => {
    if (job.questions && job.questions.length > 0) {
      setFormData(prev => ({
        ...prev,
        jobQuestions: job.questions!.map(q => ({ question: q, answer: '' })),
      }));
    }
  }, [job.questions]);

  // Calculate steps based on whether job has questions
  const getSteps = (): Step[] => {
    const baseSteps: Step[] = ['contact', 'resume'];
    if (job.questions && job.questions.length > 0) {
      baseSteps.push('questions');
    }
    baseSteps.push('preferences', 'review');
    return baseSteps;
  };

  const steps = getSteps();
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

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (5MB limit)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be less than 5MB');
          return;
        }

        await uploadResume(file);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const uploadResume = async (file: any) => {
    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('resume', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      } as any);

      const response = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload resume');
      }

      // Update form with new resume path
      setFormData({ ...formData, resume: data.resumePath });
      Alert.alert('Success', 'Resume uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Error', err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 'contact':
        return !formData.email || !formData.phone;
      case 'resume':
        return !formData.resume;
      case 'questions':
        return formData.jobQuestions?.some(q => !q.answer.trim()) || false;
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
      case 'questions':
        return 'Additional Questions';
      case 'preferences':
        return 'Preferences & EEO';
      case 'review':
        return 'Review Application';
      default:
        return '';
    }
  };

  const getFileName = (path: string) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
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
        {formData.resume ? 'Your current resume or upload a new one' : 'Upload your resume'}
      </Text>

      {/* Current Resume */}
      {formData.resume && (
        <View style={styles.resumeList}>
          <TouchableOpacity
            style={[
              styles.resumeItem,
              { backgroundColor: colors.cardBackground, borderColor: colors.primary },
            ]}
            onPress={() => {}}
          >
            <View style={styles.resumeIcon}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={styles.resumeInfo}>
              <Text style={[styles.resumeName, { color: colors.text }]}>
                {getFileName(formData.resume)}
              </Text>
              <Text style={[styles.resumeMeta, { color: colors.textMuted }]}>
                Current resume
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload new */}
      <TouchableOpacity
        style={[styles.uploadButton, { borderColor: colors.primary }]}
        onPress={handlePickDocument}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.primary }]}>
              {formData.resume ? 'Upload New Resume' : 'Upload Resume'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderQuestionsStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Please answer the following questions
      </Text>

      {formData.jobQuestions?.map((item, index) => (
        <View key={index} style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {index + 1}. {item.question}
          </Text>
          <View style={[styles.textAreaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Your answer..."
              placeholderTextColor={colors.textMuted}
              value={item.answer}
              onChangeText={(text) => {
                const updated = [...(formData.jobQuestions || [])];
                updated[index].answer = text;
                setFormData({ ...formData, jobQuestions: updated });
              }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Help us match you better. All fields are optional.
      </Text>

      {/* Work Authorization */}
      <View style={[styles.preferenceSection, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Authorization</Text>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>
            Authorized to work in country?
          </Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
            {formData.preferences?.workAuthorizationInCountry ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>
            Need visa sponsorship?
          </Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
            {formData.preferences?.needsVisa ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>
            Willing to relocate?
          </Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
            {formData.preferences?.willingToRelocate ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {/* EEO Information */}
      <View style={styles.preferenceSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Equal Opportunity (Optional)</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          This information helps employers track diversity metrics
        </Text>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>Gender</Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
            {formData.preferences?.gender}
          </Text>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>Ethnicity</Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
            {formData.preferences?.ethnicity}
          </Text>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>Veteran Status</Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]} numberOfLines={2}>
            {formData.preferences?.veteran}
          </Text>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>Disability Status</Text>
          <Text style={[styles.preferenceValue, { color: colors.textSecondary }]} numberOfLines={2}>
            {formData.preferences?.disability}
          </Text>
        </View>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          You can update these preferences anytime in your profile settings
        </Text>
      </View>
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
          <Text style={[styles.reviewValue, { color: colors.text }]}>
            {formData.resume ? getFileName(formData.resume) : 'No resume'}
          </Text>
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

      {/* Questions Answers */}
      {formData.jobQuestions && formData.jobQuestions.length > 0 && (
        <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>Your Answers</Text>
          {formData.jobQuestions.map((item, index) => (
            <View key={index} style={styles.questionReview}>
              <Text style={[styles.questionText, { color: colors.textSecondary }]}>
                {index + 1}. {item.question}
              </Text>
              <Text style={[styles.answerText, { color: colors.text }]}>{item.answer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Preferences & EEO */}
      {formData.preferences && (
        <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>Preferences & EEO</Text>

          {/* Work Authorization */}
          <View style={styles.preferenceReviewSection}>
            <Text style={[styles.preferenceReviewTitle, { color: colors.textSecondary }]}>
              Work Authorization
            </Text>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                Authorized to work in country?
              </Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                {formData.preferences.workAuthorizationInCountry ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                Need visa sponsorship?
              </Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                {formData.preferences.needsVisa ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                Willing to relocate?
              </Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                {formData.preferences.willingToRelocate ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          {/* Equal Opportunity */}
          <View style={styles.preferenceReviewSection}>
            <Text style={[styles.preferenceReviewTitle, { color: colors.textSecondary }]}>
              Equal Opportunity
            </Text>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Gender</Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                {formData.preferences.gender}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Ethnicity</Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                {formData.preferences.ethnicity}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Veteran Status</Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]} numberOfLines={2}>
                {formData.preferences.veteran}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Disability Status</Text>
              <Text style={[styles.preferenceValue, { color: colors.textSecondary }]} numberOfLines={2}>
                {formData.preferences.disability}
              </Text>
            </View>
          </View>
        </View>
      )}

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
          {currentStep === 'questions' && renderQuestionsStep()}
          {currentStep === 'preferences' && renderPreferencesStep()}
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
    minHeight: 80,
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
  preferenceSection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
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
  questionReview: {
    marginBottom: Spacing.md,
  },
  questionText: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  answerText: {
    fontSize: FontSize.md,
  },
  preferenceReviewSection: {
    marginBottom: Spacing.md,
  },
  preferenceReviewTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
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
