import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useJobs } from '../../context/JobContext';
import LinkedInJobDetailModal from '../../components/LinkedInJobDetailModal';
import { Job } from '../../types/job';

// Fallback AppModeContext hook: provides a no-op switchToJobbie until a proper AppModeContext module exists.
// Remove this stub and restore the original import when ../../context/AppModeContext is added.
type AppModeHook = {
  switchToJobbie: (job: Job) => void;
};
const useAppMode = (): AppModeHook => {
  return {
    switchToJobbie: (job: Job) => {
      // noop fallback to avoid runtime errors during development
      // You can add logging to help detect usage of the stub during development
      // and replace this implementation with the real context provider.
      // eslint-disable-next-line no-console
      console.warn('useAppMode (fallback): switchToJobbie called', job?.id ?? job);
    },
  };
};
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function LinkedInJobsTabScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { jobs, isLoading } = useJobs();
  const { switchToJobbie } = useAppMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)}/yr - ${formatter.format(salary.max)}/yr`;
  };

  const formatPostedTime = (dateString: string) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handleJobbieClick = (job: Job) => {
    setSelectedJob(null);
    switchToJobbie(job);
    // Navigate to swipe page after switching mode
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={[styles.jobCard, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}
      onPress={() => setSelectedJob(item)}
      activeOpacity={0.7}
    >
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardLeft}>
          <View style={[styles.companyLogo, { backgroundColor: colors.cardBackground }]}>
            {item.company.logo && item.company.logo.length > 0 ? (
              <Image source={{ uri: item.company.logo }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.logoPlaceholderText, { color: colors.textInverse }]}>
                  {item.company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.jobInfo}>
            <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.companyName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.company.name}
            </Text>
            <Text style={[styles.jobLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location} ({item.locationType})
            </Text>
            {item.salary && (
              <Text style={[styles.jobSalary, { color: colors.textSecondary }]} numberOfLines={1}>
                {formatSalary(item.salary)}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto' }}>
                <Text style={[styles.jobPosted, { color: colors.textMuted, marginTop: 0 }]}>
                  Posted {formatPostedTime(item.postedAt)}
                </Text>
                <Text style={[styles.jobPosted, { color: colors.textMuted, marginTop: 0, marginLeft: 4 }]}>
                  ⋅
                </Text>
              </View>
              {item.easyApply && (
              <View style={[styles.easyApplyRow, { marginLeft: 6 }]}>
                <Image
                source={require('../../assets/images/linkedin_logo.png')}
                style={{ width: 12, height: 12, resizeMode: 'contain' }}
                />
                <Text style={[styles.easyApplyText, { color: colors.primary }]}>Easy Apply</Text>
              </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.dismissButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <View style={styles.profilePic}>
          <Ionicons name="person-circle" size={48} color={colors.primary} />
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Describe the job you want"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-ellipses" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={[styles.filterRow, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity style={[styles.filterPill, { borderColor: colors.border }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, { borderColor: colors.border }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>Job tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, { borderColor: colors.border }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>Post a free job</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Jobs based on your preferences
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            Software Engineer or Full Stack Engineer or Back End Developer or Frontend Developer...
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="pencil" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Job List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Job Detail Modal */}
      <Modal
        visible={selectedJob !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJob(null)}
      >
        {selectedJob && (
          <LinkedInJobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onJobbieClick={() => handleJobbieClick(selectedJob)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  profilePic: {
    width: 48,
    height: 48,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
  },
  messageButton: {
    padding: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  jobCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
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
  logoPlaceholderText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  jobInfo: {
    flex: 1,
    gap: 4,
  },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  companyName: {
    fontSize: FontSize.sm,
  },
  jobLocation: {
    fontSize: FontSize.sm,
  },
  jobSalary: {
    fontSize: FontSize.sm,
  },
  easyApplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  easyApplyText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  jobPosted: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
  },
});
