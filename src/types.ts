export interface ArtPiece {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  description: string;
  likes: number;
  category: string;
  price?: number;
  createdAt?: any;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  fromId?: string;
  toId?: string;
  amount: number;
  type: 'purchase' | 'reward' | 'transfer' | 'payment';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'business';
  tokenBalance: number; // Eshqari tokens
  createdAt: string;
  bio?: string;
  whatsapp?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  preferences?: {
    notifications: {
      newFeatures: { inApp: boolean; push: boolean };
      transactions: { inApp: boolean; push: boolean };
      messages: { inApp: boolean; push: boolean };
      offers: { inApp: boolean; push: boolean };
      alerts: { inApp: boolean; push: boolean };
      priceChanges: { inApp: boolean; push: boolean };
      stockUpdates: { inApp: boolean; push: boolean };
    }
  };
  educationProfile?: {
    enrolledCourses: string[];
    completedLessons: string[];
    bio?: string;
    interests: string[];
  };
  businessProfile?: {
    name: string;
    logo?: string;
    description: string;
    address: string;
    detailedAddress?: string;
    hours?: string;
    whatsapp: string;
    isOnline: boolean;
    isPhysical: boolean;
    photos: string[];
    videos: string[];
    category: string;
    website?: string;
    rating: number;
  };
  savedPosts?: string[];
}

export interface BusinessProfile extends UserProfile {
  brandIcon?: string;
  qualityRating?: number;
  businessPlan?: string;
  photos: string[];
  videos: string[];
}

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  price: number; // In Eshqari tokens
  category: string;
  images: string[];
  sizes?: string[];
  stock?: number;
  likes?: string[]; // Array of user UIDs
  createdAt: string;
}

export interface ProductAlert {
  id: string;
  userId: string;
  productId: string;
  type: 'price' | 'stock' | 'both';
  targetPrice?: number;
  createdAt: string;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  price: number;
  lessons: Lesson[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  contentUrl?: string;
  category: string;
}

export interface Riddle {
  id: string;
  authorId: string;
  question: string;
  answer?: string; // If answered
  isAnswered: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface WordBankItem {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  images?: string[];
  likes: string[]; // User UIDs
  shares: number;
  comments: Comment[];
  isStory: boolean;
  taggedUsers?: string[]; // User UIDs
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  participants: string[];
  text: string;
  timestamp: any;
  read: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'feature' | 'transaction' | 'message' | 'system' | 'offer' | 'alert' | 'price' | 'stock';
  read: boolean;
  timestamp: any;
  link?: string;
}

export interface APKFile {
  id: string;
  ownerId: string;
  name: string;
  packageName: string;
  description: string;
  currentVersionId: string; // ID of the latest version
  createdAt: string;
  updatedAt: string;
}

export interface APKVersion {
  id: string;
  apkFileId: string;
  versionCode: number;
  versionName: string;
  downloadUrl: string;
  size: number; // in bytes
  changelog?: string;
  uploadedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  businessId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  phoneNumber: string;
  createdAt: any;
}
