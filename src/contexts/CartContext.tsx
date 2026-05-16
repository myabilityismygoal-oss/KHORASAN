import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  totalAmount: number;
  checkout: (shippingInfo: { address: string; phone: string }) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number, size?: string) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === product.id && item.selectedSize === size);
      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }
      return [...prev, { ...product, quantity, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedSize === size) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkout = async (shippingInfo: { address: string; phone: string }) => {
    if (!auth.currentUser) throw new Error('User must be logged in to checkout');
    if (cart.length === 0) throw new Error('Cart is empty');

    // Group items by businessId (ownerId)
    const itemsByBusiness = cart.reduce((acc, item) => {
      if (!acc[item.ownerId]) acc[item.ownerId] = [];
      acc[item.ownerId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    // Create an order for each business
    const orderPromises = Object.entries(itemsByBusiness).map(([businessId, items]) => {
      const businessItems = items as CartItem[];
      const businessTotal = businessItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
      return addDoc(collection(db, 'orders'), {
        customerId: auth.currentUser!.uid,
        businessId,
        items: businessItems.map((item: CartItem) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize || null
        })),
        totalAmount: businessTotal,
        status: 'pending',
        shippingAddress: shippingInfo.address,
        phoneNumber: shippingInfo.phone,
        createdAt: serverTimestamp()
      });
    });

    await Promise.all(orderPromises);
    clearCart();
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
