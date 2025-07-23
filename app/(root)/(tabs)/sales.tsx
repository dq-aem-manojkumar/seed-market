import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getReceivedNotifications,
  respondToNotification,
} from "@/api/services";
import { useApi } from "@/hooks/useApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import AnimatedCard from "@/app/components/ui/AnimatedCard";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { clearBadge } from "@/store/badgeSlice";
import { useFocusEffect } from "expo-router";
import { useDarkMode } from "@/app/context/DarkModeContext";

export default function SalesScreen() {
  const { colors } = useDarkMode();
  const dispatch = useDispatch();
  const { response, loading, error, refetch } = useApi(
    getReceivedNotifications,
    { immediate: true }
  );

  const receivedNotifications = response?.response ?? [];
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Sort notifications by sendAt date (newest first)
  const sortedNotifications = [...receivedNotifications].sort((a, b) => {
    const dateA = new Date(a.requestNotificationDto?.sendAt || a.sendAt || 0).getTime();
    const dateB = new Date(b.requestNotificationDto?.sendAt || b.sendAt || 0).getTime();
    return dateB - dateA;
  });
  
  const pendingRequests = sortedNotifications.filter(
    (item) => item.requestStatus === "PENDING"
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Clear sales badge when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(clearBadge('sales'));
    }, [dispatch])
  );

  const handleViewSalesDetails = (item: any) => {
    router.push({
      pathname: "/(root)/profile/SalesDetails",
      params: {
        buyerName: String(item.buyerName ?? ""),
        productName: String(item.productName ?? ""),
        quantity: String(item.desiredQuantity ?? ""),
        pricePerKg: String(item.desiredPricePerKg ?? ""),
        requestStatus: item.requestStatus,
        sellAt: String(item.sellAt ?? ""),
      },
    });
  };

  const handleRespond = async (id: number, status: "ACCEPTED" | "REJECTED") => {
    try {
      await respondToNotification(id, status);
      Alert.alert("Success", `Request ${status.toLowerCase()} successfully`, [
        { text: "OK" },
      ]);
      refetch();
    } catch (error) {
      console.error("Error responding:", error);
      Alert.alert("Error", "Failed to update request status");
    }
  };

  const handleContactBuyer = (
    buyerId: string,
    buyerName: string,
    productId: number
  ) => {
    router.push({
      pathname: "/(root)/chat/[receiverId]",
      params: {
        receiverId: buyerId,
        productId: productId.toString(),
        receiverName: buyerName,
      },
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              Sales Requests
            </Text>
            <Text style={[styles.headerSubtitle, { color: `${colors.headerText}CC` }]}>
              {pendingRequests.length} pending request
              {pendingRequests.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.headerText }]}>
                {sortedNotifications.length}
              </Text>
              <Text style={[styles.statLabel, { color: `${colors.headerText}CC` }]}>
                Total
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderRequestItem = ({ item, index }: { item: any; index: number }) => {
    const status = item.requestStatus || item.status || "PENDING";
    const totalAmount = (item.desiredQuantity * item.desiredPricePerKg).toFixed(
      2
    );

    return (
      <TouchableOpacity
        onPress={() => handleViewSalesDetails(item)}
        activeOpacity={0.9}
      >
        <AnimatedCard style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]}>
                {item.productName || `Product #${item.productId}`}
              </Text>
              <Text style={[styles.buyerName, { color: colors.textSecondary }]}>
                Request from {item.buyerName || "Unknown Buyer"}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                status === "ACCEPTED"
                  ? styles.acceptedBadge
                  : status === "REJECTED"
                  ? styles.rejectedBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === "ACCEPTED"
                    ? styles.acceptedText
                    : status === "REJECTED"
                    ? styles.rejectedText
                    : styles.pendingText,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="scale-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Quantity
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {item.desiredQuantity} kg
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Price
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  ₹{item.desiredPricePerKg}/kg
                </Text>
              </View>
            </View>

            <View style={[styles.totalContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total Amount:
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                ₹{totalAmount}
              </Text>
            </View>
          </View>

          {status === "PENDING" && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.rejectButton, { borderColor: "#EF4444" }]}
                onPress={() => handleRespond(item.id, "REJECTED")}
              >
                <Text style={[styles.rejectButtonText, { color: "#EF4444" }]}>
                  Reject
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: "#10B981" }]}
                onPress={() => handleRespond(item.id, "ACCEPTED")}
              >
                <Text style={[styles.acceptButtonText, { color: "#FFFFFF" }]}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactButton, { borderColor: colors.primary }]}
                onPress={() =>
                  handleContactBuyer(
                    item.buyerId,
                    item.buyerName,
                    item.productId
                  )
                }
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={[styles.contactButtonText, { color: colors.primary }]}>
                  Contact
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </AnimatedCard>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading sales requests...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load requests
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedNotifications}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <AnimatedCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No sales requests
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                When buyers request your products, they'll appear here
              </Text>
            </View>
          </AnimatedCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
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
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100,
  },
  requestCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  acceptedBadge: {
    backgroundColor: "#D1FAE5",
  },
  rejectedBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pendingText: {
    color: "#92400E",
  },
  acceptedText: {
    color: "#065F46",
  },
  rejectedText: {
    color: "#991B1B",
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 6,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
    marginTop: 40,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});