import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import * as DocumentPicker from 'expo-document-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ResumesScreen() {
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name,
      } as any);

      const response = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload resume');
      }

      Alert.alert('Success', 'Resume uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/(tabs)/profile');
          },
        },
      ]);
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Error', err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = () => {
    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteResume,
        },
      ]
    );
  };

  const deleteResume = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_URL}/resumes/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete resume');
      }

      Alert.alert('Success', 'Resume deleted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/(tabs)/profile');
          },
        },
      ]);
    } catch (err: any) {
      console.error('Delete error:', err);
      Alert.alert('Error', err.message || 'Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewResume = () => {
    if (currentUser?.resume) {
      const resumeUrl = `${API_URL.replace('/api', '')}${currentUser.resume}`;
      Linking.openURL(resumeUrl).catch((err) => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Failed to open resume. Please try again.');
      });
    }
  };

  const getFileName = (path: string) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Resumes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Upload your resume to quickly apply to jobs. Accepted formats: PDF, DOC, DOCX (Max 5MB)
          </Text>
        </View>

        {/* Current Resume Section */}
        {currentUser?.resume ? (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Resume</Text>
            </View>

            <View style={[styles.resumeCard, { backgroundColor: colors.background, borderColor: colors.divider }]}>
              <View style={styles.resumeInfo}>
                <Ionicons name="document" size={32} color={colors.primary} />
                <View style={styles.resumeDetails}>
                  <Text style={[styles.resumeName, { color: colors.text }]} numberOfLines={1}>
                    {getFileName(currentUser.resume)}
                  </Text>
                  <Text style={[styles.resumeMeta, { color: colors.textSecondary }]}>
                    Uploaded resume
                  </Text>
                </View>
              </View>

              <View style={styles.resumeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleViewResume}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={handleDeleteResume}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Resume Uploaded</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Upload your resume to get started with job applications
              </Text>
            </View>
          </View>
        )}

        {/* Upload New Resume Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {currentUser?.resume ? 'Upload New Resume' : 'Upload Resume'}
            </Text>
          </View>

          <Text style={[styles.uploadDescription, { color: colors.textSecondary }]}>
            {currentUser?.resume
              ? 'Upload a new resume to replace your current one.'
              : 'Select a file from your device to upload.'}
          </Text>

          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.primary }]}
            onPress={handlePickDocument}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsSection, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.tipTitle, { color: colors.primary }]}>Tips for a Great Resume</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Keep it concise - 1-2 pages maximum
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Highlight relevant skills and achievements
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Use a clean, professional format
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Proofread for errors and typos
              </Text>
            </View>
          </View>
        </View>
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
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  infoSection: {
    padding: Spacing.md,
  },
  infoText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  resumeCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resumeDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  resumeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  resumeMeta: {
    fontSize: FontSize.sm,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
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
  },
  uploadDescription: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  tipsSection: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  tipText: {
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
