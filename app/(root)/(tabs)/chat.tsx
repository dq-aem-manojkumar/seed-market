import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { clearBadge } from "@/store/badgeSlice";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useDarkMode } from "@/app/context/DarkModeContext";

import { getAllUsers, getChatConversations } from "@/api/services";
import { ChatConversation, UserModel } from "@/api/types";

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Input from "@/app/components/ui/Input";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

interface ChatUser {
  id: string;
  name: string;
  profileImageUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatScreen() {
  const { colors } = useDarkMode();
  const dispatch = useDispatch();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
    getCurrentUserId();
  }, []);

  // Clear chat badge when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(clearBadge('chat'));
    }, [dispatch])
  );

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchText.toLowerCase()) ||
          user.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);

  const getCurrentUserId = async () => {
    const userId = await AsyncStorage.getItem("userId");
    setCurrentUserId(userId);
  };
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const currentUserId = await AsyncStorage.getItem("userId");
      setCurrentUserId(currentUserId);

      const conversations: ChatConversation[] = await getChatConversations();

      // Deduplicate by partnerId + productId
      const uniqueMap = new Map<string, ChatConversation>();
      for (const conv of conversations) {
        const key = `${conv.partnerId}-${conv.productId}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, conv);
        }
      }

      const chatUsers: ChatUser[] = Array.from(uniqueMap.values())
        .sort((a, b) => {
          // Sort by lastMessageTime (newest first)
          const timeA = new Date(a.lastMessageTime).getTime();
          const timeB = new Date(b.lastMessageTime).getTime();
          return timeB - timeA;
        })
        .map(
        (conv) => ({
          id: conv.partnerId,
          name: conv.partnerName,
          profileImageUrl: conv.profileImageUrl,
          lastMessage: conv.lastMessage,
          lastMessageTime: new Date(conv.lastMessageTime).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
          unreadCount: Math.floor(Math.random() * 3), // simulated
        })
      );

      setUsers(chatUsers);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (user: ChatUser) => {
    router.push({
      pathname: "/(root)/chat/[receiverId]",
      params: {
        receiverId: user.id!,
        receiverName: user.name,
        productId: "1", // Default product ID, should be dynamic in real app
      },
    });
  };

  const renderChatItem = ({
    item,
    index,
  }: {
    item: ChatUser;
    index: number;
  }) => (
    <TouchableOpacity onPress={() => handleChatPress(item)} activeOpacity={0.7}>
      <AnimatedCard style={styles.chatItem}>
        <View style={styles.chatContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  item.profileImageUrl ||
                  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
              }}
              style={styles.avatar}
            />
            {item.unreadCount && item.unreadCount > 0 && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {item.lastMessageTime}
              </Text>
            </View>

            <View style={styles.messageRow}>
              <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
              {item.unreadCount && item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.unreadText, { color: colors.surface }]}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </AnimatedCard>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
      <SafeAreaView>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>
            Messages
          </Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search conversations..."
                value={searchText}
                onChangeText={setSearchText}
                leftIcon="search-outline"
                containerStyle={styles.searchInput}
              />
            </View>
          </>
        }
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AnimatedCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Start chatting with sellers to negotiate prices
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
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    marginVertical: 0,
  },
  listContent: {
    paddingBottom: 100,
  },
  chatItem: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
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