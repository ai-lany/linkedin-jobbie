import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import SwipeableJobCard from '../../components/SwipeableJobCard';
import ActionButtons from '../../components/ActionButtons';
import ExpandedJobCard from '../../components/ExpandedJobCard';
import EasyApplyModal from '../../components/EasyApplyModal';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { Job, SwipeDirection, EasyApplyData } from '../../types/job';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

const defaultBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl;

export default function DiscoverScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const autoApplyEnabled = Boolean(currentUser?.additionalInfo?.autoApply);

  const {
    jobs,
    currentIndex,
    currentJob,
    hasMoreJobs,
    handleSwipe,
    handleUndo,
    canUndo,
    applyToJob,
    updateApplicationStatus,
    isLoading,
    error,
  } = useJobs();

  const canAutoApply = Boolean(
    autoApplyEnabled && currentUser?.email && currentUser?.phoneNumber && currentUser?.resume && token
  );

  // Debug logging - remove in production
  React.useEffect(() => {
    console.log('🔍 Auto-apply Debug Info:', {
      autoApplyEnabled,
      hasEmail: !!currentUser?.email,
      hasPhone: !!currentUser?.phoneNumber,
      hasResume: !!currentUser?.resume,
      hasToken: !!token,
      canAutoApply,
      currentUser: currentUser ? {
        email: currentUser.email,
        phone: currentUser.phoneNumber,
        resume: currentUser.resume,
        autoApplySetting: currentUser.additionalInfo?.autoApply
      } : 'Not logged in'
    });
  }, [autoApplyEnabled, currentUser, token, canAutoApply]);

  const [expandedJob, setExpandedJob] = useState<Job | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

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
      console.log('🎯 handleAutoApply called for job:', job.title);
      console.log('🔍 canAutoApply:', canAutoApply);

      if (!canAutoApply) {
        console.log('❌ Auto-apply check failed - showing modal');
        setApplyingJob(job);
        return;
      }

      console.log('✅ Auto-apply check passed - starting background process');

      try {
        // Add to applied jobs immediately with 'pending' status
        applyToJob(job, {
          resume: currentUser?.resume ?? null,
          phone: currentUser?.phoneNumber ?? '',
          email: currentUser?.email ?? '',
          additionalQuestions: [],
          coverLetter: '',
        }, 'pending');

        // Call background auto-apply endpoint
        const response = await fetch(`${apiBaseUrl}/agent/auto-apply/${job.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Application failed');
        }

        const data = await response.json();

        // Update status to completed
        updateApplicationStatus(job.id, 'completed', data.applicationId);

        // Success notification (using Alert for now, can be replaced with toast component)
        if (Platform.OS === 'web') {
          console.log(`Applied to ${job.title} successfully!`);
        }

      } catch (err) {
        // Update status to failed
        updateApplicationStatus(job.id, 'failed');

        // Error notification
        console.error('Auto-apply failed:', err);
        Alert.alert('Application Failed', `Failed to apply to ${job.title}. Please try again.`);
      }
    },
    [applyToJob, canAutoApply, currentUser?.email, currentUser?.phoneNumber, currentUser?.resume, token, updateApplicationStatus]
  );

  // Handle swipe with apply modal trigger
  const onSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentJob) return;

      const jobToApply = currentJob;
      handleSwipe(direction);

      if (direction === 'right') {
        // User is interested - open apply modal after animation
        setTimeout(() => {
          void handleAutoApply(jobToApply);
        }, 400);
      }
    },
    [currentJob, handleAutoApply, handleSwipe]
  );

  // Handle card tap - expand details
  const handleCardPress = useCallback(() => {
    if (currentJob) {
      setExpandedJob(currentJob);
    }
  }, [currentJob]);

  // Handle actions from expanded card
  const handleExpandedApply = useCallback(() => {
    const jobToApply = currentJob;
    setExpandedJob(null);
    setTimeout(() => {
      if (jobToApply) {
        void handleAutoApply(jobToApply);
      }
    }, 300);
  }, [currentJob, handleAutoApply]);

  const handleExpandedSkip = useCallback(() => {
    setExpandedJob(null);
    setTimeout(() => {
      onSwipe('left');
    }, 300);
  }, [onSwipe]);

  const handleExpandedSave = useCallback(() => {
    setExpandedJob(null);
    setTimeout(() => {
      onSwipe('up');
    }, 300);
  }, [onSwipe]);

  // Handle button actions
  const handleButtonSkip = useCallback(() => {
    onSwipe('left');
  }, [onSwipe]);

  const handleButtonSave = useCallback(() => {
    onSwipe('up');
  }, [onSwipe]);

  const handleButtonApply = useCallback(() => {
    onSwipe('right');
  }, [onSwipe]);

  // Handle easy apply submission
  const handleApplySubmit = useCallback(
    (data: EasyApplyData) => {
      if (applyingJob) {
        applyToJob(applyingJob, data, 'completed');  // Manual apps are completed immediately
      }
      setApplyingJob(null);
    },
    [applyingJob, applyToJob]
  );

  // Handle modal close without submitting - bring the job back
  const handleApplyClose = useCallback(() => {
    setApplyingJob(null);
    handleUndo(); // Undo the swipe to bring the job card back
  }, [handleUndo]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Header
          showBackButton={true}
          onBackPress={() => router.push('/(linkedin)/jobs')}
          onSettingsPress={() => console.log('Settings pressed')}
          onFilterPress={() => console.log('Filter pressed')}
        />

        {/* Card Stack Area */}
        <View style={styles.cardContainer}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="hourglass-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Loading jobs...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Error loading jobs</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {error}
              </Text>
            </View>
          ) : hasMoreJobs ? (
            <>
              {/* Render cards in reverse order so the current one is on top */}
              {jobs
                .slice(currentIndex, currentIndex + 3)
                .reverse()
                .map((job, reverseIndex) => {
                  const actualIndex = 2 - reverseIndex;
                  return (
                    <SwipeableJobCard
                      key={job.id}
                      job={job}
                      onSwipe={onSwipe}
                      onPress={handleCardPress}
                      isActive={actualIndex === 0}
                      index={actualIndex}
                    />
                  );
                })}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="briefcase-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No more jobs</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Check back later for new opportunities or adjust your filters
              </Text>
            </View>
          )}
        </View>
        {/* Action Buttons */}
        {hasMoreJobs && (
          <View style={[styles.actionsContainer, { backgroundColor: colors.background }]}>
            <ActionButtons
              onSkip={handleButtonSkip}
              onSave={handleButtonSave}
              onApply={handleButtonApply}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          </View>
        )}

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
              onApply={handleExpandedApply}
              onSkip={handleExpandedSkip}
              onSave={handleExpandedSave}
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
              onClose={handleApplyClose}
              onSubmit={handleApplySubmit}
            />
          )}
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  actionsContainer: {
    paddingBottom: Spacing.md,
  },
  emptyState: {
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