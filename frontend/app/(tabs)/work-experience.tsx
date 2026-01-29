import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

interface WorkHistoryEntry {
  _id: string;
  company: {
    _id: string;
    name: string;
  };
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

interface WorkHistoryFormData {
  companyName: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export default function WorkExperienceScreen() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<WorkHistoryFormData>({
    companyName: '',
    title: '',
    startDate: '',
    endDate: '',
    current: false,
  });

  useEffect(() => {
    fetchWorkHistory();
  }, []);

  const fetchWorkHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/work-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkHistory(data.workHistory || []);
      }
    } catch (err) {
      console.error('Failed to fetch work history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      companyName: '',
      title: '',
      startDate: '',
      endDate: '',
      current: false,
    });
    setIsModalVisible(true);
  };

  const openEditModal = (entry: WorkHistoryEntry) => {
    setEditingId(entry._id);
    setFormData({
      companyName: entry.company.name,
      title: entry.title,
      startDate: entry.startDate ? new Date(entry.startDate).toISOString().split('T')[0] : '',
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : '',
      current: entry.current,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.companyName.trim() || !formData.title.trim() || !formData.startDate) {
      Alert.alert('Error', 'Please fill in company name, title, and start date');
      return;
    }

    if (!formData.current && !formData.endDate) {
      Alert.alert('Error', 'Please provide an end date or mark as current position');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId
        ? `${API_URL}/work-history/${editingId}`
        : `${API_URL}/work-history`;

      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save work history');
      }

      Alert.alert(
        'Success',
        editingId ? 'Work experience updated successfully!' : 'Work experience added successfully!',
        [
          {
            text: 'OK',
            onPress: async () => {
              setIsModalVisible(false);
              await fetchWorkHistory();
              await refreshUser(); // Refresh user data to update count badge
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message || 'Failed to save work history. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Work Experience',
      'Are you sure you want to delete this work experience? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkHistory(id),
        },
      ]
    );
  };

  const deleteWorkHistory = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/work-history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete work history');
      }

      Alert.alert('Success', 'Work experience deleted successfully!');
      await fetchWorkHistory();
      await refreshUser(); // Refresh user data to update count badge
    } catch (err: any) {
      console.error('Delete error:', err);
      Alert.alert('Error', err.message || 'Failed to delete work history. Please try again.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (startDate: string, endDate?: string, current?: boolean) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Work Experience</Text>
        <TouchableOpacity onPress={openAddModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : workHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Work Experience</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add your work experience to help employers understand your background
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={openAddModal}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {workHistory.map((entry, index) => (
              <View
                key={entry._id}
                style={[
                  styles.workCard,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                  index === workHistory.length - 1 && { marginBottom: 0 },
                ]}
              >
                <View style={styles.workCardHeader}>
                  <View style={styles.workCardHeaderLeft}>
                    <View style={[styles.companyIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="business" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.workCardInfo}>
                      <Text style={[styles.jobTitle, { color: colors.text }]}>{entry.title}</Text>
                      <Text style={[styles.companyName, { color: colors.textSecondary }]}>
                        {entry.company.name}
                      </Text>
                      <Text style={[styles.duration, { color: colors.textMuted }]}>
                        {formatDate(entry.startDate)} - {entry.current ? 'Present' : formatDate(entry.endDate)} · {calculateDuration(entry.startDate, entry.endDate, entry.current)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.workCardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.divider }]}
                    onPress={() => openEditModal(entry)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.divider }]}
                    onPress={() => handleDelete(entry._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Edit Work Experience' : 'Add Work Experience'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Company Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                  placeholder="e.g. Google"
                  placeholderTextColor={colors.textMuted}
                  value={formData.companyName}
                  onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                />
              </View>

              {/* Job Title */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Job Title *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                  placeholder="e.g. Software Engineer"
                  placeholderTextColor={colors.textMuted}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              {/* Start Date */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={formData.startDate}
                  onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                />
                <Text style={[styles.inputHint, { color: colors.textMuted }]}>Format: YYYY-MM-DD (e.g. 2023-01-15)</Text>
              </View>

              {/* Current Position */}
              <View style={[styles.switchGroup, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>I currently work here</Text>
                <Switch
                  value={formData.current}
                  onValueChange={(value) => {
                    setFormData({ ...formData, current: value, endDate: value ? '' : formData.endDate });
                  }}
                  trackColor={{ false: colors.divider, true: colors.primary + '80' }}
                  thumbColor={formData.current ? colors.primary : colors.textSecondary}
                />
              </View>

              {/* End Date */}
              {!formData.current && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>End Date *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={formData.endDate}
                    onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                  />
                  <Text style={[styles.inputHint, { color: colors.textMuted }]}>Format: YYYY-MM-DD (e.g. 2024-01-15)</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingId ? 'Update Experience' : 'Add Experience'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  listContainer: {
    gap: Spacing.md,
  },
  workCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  workCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  workCardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  workCardInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  companyName: {
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  duration: {
    fontSize: FontSize.xs,
  },
  workCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
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
  modalScrollContent: {
    padding: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  inputHint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs / 2,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  switchLabel: {
    fontSize: FontSize.md,
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    minHeight: 48,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
