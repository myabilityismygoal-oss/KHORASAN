// Export main app components and types
export { default as App } from './App';
export * from './types';
export * from './firebase';

// Firebase exports
export { auth, db, storage, OperationType, handleFirestoreError } from './firebase';

// Type exports for consumers
export type { 
  UserProfile,
  BusinessProfile,
  Product,
  Course,
  Post,
  Message,
  Transaction,
  Order,
  Notification,
} from './types';
