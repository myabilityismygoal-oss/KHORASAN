import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Product, ProductAlert } from '../types';
import { sendNotification } from './notificationService';

export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  const productRef = doc(db, 'products', productId);
  
  // Get current product data to compare
  const currentSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', productId)));
  if (currentSnap.empty) throw new Error('Product not found');
  
  const currentData = currentSnap.docs[0].data() as Product;
  
  // Update the product
  await updateDoc(productRef, updates);
  
  // Check for alerts
  const priceChanged = updates.price !== undefined && updates.price < currentData.price;
  const stockChanged = updates.stock !== undefined && updates.stock > 0 && (currentData.stock === 0 || currentData.stock === undefined);
  
  if (priceChanged || stockChanged) {
    const alertsRef = collection(db, 'productAlerts');
    const q = query(alertsRef, where('productId', '==', productId));
    const alertSnap = await getDocs(q);
    
    const notificationPromises = alertSnap.docs.map(async (alertDoc) => {
      const alert = alertDoc.data() as ProductAlert;
      
      if (priceChanged && (alert.type === 'price' || alert.type === 'both')) {
        await sendNotification(
          alert.userId,
          'کاهش قیمت محصول!',
          `قیمت محصول "${currentData.name}" به ${updates.price} افغانی کاهش یافت.`,
          'info',
          'system'
        );
      }
      
      if (stockChanged && (alert.type === 'stock' || alert.type === 'both')) {
        await sendNotification(
          alert.userId,
          'محصول موجود شد!',
          `محصول "${currentData.name}" دوباره موجود شد. همین حالا خرید کنید!`,
          'success',
          'system'
        );
      }
    });
    
    await Promise.all(notificationPromises);
  }
};
