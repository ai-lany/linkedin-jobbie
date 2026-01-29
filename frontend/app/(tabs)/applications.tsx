import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJobs } from '../../context/JobContext';
import ApplicationReviewModal from '../../components/ApplicationReviewModal';
import { Job, EasyApplyData } from '../../types/job';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

interface AppliedJob {
  job: Job;
  appliedAt: string;
  applicationData: EasyApplyData;
}

export default function ApplicationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { appliedJobs } = useJobs();

  const [selectedApplication, setSelectedApplication] = useState<AppliedJob | null>(null);

  const formatAppliedTime = (dateString: string) => {
    const applied = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Applied today';
    if (diffDays === 1) return 'Applied yesterday';
    if (diffDays < 7) return `Applied ${diffDays} days ago`;
    return `Applied ${Math.floor(diffDays / 7)} weeks ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return colors.primary;
      case 'viewed':
        return colors.warning;
      case 'interview':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = () => {
    // For demo, all are submitted
    return 'Submitted';
  };

  const renderApplicationItem = ({ item }: { item: AppliedJob }) => {
    const { job, appliedAt } = item;
    const status = 'submitted'; // Demo status

    return (
      <TouchableOpacity
        style={[styles.applicationCard, { backgroundColor: colors.cardBackground }]}
        onPress={() => setSelectedApplication(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
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
            <Text style={[styles.location, { color: colors.textMuted }]}>{job.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.appliedTime, { color: colors.textMuted }]}>
              {formatAppliedTime(appliedAt)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => setSelectedApplication(item)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="paper-plane-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No applications yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start swiping right on jobs you're interested in. Your applications will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Applications</Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {appliedJobs.length} {appliedJobs.length === 1 ? 'application' : 'applications'}
        </Text>
      </View>

      {/* Stats Row */}
      {appliedJobs.length > 0 && (
        <View style={[styles.statsRow, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{appliedJobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Applied</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Viewed</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Interviews</Text>
          </View>
        </View>
      )}

      {/* Applications List */}
      <FlatList
        data={appliedJobs}
        keyExtractor={(item) => item.job.id}
        renderItem={renderApplicationItem}
        contentContainerStyle={[
          styles.listContent,
          appliedJobs.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />

      {/* Application Review Modal */}
      <Modal
        visible={selectedApplication !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedApplication(null)}
      >
        {selectedApplication && (
          <ApplicationReviewModal
            job={selectedApplication.job}
            applicationData={selectedApplication.applicationData}
            appliedAt={selectedApplication.appliedAt}
            onClose={() => setSelectedApplication(null)}
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
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  applicationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginBottom: 2,
  },
  location: {
    fontSize: FontSize.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appliedTime: {
    fontSize: FontSize.sm,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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