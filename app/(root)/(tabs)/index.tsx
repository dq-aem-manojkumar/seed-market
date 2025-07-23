import React, { useState, useCallback } from "react";
import { getProducts, createNotificationRequest } from "@/api/services";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { useDarkMode } from "@/app/context/DarkModeContext";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

import { selectNewNotificationsCount } from "@/store/notificationSlice";
import useFetch from "@/hooks/useFetch";
import { RootState } from "@/store";
import ProductCard from "@/app/components/ProductCard";

import Input from "@/app/components/ui/Input";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

export default function Home() {
  const { colors } = useDarkMode();
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ min: 0, max: 50 });
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [inputQty, setInputQty] = useState("");
  const [unit, setUnit] = useState<"kg" | "g">("kg");
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useFetch(() => getProducts(0, 50, filters.min, filters.max));

  const notifications = useSelector(
    (state: RootState) => state.notifications.notifications.length
  );

  useFocusEffect(
    useCallback(() => {
      const fetchUserId = async () => {
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);
      };
      fetchUserId();
      refetch();
    }, [filters])
  );

  const products = (response?.response || []).filter(
    (product) => product.remainingQuantityKg > 0 && product.userId !== userId
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openRequestModal = (product: any) => {
    setSelectedProduct(product);
    setInputQty("");
    setUnit("kg");
    setRequestModalVisible(true);
  };

  const handleChatPress = (product: any) => {
    router.push({
      pathname: "/(root)/chat/[receiverId]",
      params: {
        receiverId: product.userId,
        productId: product.id,
        receiverName: product.seller?.name || "User",
      },
    });
  };

  const confirmRequest = async () => {
    if (!inputQty || !selectedProduct) return;

    let qtyGrams = parseFloat(inputQty);
    if (unit === "kg") qtyGrams *= 1000;

    if (qtyGrams > selectedProduct.remainingQuantityKg * 1000) {
      alert("Not enough stock available");
      return;
    }

    try {
      const buyerId = await AsyncStorage.getItem("userId");
      const sellerId = selectedProduct?.userId;

      if (!buyerId || !sellerId) {
        alert("User or Seller info missing.");
        return;
      }

      await createNotificationRequest({
        buyerId,
        sellerId,
        productId: selectedProduct.id,
        desiredQuantity: qtyGrams / 1000,
        desiredPricePerKg: selectedProduct.pricePerKg,
        requestStatus: "PENDING",
        sendAt: new Date().toISOString(),
      });

      alert("Request sent successfully");
      setRequestModalVisible(false);
    } catch (err) {
      console.error("Notification request failed:", err);
      alert("Failed to send request.");
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.headerText }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.subtitle, { color: `${colors.headerText}CC` }]}>
              Find fresh seeds for your farm
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(root)/profile/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={32}
                color={colors.headerText}
              />
              {notifications > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.badgeBackground }]}>
                  <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                    {notifications > 99 ? "99+" : notifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Wishlist Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(root)/profile/wishtlist")}
            >
              <FontAwesome6 name="heart" size={30} color={colors.headerText} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = "Farmer";

    if (hour < 12) {
      return `Good morning, ${userName}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${userName}!`;
    } else {
      return `Good evening, ${userName}!`;
    }
  };

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Input
        placeholder="Search products..."
        value={searchText}
        onChangeText={setSearchText}
        leftIcon="search-outline"
        containerStyle={styles.searchInput}
      />

      <TouchableOpacity
        onPress={() => setPriceModalVisible(true)}
        style={[styles.filterButton, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="options-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load products
        </Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={refetch}>
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
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderSearchAndFilters()}
          </>
        }
        renderItem={({ item, index }) => (
          <ProductCard
            product={item}
            delay={index * 0.1}
            onPress={() => router.push(`/(root)/product/${item.id}`)}
            onChatPress={() => handleChatPress(item)}
            onRequestPress={() => openRequestModal(item)}
            isOwner={item.userId === userId}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <AnimatedCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No products found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          </AnimatedCard>
        }
      />

      {/* Price Filter Modal */}
      <Modal
        visible={priceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <AnimatedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter by Price
              </Text>
              <TouchableOpacity
                onPress={() => setPriceModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sliderLabel, { color: colors.text }]}>
              Price Range: ₹{filters.min} - ₹{filters.max}
            </Text>

            <MultiSlider
              values={[filters.min, filters.max]}
              min={0}
              max={1000}
              step={10}
              onValuesChangeFinish={(values) =>
                setFilters({ min: values[0], max: values[1] })
              }
              selectedStyle={{ backgroundColor: colors.primary }}
              unselectedStyle={{ backgroundColor: colors.border }}
              containerStyle={{ height: 40 }}
              trackStyle={{ height: 4, borderRadius: 2 }}
              markerStyle={{
                backgroundColor: colors.primary,
                height: 20,
                width: 20,
                borderRadius: 10,
              }}
            />

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setPriceModalVisible(false);
                refetch();
              }}
            >
              <Text style={[styles.applyButtonText, { color: colors.surface }]}>
                Apply Filter
              </Text>
            </TouchableOpacity>
          </AnimatedCard>
        </View>
      </Modal>

      {/* Request Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <AnimatedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Request Product
              </Text>
              <TouchableOpacity
                onPress={() => setRequestModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <>
                <Text style={[styles.productName, { color: colors.text }]}>
                  {selectedProduct.name}
                </Text>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ₹{selectedProduct.pricePerKg}/kg
                </Text>

                <View style={styles.quantityContainer}>
                  <Input
                    label="Quantity"
                    placeholder={`Enter quantity in ${unit}`}
                    keyboardType="numeric"
                    value={inputQty}
                    onChangeText={setInputQty}
                    containerStyle={styles.quantityInput}
                  />

                  <View style={styles.unitButtons}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        unit === "kg" && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setUnit("kg")}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          { color: colors.textSecondary },
                          unit === "kg" && { color: colors.surface },
                        ]}
                      >
                        Kg
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        unit === "g" && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setUnit("g")}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          { color: colors.textSecondary },
                          unit === "g" && { color: colors.surface },
                        ]}
                      >
                        Grams
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {inputQty && (
                  <View style={[styles.totalContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>
                      Total Amount:
                    </Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>
                      ₹
                      {(
                        (unit === "kg"
                          ? parseFloat(inputQty)
                          : parseFloat(inputQty) / 1000) *
                        selectedProduct.pricePerKg
                      ).toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.requestSubmitButton, { backgroundColor: colors.primary }]}
                  onPress={confirmRequest}
                >
                  <Text style={[styles.requestSubmitButtonText, { color: colors.surface }]}>
                    Send Request
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </AnimatedCard>
        </View>
      </Modal>
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
  greeting: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    maxWidth: 160,
  },
  iconButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    marginVertical: 0,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    paddingBottom: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  applyButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityInput: {
    marginBottom: 12,
  },
  unitButtons: {
    flexDirection: "row",
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  requestSubmitButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  requestSubmitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});