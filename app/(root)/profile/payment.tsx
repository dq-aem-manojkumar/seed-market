import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AnimatedCard from "@/app/components/ui/AnimatedCard";
import { useDarkMode } from "@/app/context/DarkModeContext";

const mockCards = [
  { id: "1", type: "Visa", last4: "4242", expiryMonth: "12", expiryYear: "26" },
  {
    id: "2",
    type: "Mastercard",
    last4: "5525",
    expiryMonth: "07",
    expiryYear: "25",
  },
];

export default function PaymentScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useDarkMode();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/profile")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Cards</Text>
      </View>

      <FlatList
        data={mockCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnimatedCard style={styles.cardItem}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {item.type} **** {item.last4}
            </Text>
            <Text style={[styles.cardExpiry, { color: colors.text }]}>
              Expiry: {item.expiryMonth}/{item.expiryYear}
            </Text>
          </AnimatedCard>
        )}
      />
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add New Card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  cardItem: {
    marginBottom: 12,
    marginHorizontal: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 14,
    color: "#6b7280",
  },
  addButton: {
    marginTop: 16,
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
