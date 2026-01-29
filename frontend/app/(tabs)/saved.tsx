import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import ExpandedJobCard from '../../components/ExpandedJobCard';
import EasyApplyModal from '../../components/EasyApplyModal';
import { Job, EasyApplyData } from '../../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const defaultBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl;

export default function SavedScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { currentUser, token } = useAuth();
  const autoApplyEnabled = Boolean(currentUser?.additionalInfo?.autoApply);

  const { savedJobs, unsaveJob, applyToJob } = useJobs();

  const [expandedJob, setExpandedJob] = useState<Job | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

  const canAutoApply = Boolean(
    autoApplyEnabled && currentUser?.email && currentUser?.phoneNumber && currentUser?.resume && token
  );

  const formatSavedTime = (dateString: string) => {
    const saved = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - saved.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Saved today';
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    return `Saved ${Math.floor(diffDays / 7)} weeks ago`;
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const fetchCoverLetter = useCallback(
    async (jobId: string) => {
      if (!token) {
        return '';
      }

      try {
        const response = await fetch(`${apiBaseUrl}/agent/cover-letter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId }),
        });

        if (!response.ok) {
          return '';
        }

        const data = await response.json();
        return data.coverLetter || '';
      } catch (err) {
        console.error('Cover letter generation failed:', err);
        return '';
      }
    },
    [token]
  );

  const handleAutoApply = useCallback(
    async (job: Job) => {
      if (!canAutoApply) {
        setApplyingJob(job);
        return;
      }

      const coverLetter = await fetchCoverLetter(job.id);
      const applicationData: EasyApplyData = {
        resume: currentUser?.resume ?? null,
        phone: currentUser?.phoneNumber ?? '',
        email: currentUser?.email ?? '',
        additionalQuestions: [],
        coverLetter,
      };
      applyToJob(job, applicationData);
    },
    [applyToJob, canAutoApply, currentUser?.email, currentUser?.phoneNumber, currentUser?.resume, fetchCoverLetter]
  );

  const handleApply = useCallback(
    (job: Job) => {
      void handleAutoApply(job);
    },
    [handleAutoApply]
  );

  const handleApplySubmit = (data: EasyApplyData) => {
    if (applyingJob) {
      applyToJob(applyingJob, data);
    }
    setApplyingJob(null);
  };

  const handleRemove = (jobId: string) => {
    unsaveJob(jobId);
  };

  const renderJobItem = ({ item }: { item: { job: Job; savedAt: string } }) => {
    const { job, savedAt } = item;

    return (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: colors.cardBackground }]}
        onPress={() => setExpandedJob(job)}
        activeOpacity={0.7}
      >
        <View style={styles.jobHeader}>
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
          <View style={styles.jobInfo}>
            <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={[styles.companyName, { color: colors.textSecondary }]} numberOfLines={1}>
              {job.company.name}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}</Text>
              {job.salary && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
                  <Text style={[styles.salaryText, { color: colors.success }]}>
                    {formatSalary(job.salary)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <Text style={[styles.savedTime, { color: colors.textMuted }]}>
            {formatSavedTime(savedAt)}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => handleRemove(job.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => handleApply(job)}
            >
              <Text style={[styles.applyButtonText, { color: colors.textInverse }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="bookmark-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved jobs</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Swipe up on jobs you want to save for later. They will appear here so you can apply when
        you are ready.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Jobs</Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'}
        </Text>
      </View>

      {/* Job List */}
      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.job.id}
        renderItem={renderJobItem}
        contentContainerStyle={[
          styles.listContent,
          savedJobs.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />

      {/* Expanded Job Modal */}
      <Modal
        visible={expandedJob !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpandedJob(null)}
      >
        {expandedJob && (
          <ExpandedJobCard
            job={expandedJob}
            onClose={() => setExpandedJob(null)}
            onApply={() => {
              const job = expandedJob;
              setExpandedJob(null);
              setTimeout(() => {
                if (job) {
                  void handleAutoApply(job);
                }
              }, 300);
            }}
            onSkip={() => {
              const jobId = expandedJob.id;
              setExpandedJob(null);
              setTimeout(() => unsaveJob(jobId), 300);
            }}
            onSave={() => setExpandedJob(null)}
          />
        )}
      </Modal>

      {/* Easy Apply Modal */}
      <Modal
        visible={applyingJob !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setApplyingJob(null)}
      >
        {applyingJob && (
          <EasyApplyModal
            job={applyingJob}
            currentUser={currentUser}
            token={token}
            onClose={() => setApplyingJob(null)}
            onSubmit={handleApplySubmit}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  headerCount: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  jobCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  jobInfo: {
    flex: 1,
    marginLeft: Spacing.md,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
  metaDot: {
    fontSize: FontSize.xs,
  },
  salaryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  savedTime: {
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  applyButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});