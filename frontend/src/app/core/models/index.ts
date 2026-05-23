export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country: string;
  city: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  nameAr: string;
  nameFr: string;
  slug: string;
  icon?: string;
  parentId?: number;
  sortOrder: number;
  children: Category[];
}

export interface Brand {
  id: number;
  name: string;
  logoUrl?: string;
  models: VehicleModel[];
}

export interface VehicleModel {
  id: number;
  name: string;
  brandId: number;
  brandName: string;
}

export interface ListingPhoto {
  id: number;
  url: string;
  thumbnailUrl?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Listing {
  id: number;
  titleAr: string;
  titleFr: string;
  descriptionAr: string;
  descriptionFr: string;
  price: number;
  currency: string;
  condition: 'New' | 'Used';
  status: 'Pending' | 'Published' | 'Rejected' | 'Expired' | 'Deleted';
  rejectionReason?: string;
  categoryId: number;
  categoryNameAr: string;
  categoryNameFr: string;
  brandId?: number;
  brandName?: string;
  vehicleModelId?: number;
  vehicleModelName?: string;
  yearFrom?: number;
  yearTo?: number;
  oemReference?: string;
  country: string;
  city: string;
  phoneNumber: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  photos: ListingPhoto[];
  isFavorite: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListingSearchParams {
  query?: string;
  oemReference?: string;
  categoryId?: number;
  brandId?: number;
  vehicleModelId?: number;
  year?: number;
  condition?: string;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface Message {
  id: number;
  listingId: number;
  listingTitleAr: string;
  listingTitleFr: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  listingId: number;
  listingTitleAr: string;
  listingTitleFr: string;
  listingMainPhoto?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface AdminStats {
  totalListings: number;
  pendingListings: number;
  publishedListings: number;
  totalUsers: number;
  totalSellers: number;
  totalMessages: number;
}
