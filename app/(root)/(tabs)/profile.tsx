import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { useAuth } from "@/app/context/AuthContext";
import { useDarkMode } from "@/app/context/DarkModeContext";
import { authService } from "@/api/authService";
import { UserModel } from "@/api/types";
import { RootState } from "@/store";

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useDarkMode();
  const [user, setUser] = useState<UserModel | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const notifications = useSelector(
    (state: RootState) => state.notifications.notifications
  );
  
  // Use the new notifications count selector for consistency
  const newNotificationsCount = useSelector(
    (state: RootState) => state.notifications.notifications.filter(n => !n.isRead).length
  );

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const res = await authService.getProfile(userId, token);
      setUser(res);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  }, []);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    header: {
      paddingBottom: 20,
      backgroundColor: colors.headerBackground,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.headerText,
    },
    logoutButton: {
      padding: 8,
    },
    userCard: {
      margin: 10,
      padding: 20,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 60,
      backgroundColor: "#E5E7EB",
      marginRight: 19,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    userHandle: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    editButton: {
      alignSelf: "flex-start",
    },
    section: {
      marginHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    menuCard: {
      padding: 0,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
    },
    badge: {
      backgroundColor: "#EF4444",
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
      minWidth: 20,
      alignItems: "center",
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 60,
    },
    statusCard: {
      padding: 16,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    statusItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusSuccess: {
      backgroundColor: "#D1FAE5",
    },
    statusError: {
      backgroundColor: "#FEE2E2",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
    statusSuccessText: {
      color: "#065F46",
    },
    statusErrorText: {
      color: "#991B1B",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalHeader: {
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
    },
    modalButton: {
      flex: 1,
    },
  });

  const renderHeader = () => (
    <View style={dynamicStyles.header}>
      <SafeAreaView>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={dynamicStyles.logoutButton}
          >
            <MaterialIcons name="logout" size={24} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderUserInfo = () => (
    <View style={dynamicStyles.userCard}>
      <View style={dynamicStyles.userInfo}>
        <Image
          source={{
            uri:
              user?.profileImageUrl ||
              "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
          }}
          style={dynamicStyles.avatar}
        />

        <View style={dynamicStyles.userDetails}>
          <Text style={dynamicStyles.userName}>{user?.name || "-"}</Text>
          <Text style={dynamicStyles.userHandle}>@{user?.userName || "-"}</Text>
          <Text style={dynamicStyles.userEmail}>{user?.email || "-"}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.editProfileButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/profile/edit-profile")}
      >
        <Text style={[styles.editProfileButtonText, { color: colors.surface }]}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuSection = (title: string, items: any[]) => (
    <View style={dynamicStyles.section}>
      <Text style={dynamicStyles.sectionTitle}>{title}</Text>
      <View style={dynamicStyles.menuCard}>
        {items.map((item, index) => (
          <View key={index}>
            {item.type === "switch" ? (
              <View style={dynamicStyles.menuItem}>
                <View style={dynamicStyles.menuItemLeft}>
                  <View style={dynamicStyles.iconContainer}>{item.icon}</View>
                  <Text style={dynamicStyles.menuItemText}>{item.label}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={item.value ? colors.primary : colors.textSecondary}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={item.onPress}
              >
                <View style={dynamicStyles.menuItemLeft}>
                  <View style={dynamicStyles.iconContainer}>{item.icon}</View>
                  <Text style={dynamicStyles.menuItemText}>{item.label}</Text>
                  {item.badge && (
                    <View style={dynamicStyles.badge}>
                      <Text style={dynamicStyles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            {index < items.length - 1 && (
              <View style={dynamicStyles.separator} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderStatusSection = () => (
    <View style={dynamicStyles.section}>
      <Text style={dynamicStyles.sectionTitle}>Account Status</Text>
      <View style={dynamicStyles.statusCard}>
        <StatusItem label="Email Verified" value={user?.emailVerified} />
        <StatusItem label="Phone Verified" value={user?.phoneVerified} />
        <StatusItem label="KYC Completed" value={user?.kycStatus} />
        <StatusItem label="Account Approved" value={user?.approvalStatus} />
        <StatusItem label="Account Active" value={user?.isActive} />
      </View>
    </View>
  );

  function StatusItem({
    label,
    value,
  }: {
    label: string;
    value: boolean | undefined;
  }) {
    return (
      <View style={dynamicStyles.statusItem}>
        <Text style={dynamicStyles.statusLabel}>{label}</Text>
        <View
          style={[
            dynamicStyles.statusBadge,
            value ? dynamicStyles.statusSuccess : dynamicStyles.statusError,
          ]}
        >
          <Ionicons
            name={value ? "checkmark" : "close"}
            size={12}
            color={value ? "#065F46" : "#991B1B"}
          />
          <Text
            style={[
              dynamicStyles.statusText,
              value
                ? dynamicStyles.statusSuccessText
                : dynamicStyles.statusErrorText,
            ]}
          >
            {value ? "Verified" : "Not Verified"}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <Text style={dynamicStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const accountMenuItems = [
    {
      icon: (
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      ),
      label: "Your Orders",
      onPress: () => router.push("/(root)/(tabs)/orders"),
    },
    {
      icon: (
        <Ionicons name="location-outline" size={20} color={colors.primary} />
      ),
      label: "Saved Addresses",
      onPress: () => router.push("/(root)/profile/addresses"),
    },
    {
      icon: <Ionicons name="person-outline" size={20} color={colors.primary} />,
      label: "View Profile",
      onPress: () => router.push("/(root)/profile/view-profile"),
    },
    {
      icon: <Ionicons name="card-outline" size={20} color={colors.primary} />,
      label: "Payment Methods",
      onPress: () => router.push("/(root)/profile/payment"),
    },
  ];

  const preferencesMenuItems = [
    {
      icon: <FontAwesome name="bell-o" size={20} color={colors.primary} />,
      label: "Notifications",
      badge: newNotificationsCount > 0 ? newNotificationsCount : undefined,
      onPress: () => router.push("/(root)/profile/notifications"),
    },
    {
      type: 'switch',
      icon: <Ionicons name="moon-outline" size={20} color={colors.primary} />,
      label: 'Dark Mode',
      value: isDarkMode,
      onToggle: toggleDarkMode,
    },
    {
      icon: (
        <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
      ),
      label: "Privacy Policy",
      onPress: () => router.push("/(root)/profile/privacy-policy"),
    },
  ];

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderUserInfo()}
        {renderMenuSection("My Account", accountMenuItems)}
        {renderMenuSection("Preferences", preferencesMenuItems)}
        {renderStatusSection()}
      </ScrollView>
      {/* signout model */}
      <SignOutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSignOut={logout}
      />
    </View>
  );
}
function SignOutModal({
  visible,
  onClose,
  onSignOut,
}: {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { colors } = useDarkMode();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.signOutModalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.signOutModalTitle, { color: colors.text }]}>
            Are you sure you want to sign out?
          </Text>
          <View style={styles.signOutModalButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.signOutCancelButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.signOutCancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onSignOut();
              }}
              style={styles.signOutConfirmButton}
            >
              <Text style={styles.signOutConfirmButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  editProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  editProfileButtonText: {
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
  },
  signOutModalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  signOutModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  signOutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signOutCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  signOutCancelButtonText: {
    fontWeight: '500',
  },
  signOutConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  signOutConfirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
