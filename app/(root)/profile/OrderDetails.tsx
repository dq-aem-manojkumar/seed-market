import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useDarkMode } from "@/app/context/DarkModeContext";

function getString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
}

export default function OrderDetails() {
  const { colors } = useDarkMode();
  const {
    productName,
    desiredQuantity,
    desiredPricePerKg,
    requestStatus,
    sendAt,
    sellerName,
  } = useLocalSearchParams();

  const quantity = parseFloat(getString(desiredQuantity) || "0");
  const price = parseFloat(getString(desiredPricePerKg) || "0");
  const total = quantity * price;
  const formattedDate = sendAt
    ? new Date(getString(sendAt)).toLocaleDateString()
    : "N/A";
  
  const statusColor = 
    getString(requestStatus) === "ACCEPTED" ? "#10B981" :
    getString(requestStatus) === "REJECTED" ? "#EF4444" : "#F59E0B";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.push("/(root)/(tabs)/orders")}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.headerText} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              Order Details
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Order Information
          </Text>
          
          <Detail 
            label="Product" 
            value={getString(productName)} 
            colors={colors}
          />
          <Detail 
            label="Quantity" 
            value={`${quantity} kg`} 
            colors={colors}
          />
          <Detail 
            label="Price per kg" 
            value={`₹${price}`} 
            colors={colors}
          />
          <Detail 
            label="Total Amount" 
            value={`₹${total.toFixed(2)}`} 
            colors={colors}
            isTotal={true}
          />
          <Detail 
            label="Seller" 
            value={getString(sellerName)} 
            colors={colors}
          />
          <Detail 
            label="Ordered On" 
            value={formattedDate} 
            colors={colors}
          />
          
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getString(requestStatus)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </View>
  );
}

function Detail({ 
  label, 
  value, 
  colors, 
  isTotal = false 
}: { 
  label: string; 
  value: string; 
  colors: any;
  isTotal?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isTotal && styles.totalRow]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[
        styles.detailValue, 
        { color: isTotal ? colors.primary : colors.text },
        isTotal && styles.totalValue
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
