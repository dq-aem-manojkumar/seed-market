// ========== Wrapper ==========
export interface WebResponseDTO<T> {
  totalRecords: number;
  status: number;
  flag: boolean;
  message: string;
  response: T;
  otherInfo?: Record<string, unknown>;
  seller?: {
    id: string;
    name: string;
  };
}

// ========== User ==========
export interface UserModel {
  id?: string;
  name: string;
  userName: string;
  username?: string;
  email: string;
  mobileNumber: string;
  adhaarNumber?: string;
  password?: string;
  isVerified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  kycStatus?: boolean;
  approvalStatus?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  isLoggedIn?: boolean;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  userRole?: {
    id: number;
    name: string;
  };
}

// ========== Product ==========
export interface ProductModel {
  id?: number;
  name: string;
  description: string;
  quantityKg: number;
  pricePerKg: number;
  image?: string;
  sampleImage?: string;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  quantityKg: number;
  pricePerKg: number;
  remainingQuantityKg: number;
  image?: string;
  seller?: {
    id: string;
    name: string;
  };
  userId?: string;
}

// ========== Order ==========
export interface OrderItemModel {
  productId: number;
  quantityInKg: number;
}

export interface OrderModel {
  deliveryAddressId: number;
  orderItems: OrderItemModel[];
}

// ========== Auth ==========
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  name: string;
  email: string;
  password: string;
  mobileNumber: string;
  adhaarNumber: string;
}

export interface LoginResponse {
  accessToken: string;
  headerUserId: string;
  name: string;
  email: string;
}

// ========== Notification ==========
export type NotificationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface RequestNotificationModel {
  id?: number;
  buyerId?: string;
  sellerId?: string;
  productId?: number;
  productName?: string;
  productPrice?: number;
  buyerName?: string;
  sellerName?: string;
  desiredQuantity?: number;
  desiredPricePerKg?: number;
  requestStatus?: NotificationStatus;
  sendAt: string;
  respondedAt?: string;
}

export interface NotificationDTO {
  id: number;
  buyerId: string;
  sellerId: string;
  productId: number;
  desiredQuantity: number;
  desiredPricePerKg: number;
  status: NotificationStatus;
  createdAt?: string;
  updatedAt?: string;
  product?: ProductDTO;
  buyer?: UserModel;
  seller?: UserModel;
  buyerName: string;
  sellerName: string;
  productName: string;
  requestStatus?: NotificationStatus;
}

// types/notification.ts
export interface Notification {
  id: number;
  userId: string;
  order_request_id: string;
  description: string;
  isRead: boolean;
  isClear?: boolean;
  createdAt?: Date;
  requestStatus?: NotificationStatus;
  desiredQuantity?: number;
  desiredPricePerKg?: number;
  sendAt: string;
  requestNotificationDto: RequestNotificationModel;
}
//chat
export interface ChatMessage {
  id?: number;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  senderProfileImageUrl?: string;
  receiverProfileImageUrl?: string;
  content: string;
  timestamp: string;
  productId: number;
}

// export interface ChatUser {
//   id: string; // mapped from partnerId
//   name: string; // mapped from partnerName
//   profileImageUrl: string | null;
//   productId: number;
//   lastMessage: string;
//   lastMessageTime: string;
//   unreadCount: number;
// }

export interface ChatConversation {
  partnerId: string;
  partnerName: string;
  profileImageUrl: string | null;
  productId: number;
  lastMessage: string;
  lastMessageTime: string; // ISO string
}
