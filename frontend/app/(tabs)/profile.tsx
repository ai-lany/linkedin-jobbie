import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { savedJobs, appliedJobs } = useJobs();
  const { currentUser, logout } = useAuth();

  const menuItems = [
    { icon: 'document-text-outline', label: 'My Resumes', count: 2 },
    { icon: 'settings-outline', label: 'Job Preferences', count: null },
    { icon: 'notifications-outline', label: 'Notifications', count: 3 },
    { icon: 'shield-checkmark-outline', label: 'Privacy', count: null },
    { icon: 'help-circle-outline', label: 'Help & Support', count: null },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={40} color={colors.textInverse} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>
                {currentUser?.username || 'John Doe'}
              </Text>
              <Text style={[styles.headline, { color: colors.textSecondary }]}>
                Software Engineer
              </Text>
              <Text style={[styles.location, { color: colors.textMuted }]}>
                {currentUser?.email || 'user@example.com'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{savedJobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{appliedJobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Applied</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Interviews</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.divider, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.count !== null && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>
                      {item.count}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.cardBackground }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>Jobbie v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  headline: {
    fontSize: FontSize.md,
    marginTop: 2,
  },
  location: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
  menuContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
});