import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function PickerModal({ visible, title, options, selectedValue, onSelect, onClose }: PickerModalProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.divider },
                  selectedValue === option.value && { backgroundColor: colors.primary + '10' },
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: colors.text },
                    selectedValue === option.value && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { currentUser, updateUserPreferences, isLoading, error } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [preferences, setPreferences] = useState({
    workAuthorizationInCountry: false,
    needsVisa: false,
    ethnicity: 'Prefer not to say',
    veteran: 'Prefer not to say',
    disability: 'Prefer not to say',
    resumeTailoring: false,
    autoApply: false,
    gender: 'Prefer not to say',
    willingToRelocate: false,
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Load existing preferences on mount
  useEffect(() => {
    if (currentUser?.additionalInfo) {
      setPreferences({
        workAuthorizationInCountry: currentUser.additionalInfo.workAuthorizationInCountry || false,
        needsVisa: currentUser.additionalInfo.needsVisa || false,
        ethnicity: currentUser.additionalInfo.ethnicity || 'Prefer not to say',
        veteran: currentUser.additionalInfo.veteran || 'Prefer not to say',
        disability: currentUser.additionalInfo.disability || 'Prefer not to say',
        resumeTailoring: currentUser.additionalInfo.resumeTailoring || false,
        autoApply: currentUser.additionalInfo.autoApply || false,
        gender: currentUser.additionalInfo.gender || 'Prefer not to say',
        willingToRelocate: currentUser.additionalInfo.willingToRelocate || false,
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    const success = await updateUserPreferences(preferences);
    if (success) {
      Alert.alert(
        'Success',
        'Your preferences have been saved!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/profile'),
          },
        ]
      );
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const genderOptions: PickerOption[] = [
    { label: 'Prefer not to say', value: 'Prefer not to say' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Non-binary', value: 'Non-binary' },
    { label: 'Other', value: 'Other' },
  ];

  const ethnicityOptions: PickerOption[] = [
    { label: 'Prefer not to say', value: 'Prefer not to say' },
    { label: 'Asian', value: 'Asian' },
    { label: 'Black or African American', value: 'Black or African American' },
    { label: 'Hispanic or Latino', value: 'Hispanic or Latino' },
    { label: 'Native American or Alaska Native', value: 'Native American or Alaska Native' },
    { label: 'Native Hawaiian or Pacific Islander', value: 'Native Hawaiian or Pacific Islander' },
    { label: 'White', value: 'White' },
    { label: 'Two or more races', value: 'Two or more races' },
  ];

  const veteranOptions: PickerOption[] = [
    { label: 'Prefer not to say', value: 'Prefer not to say' },
    { label: 'I am not a protected veteran', value: 'I am not a protected veteran' },
    { label: 'I identify as one or more of the classifications of protected veteran', value: 'I identify as one or more of the classifications of protected veteran' },
  ];

  const disabilityOptions: PickerOption[] = [
    { label: 'Prefer not to say', value: 'Prefer not to say' },
    { label: 'Yes, I have a disability (or previously had a disability)', value: 'Yes, I have a disability (or previously had a disability)' },
    { label: 'No, I don\'t have a disability', value: 'No, I don\'t have a disability' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Job Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Intro Text */}
        <View style={styles.introSection}>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            These preferences help us match you with the right opportunities. All fields are optional and can be updated anytime.
          </Text>
        </View>

        {/* Work Authorization Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Authorization</Text>

          {/* Are you authorized to work in this country? */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Are you authorized to work in this country?
            </Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.workAuthorizationInCountry && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, workAuthorizationInCountry: true })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: preferences.workAuthorizationInCountry ? '#fff' : colors.text },
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !preferences.workAuthorizationInCountry && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, workAuthorizationInCountry: false })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: !preferences.workAuthorizationInCountry ? '#fff' : colors.text },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Will you need visa sponsorship? */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Will you need visa sponsorship?
            </Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.needsVisa && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, needsVisa: true })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: preferences.needsVisa ? '#fff' : colors.text },
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !preferences.needsVisa && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, needsVisa: false })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: !preferences.needsVisa ? '#fff' : colors.text },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Are you willing to relocate? */}
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Are you willing to relocate?
            </Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.willingToRelocate && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, willingToRelocate: true })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: preferences.willingToRelocate ? '#fff' : colors.text },
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !preferences.willingToRelocate && { backgroundColor: colors.primary },
                  { borderColor: colors.divider },
                ]}
                onPress={() => setPreferences({ ...preferences, willingToRelocate: false })}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: !preferences.willingToRelocate ? '#fff' : colors.text },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Equal Opportunity Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Equal Opportunity (Optional)</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            This information helps employers track diversity metrics and is completely optional.
          </Text>

          <TouchableOpacity
            style={[styles.pickerRow, { borderBottomColor: colors.divider }]}
            onPress={() => setActiveModal('gender')}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>{preferences.gender}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerRow, { borderBottomColor: colors.divider }]}
            onPress={() => setActiveModal('ethnicity')}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Ethnicity</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>{preferences.ethnicity}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerRow, { borderBottomColor: colors.divider }]}
            onPress={() => setActiveModal('veteran')}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Veteran Status</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]} numberOfLines={1}>
                {preferences.veteran}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setActiveModal('disability')}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Disability Status</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]} numberOfLines={1}>
                {preferences.disability}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Privacy Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} style={styles.infoIcon} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>Your privacy matters</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Your information is secure and never shared without your permission. You can update these preferences anytime.
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PickerModal
        visible={activeModal === 'gender'}
        title="Select Gender"
        options={genderOptions}
        selectedValue={preferences.gender}
        onSelect={(value) => setPreferences({ ...preferences, gender: value })}
        onClose={() => setActiveModal(null)}
      />

      <PickerModal
        visible={activeModal === 'ethnicity'}
        title="Select Ethnicity"
        options={ethnicityOptions}
        selectedValue={preferences.ethnicity}
        onSelect={(value) => setPreferences({ ...preferences, ethnicity: value })}
        onClose={() => setActiveModal(null)}
      />

      <PickerModal
        visible={activeModal === 'veteran'}
        title="Select Veteran Status"
        options={veteranOptions}
        selectedValue={preferences.veteran}
        onSelect={(value) => setPreferences({ ...preferences, veteran: value })}
        onClose={() => setActiveModal(null)}
      />

      <PickerModal
        visible={activeModal === 'disability'}
        title="Select Disability Status"
        options={disabilityOptions}
        selectedValue={preferences.disability}
        onSelect={(value) => setPreferences({ ...preferences, disability: value })}
        onClose={() => setActiveModal(null)}
      />
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
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  introSection: {
    padding: Spacing.md,
  },
  introText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs / 2,
  },
  switchDescription: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  toggleRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  pickerTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  pickerLabel: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs / 2,
  },
  pickerValue: {
    fontSize: FontSize.md,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs / 2,
  },
  infoText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: FontSize.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
});
