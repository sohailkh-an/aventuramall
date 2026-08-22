'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@aventuramall/shared';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { apiClient } from '@/lib/api';

export interface CartItem {
  id: string;
  name: string;
  price: string | number | any;
  compareAtPrice?: string | number | null | any;
  images: string[];
  slug?: string;
  quantity: number;
  stock?: number;
  description?: string | null;
  category?: any;
  [key: string]: any;
}

interface CartApiItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isInCart: (productId: string) => boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session, isPending: sessionPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const loadCartFromLocalStorage = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    const savedCart = localStorage.getItem('cart-items');
    if (!savedCart) return [];

    try {
      return JSON.parse(savedCart) as CartItem[];
    } catch (error) {
      console.error('Failed to parse cart items from localStorage', error);
      return [];
    }
  };

  const fetchRemoteCartItems = async (): Promise<CartItem[]> => {
    const response = await apiClient.get<{ data: CartApiItem[] }>('/api/cart');
    return response.data.map((item) => ({ ...item.product, quantity: item.quantity }));
  };

  const synchronizeCartItems = async (localItems: CartItem[]): Promise<CartItem[]> => {
    if (!localItems.length) {
      return fetchRemoteCartItems();
    }

    for (const item of localItems) {
      await apiClient.post('/api/cart', {
        productId: item.id,
        quantity: item.quantity,
      });
    }

    localStorage.removeItem('cart-items');
    return fetchRemoteCartItems();
  };

  useEffect(() => {
    if (sessionPending) return;

    const initialize = async () => {
      const savedCart = loadCartFromLocalStorage();

      if (isAuthenticated) {
        try {
          const mergedCart = await synchronizeCartItems(savedCart);
          setCartItems(mergedCart);
        } catch (error) {
          console.error('Failed to load cart items', error);
          setCartItems(savedCart);
        }
      } else {
        setCartItems(savedCart);
      }

      setIsInitialized(true);
    };

    initialize();
  }, [isAuthenticated, sessionPending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized && !isAuthenticated) {
      localStorage.setItem('cart-items', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized, isAuthenticated]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart.');
      return;
    }

    const previousCart = [...cartItems];
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        toast.success(`Updated ${product.name} quantity in cart`);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      toast.success(`${product.name} added to cart`);
      return [...prev, { ...product, quantity }];
    });

    try {
      await apiClient.post('/api/cart', { productId: product.id, quantity });
    } catch (error) {
      setCartItems(previousCart);
      toast.error(`Failed to add ${product.name} to cart`);
    }
  };

  const removeFromCart = async (productId: string) => {
    const previousCart = [...cartItems];
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast.info('Product removed from cart');

    if (!isAuthenticated) {
      return;
    }

    try {
      await apiClient.delete(`/api/cart/${productId}`);
    } catch (error) {
      setCartItems(previousCart);
      toast.error('Failed to remove product from cart');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const previousCart = [...cartItems];
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );

    if (!isAuthenticated) {
      return;
    }

    try {
      await apiClient.patch(`/api/cart/${productId}`, { quantity });
    } catch (error) {
      setCartItems(previousCart);
      toast.error('Failed to update cart quantity');
    }
  };

  const clearCart = async () => {
    const previousCart = [...cartItems];
    setCartItems([]);
    toast.info('Cart cleared');

    if (!isAuthenticated) {
      return;
    }

    try {
      await apiClient.delete('/api/cart');
    } catch (error) {
      setCartItems(previousCart);
      toast.error('Failed to clear cart');
    }
  };

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.id === productId);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isInCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
