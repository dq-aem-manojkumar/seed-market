import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotifications,
} from "@/api/services";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToBuyer,
  subscribeToSeller,
  subscribeToMessages,
} from "@/api/websocket";

import { 
  setNotifications, 
  addNotification, 
  selectNewNotificationsCount 
} from "@/store/notificationSlice";
import { addMessage } from "@/store/chatSlice";
import { 
  setBadgeCount, 
  incrementBadge, 
  selectBadges 
} from "@/store/badgeSlice";
import { RootState } from "@/store";
import { Notification } from "@/api/types";
import { logger } from "@/utils/logger";
import { useDarkMode } from "@/app/context/DarkModeContext";

export default function TabsLayout() {
  const dispatch = useDispatch();
  const { colors } = useDarkMode();
  const badges = useSelector(selectBadges);
  const newNotificationsCount = useSelector(selectNewNotificationsCount);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Update notification badge when notifications change
    dispatch(setBadgeCount({ type: 'notifications', count: newNotificationsCount }));
  }, [newNotificationsCount, dispatch]);

  const fetchAllNotifications = async () => {
    try {
      const [notifications] = await Promise.all([getNotifications()]);
      const received = notifications?.response || [];
      logger.info("Fetched notifications", { count: received.length });
      dispatch(setNotifications(received));
    } catch (err) {
      logger.error("Notification fetch failed", err);
    }
  };

  const setupWebSocket = async () => {
    const uid = await AsyncStorage.getItem("userId");
    if (!uid) return;
    setUserId(uid);
    
    
    connectWebSocket(() => {
      subscribeToSeller(uid, (msg) => {
        try {
          const newNotif: Notification = JSON.parse(msg.body);
          logger.wsMessage("Seller notification received", newNotif);
          dispatch(addNotification(newNotif));
          dispatch(incrementBadge('sales'));
        } catch (err) {
          logger.error("WebSocket message parse error", err);
        }
      });
      
      
      subscribeToBuyer(uid, (msg) => {
        try {
          const newNotif: Notification = JSON.parse(msg.body);
          logger.wsMessage("Buyer notification received", newNotif);
          dispatch(addNotification(newNotif));
          dispatch(incrementBadge('orders'));
        } catch (err) {
          logger.error("WebSocket message parse error", err);
        }
      });

      // Subscribe to chat messages
      subscribeToMessages(uid, (msg) => {
        try {
          const chatMessage = JSON.parse(msg.body);
          logger.wsMessage("Chat message received", chatMessage);

          // Create conversation ID
          const conversationId = `${chatMessage.senderId}-${chatMessage.receiverId}-${chatMessage.productId}`;
          dispatch(addMessage({ conversationId, message: chatMessage }));
          dispatch(incrementBadge('chat'));
        } catch (err) {
          logger.error("Chat message parse error", err);
        }
      });
    });
  };

  useEffect(() => {
    fetchAllNotifications();
    setupWebSocket();
    
    return () => disconnectWebSocket();
  }, []);

  const renderTabBarBadge = (count: number) => {
    if (count === 0) return undefined;
    return count > 99 ? "99+" : count.toString();
  };

  const CustomTabBarBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    
    return (
      <View style={[styles.customBadge, { backgroundColor: colors.badgeBackground }]}>
        <Text style={[styles.customBadgeText, { color: colors.badgeText }]}>
          {count > 99 ? "99+" : count.toString()}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          height: 75,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.badgeBackground,
          color: colors.badgeText,
          fontSize: 10,
          fontWeight: "bold",
          minWidth: 18,
          height: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="myproducts"
        options={{
          title: "My-Products",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="seedling" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome5 name="sellcast" color={color} size={size} />
              <CustomTabBarBadge count={badges.sales} />
            </View>
          ),
          tabBarBadge: renderTabBarBadge(badges.sales),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Order",
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome5 name="shopping-basket" color={color} size={size} />
              <CustomTabBarBadge count={badges.orders} />
            </View>
          ),
          tabBarBadge: renderTabBarBadge(badges.orders),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome5 name="rocketchat" color={color} size={size} />
              <CustomTabBarBadge count={badges.chat} />
            </View>
          ),
          tabBarBadge: renderTabBarBadge(badges.chat),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <View>
              <FontAwesome5 name="user" color={color} size={size} />
              <CustomTabBarBadge count={badges.notifications} />
            </View>
          ),
          tabBarBadge: renderTabBarBadge(badges.notifications),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  customBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});