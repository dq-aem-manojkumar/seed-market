import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  markAllAsRead,
  setLastReadTimestamp,
  clearNotification,
} from "@/store/notificationSlice";
import { clearBadge } from "@/store/badgeSlice";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Notification } from "@/api/types";
import {
  markNotificationCleared,
  markNotificationAsClearedAll,
} from "@/api/services";
import { useDarkMode } from "@/app/context/DarkModeContext";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

export default function NotificationsScreen() {
  const { colors } = useDarkMode();
  const notifications = useSelector(
    (state: RootState) => state.notifications.notifications
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => {
      setUserId(id);
      setLoading(false);
    });
  }, []);
  const dispatch = useDispatch();

  // Clear badge and mark notifications as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(clearBadge("notifications"));
      dispatch(markAllAsRead());
      dispatch(setLastReadTimestamp(new Date().toISOString()));
    }, [dispatch])
  );

  // Also clear badge when component mounts
  useEffect(() => {
    dispatch(clearBadge("notifications"));
    dispatch(markAllAsRead());
    dispatch(setLastReadTimestamp(new Date().toISOString()));
  }, [dispatch]);

  const handleClearNotification = async (id: number) => {
    try {
      await markNotificationCleared(id); // Call backend
      dispatch(clearNotification(id)); // Update Redux state
    } catch (error: any) {
      console.error(
        "Failed to clear notification:",
        error.response?.data || error.message
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => setRefreshKey((k) => k + 1), 5000);
      return () => clearInterval(interval);
    }, [notifications.length])
  );
  const handleClearAllPress = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await markNotificationAsClearedAll(); // Backend call
              dispatch(clearBadge("notifications"));
              dispatch(markAllAsRead());
              dispatch(setLastReadTimestamp(new Date().toISOString()));
            } catch (err) {
              Alert.alert("Error", "Failed to clear notifications.");
            }
          },
        },
      ]
    );
  };
  if (loading || !userId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="purple" />
      </View>
    );
  }

  const sorted = [...notifications].sort((a, b) => {
    const getTime = (n: Notification) => {
      const dateStr =
        n.requestNotificationDto?.respondedAt ||
        n.requestNotificationDto?.sendAt ||
        "";
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    };
    return getTime(b) - getTime(a);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { backgroundColor: colors.headerBackground }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.headerText} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.headerText }]}>
          Notifications
        </Text>

        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAllPress}>
            <Text style={[styles.clearAllText, { color: colors.headerText }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {sorted.length > 0 ? (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id.toString()}
          extraData={refreshKey}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const { requestNotificationDto: r } = item;
            const time = r?.respondedAt || r?.sendAt;
            const formatted = moment(time).fromNow();

            const status = r?.requestStatus;
            const iconName =
              status === "ACCEPTED"
                ? "check-circle"
                : status === "REJECTED"
                ? "cancel"
                : "hourglass-empty";
            const iconColor =
              status === "ACCEPTED"
                ? "green"
                : status === "REJECTED"
                ? "red"
                : "orange";

            const isBuyer = r?.buyerId === userId;
            const isSeller = r?.sellerId === userId;

            // === Determine message dynamically if needed ===
            let message = item.description;
            const backendStatus = (item.description || "").toLowerCase();
            const product = r?.productName || "product";
            const requestId = r?.id ? `(Request ID: #${r.id})` : "";

            if (
              !message ||
              !backendStatus.includes(status?.toLowerCase() || "")
            ) {
              if (status === "PENDING" && isSeller) {
                message = `${r?.buyerName} has requested your ${product}`;
              } else if (status === "ACCEPTED" && isBuyer) {
                message = `Order request accepted from ${r?.sellerName} for ${product} `;
              } else if (status === "REJECTED" && isBuyer) {
                message = `Order request rejected from ${r?.sellerName} for ${product} `;
              } else {
                message = "You have a new notification.";
              }
            }

            return (
              <AnimatedCard style={styles.card}>
                <View style={styles.row}>
                  <MaterialIcons
                    name={iconName}
                    size={24}
                    color={iconColor}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {message}
                    </Text>
                    <Text
                      style={[styles.detail, { color: colors.textSecondary }]}
                    >
                      Quantity: {r?.desiredQuantity} kg
                    </Text>
                    <Text
                      style={[styles.detail, { color: colors.textSecondary }]}
                    >
                      Price: ₹{r?.desiredPricePerKg} /kg
                    </Text>
                    <Text
                      style={[styles.time, { color: colors.textSecondary }]}
                    >
                      {formatted}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleClearNotification(item.id)}
                    style={styles.closeIcon}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </AnimatedCard>
            );
          }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>No notifications found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  card: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "600" },
  time: { fontSize: 12, marginTop: 4 },
  detail: { fontSize: 12, marginTop: 2 },
  closeIcon: {
    marginLeft: 12,
    padding: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
