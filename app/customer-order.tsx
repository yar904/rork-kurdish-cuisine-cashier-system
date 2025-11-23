import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Minus, Send, Star, ChevronRight, Globe, Utensils, X, ChefHat, Grid3x3, List, Eye } from 'lucide-react-native';
import Svg, { Defs, Pattern, Rect, Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Colors } from '@/constants/colors';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { CATEGORY_NAMES, MENU_ITEMS } from '@/constants/menu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/constants/i18n';

type CartItem = {
  menuItem: {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string | null;
    category: string;
  };
  quantity: number;
  notes?: string;
};

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  menuItemId: string;
};

export default function CustomerOrderScreen() {
  const { table } = useLocalSearchParams<{ table: string }>();
  const parsedTableNumber =
    typeof table === 'string' ? Number.parseInt(table, 10) : Number.NaN;
  const hasValidTableNumber = Number.isFinite(parsedTableNumber);
  const router = useRouter();
  const { publish } = useNotifications();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const { language, tc } = useLanguage();
  const t = translations[language];

  const getMenuItemName = (item: any) => {
    if (language === 'ku') return item.nameKurdish || item.name;
    if (language === 'ar') return item.nameArabic || item.name;
    return item.name;
  };

  const getMenuItemDescription = (item: any) => {
    if (language === 'ku') return item.descriptionKurdish || item.description;
    if (language === 'ar') return item.descriptionArabic || item.description;
    return item.description;
  };
  
  // ⚠️ CRITICAL: All hooks MUST be called before any conditional returns
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addAnimations] = useState(new Map<string, Animated.Value>());
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Map<string, number>>(new Map());

  
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const categoryTranslateY = useRef(new Animated.Value(0)).current;
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const menuItemsOpacity = useRef(new Animated.Value(1)).current;
  const [categoryScales] = useState(new Map<string, Animated.Value>());
  const currentCategoryIndex = useRef(0);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const itemScrollViewRef = useRef<ScrollView>(null);
  const [itemScales] = useState(new Map<string, Animated.Value>());
  const currentItemIndex = useRef(0);
  const itemAutoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrollingItems, setIsUserScrollingItems] = useState(false);
  const itemUserScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isGlassAvailable = Platform.OS === 'ios' ? isLiquidGlassAvailable() : false;
  const [selectedItem, setSelectedItem] = useState<CartItem['menuItem'] | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  
  const [buttonScales] = useState({
    reviews: new Animated.Value(1),
    notify: new Animated.Value(1),
    order: new Animated.Value(1),
  });

  const [requestStatus, setRequestStatus] = useState<{
    message: string;
    visible: boolean;
  }>({ message: '', visible: false });
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const chefFloatY = useRef(new Animated.Value(0)).current;
  const chefHatFloat = useRef(new Animated.Value(0)).current;
  const sparkleScale1 = useRef(new Animated.Value(1)).current;
  const sparkleScale2 = useRef(new Animated.Value(1)).current;
  const sparkleScale3 = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const plateRotate = useRef(new Animated.Value(0)).current;

  const menuQuery = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('[CustomerOrder] Fetching menu items from Supabase');
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('available', true)
          .order('category', { ascending: true });
        
        if (error) {
          console.warn('[CustomerOrder] Could not fetch menu from database, using fallback data:', error.message);
          return MENU_ITEMS;
        }
        console.log('[CustomerOrder] ✅ Menu items loaded:', data?.length);
        return data && data.length > 0 ? data : MENU_ITEMS;
      } catch (err) {
        console.error('[CustomerOrder] Error fetching menu:', err);
        return MENU_ITEMS;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
  
  const menuData = menuQuery.data || MENU_ITEMS;
  
  const ratingsStatsQuery = useQuery({
    queryKey: ['ratings-stats'],
    queryFn: async () => {
      console.log('[CustomerOrder] Fetching ratings from Supabase');
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('menu_item_id, rating');
        
        if (error) {
          console.warn('[CustomerOrder] Could not fetch ratings:', error.message);
          return [];
        }

        const statsMap = new Map<string, { sum: number; count: number }>();
        data?.forEach(rating => {
          const current = statsMap.get(rating.menu_item_id) || { sum: 0, count: 0 };
          statsMap.set(rating.menu_item_id, {
            sum: current.sum + rating.rating,
            count: current.count + 1
          });
        });

        const stats = Array.from(statsMap.entries()).map(([menuItemId, { sum, count }]) => ({
          menuItemId,
          averageRating: sum / count,
          totalRatings: count
        }));
        
        console.log('[CustomerOrder] ✅ Ratings loaded:', stats.length);
        return stats;
      } catch (err) {
        console.warn('[CustomerOrder] Error fetching ratings:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: { tableNumber: number; items: any[]; total: number }) => {
      console.log('[CustomerOrder] 🚀 Submitting order');
      console.log('[CustomerOrder] 📋 Payload:', JSON.stringify(payload, null, 2));
      
      try {
        console.log('[CustomerOrder] Attempting tRPC order submission...');
        const trpcResult = await trpcClient.orders.create.mutate(payload);
        console.log('[CustomerOrder] ✅ tRPC order submitted:', trpcResult);
        return trpcResult;
      } catch (trpcError: any) {
        console.warn('[CustomerOrder] ⚠️ tRPC failed, using Supabase fallback');
        console.warn('[CustomerOrder] tRPC error:', trpcError?.message);
        
        const { data, error } = await supabase
          .from('orders')
          .insert({
            table_number: payload.tableNumber,
            items: payload.items,
            total: payload.total,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) {
          console.error('[CustomerOrder] ❌ Supabase fallback also failed:', error);
          throw new Error(error.message || 'Failed to submit order');
        }
        
        console.log('[CustomerOrder] ✅ Order submitted via Supabase fallback:', data.id);
        return { orderId: data.id, ...data };
      }
    },
    onSuccess: (data) => {
      console.log('[CustomerOrder] ✅ Order submitted successfully');
      console.log('[CustomerOrder] ✅ Order ID:', data.orderId || data.id);
      
      setCart([]);
      
      Alert.alert(
        t.orderSubmitted || 'Order Submitted!',
        t.orderSentToKitchen || 'Your order has been sent to the kitchen. We\'ll bring it to your table soon!'
      );
    },
    onError: (error: any) => {
      console.error('[CustomerOrder] ❌ Order submission failed');
      console.error('[CustomerOrder] ❌ Error:', error?.message || error);
      
      Alert.alert(
        'Order Failed', 
        error?.message || 'Failed to submit order. Please try again.'
      );
    },
  });


  const categories = useMemo(() => {
    const cats = new Set(menuData?.map(item => item.category) || []);
    return ['all', ...Array.from(cats)];
  }, [menuData]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      appetizers: '🥗',
      soups: '🍲',
      salads: '🥙',
      kebabs: '🍖',
      'rice-dishes': '🍚',
      stews: '🍛',
      seafood: '🦞',
      breads: '🍞',
      desserts: '🍰',
      drinks: '🥤',
      shisha: '💨',
      'hot-drinks': '☕',
    };
    return icons[category] || '🍽️';
  };

  const getCategoryImage = (category: string) => {
    const images: Record<string, string> = {
      appetizers: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop',
      soups: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      salads: 'https://images.unsplash.com/photo-1512621776951-5a09ec56c8f7?w=400&h=300&fit=crop',
      kebabs: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop',
      'rice-dishes': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&h=300&fit=crop',
      stews: 'https://images.unsplash.com/photo-1543352632-5a4b7d4c7b5a?w=400&h=300&fit=crop',
      seafood: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop',
      breads: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      desserts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      drinks: 'https://images.unsplash.com/photo-1514933651356-89db8e11e23f?w=400&h=300&fit=crop',
      shisha: 'https://images.unsplash.com/photo-1534422298391-304a23b3c7e6?w=400&h=300&fit=crop',
      'hot-drinks': 'https://images.unsplash.com/photo-1543007630-9710e4a00a1c?w=400&h=300&fit=crop',
    };
    return images[category] || 'https://images.unsplash.com/photo-1546069901-120a39972937?w=400&h=300&fit=crop';
  };

  const scrollToCategory = (category: string) => {
    const yOffset = categoryRefs.current.get(category);
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset - 20, animated: true });
    }
  };

  const filteredMenu = useMemo(() => {
    if (!menuData) return [];
    let items = menuData.filter(item => item.available);
    
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items;
  }, [menuData, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (menuItem: CartItem['menuItem']) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    
    if (!addAnimations.has(menuItem.id)) {
      addAnimations.set(menuItem.id, new Animated.Value(1));
    }
    const scaleAnim = addAnimations.get(menuItem.id)!;
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.menuItem.id === menuItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before submitting');
      return;
    }

    if (!hasValidTableNumber) {
      Alert.alert('Error', 'Table number not found');
      return;
    }

    const payload = {
      tableNumber: parsedTableNumber,
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
      total: cartTotal,
    };

    console.log('[CustomerOrder] 🚀 Submitting order via tRPC');
    console.log('[CustomerOrder] ⚠️ Input payload:', JSON.stringify(payload, null, 2));
    
    createOrderMutation.mutate(payload);
  };

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    if (Math.abs(scrollDelta) < 5) return;
    
    if (scrollDelta > 0 && currentScrollY > 100) {
      Animated.parallel([
        Animated.timing(bottomBarTranslateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuItemsOpacity, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (scrollDelta < 0) {
      Animated.parallel([
        Animated.timing(bottomBarTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuItemsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  }, [bottomBarTranslateY, menuItemsOpacity]);

  const animateButton = (button: keyof typeof buttonScales) => {
    Animated.sequence([
      Animated.timing(buttonScales[button], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScales[button], {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const notifyStaff = async () => {
    animateButton('notify');

    if (!hasValidTableNumber) {
      showStatusMessage('❌ Table number not found');
      return;
    }

    try {
      await publish(parsedTableNumber, 'help');
      showStatusMessage('✅ A team member has been notified.');
    } catch (error: any) {
      console.error('[CustomerOrder] ❌ Notification failed:', error?.message || error);
      showStatusMessage('❌ Request failed. Please try again.');
    }
  };

  const handleViewOrder = () => {
    animateButton('order');
    setOrderModalVisible(true);
  };

  const showStatusMessage = (message: string) => {
    setRequestStatus({ message, visible: true });
    
    Animated.sequence([
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(statusOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRequestStatus({ message: '', visible: false });
    });
  };

  const handleReviews = () => {
    animateButton('reviews');
    Alert.alert('Reviews', 'Customer reviews coming soon!');
  };

  // ⚠️ All useEffect hooks - must be before any conditional returns
  useEffect(() => {
    categories.forEach((cat, index) => {
      if (!categoryScales.has(cat)) {
        categoryScales.set(cat, new Animated.Value(index === 0 ? 1 : 0.75));
      }
    });
    
    filteredMenu.forEach(item => {
      if (!itemScales.has(item.id)) {
        itemScales.set(item.id, new Animated.Value(1));
      }
    });
  }, [categories, categoryScales, filteredMenu, itemScales]);

  useEffect(() => {
    const firstCategory = categories[0];
    if (firstCategory) {
      setSelectedCategory(firstCategory);
      const scale = categoryScales.get(firstCategory);
      if (scale) {
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    }
  }, []);

  useEffect(() => {
    if (isUserScrolling || categories.length <= 1) return;

    autoScrollInterval.current = setInterval(() => {
      currentCategoryIndex.current = (currentCategoryIndex.current + 1) % categories.length;
      const nextCategory = categories[currentCategoryIndex.current];
      
      categories.forEach((cat, idx) => {
        const scale = categoryScales.get(cat);
        if (scale) {
          Animated.timing(scale, {
            toValue: idx === currentCategoryIndex.current ? 1 : 0.75,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      });

      if (categoryScrollViewRef.current) {
        const scrollPosition = currentCategoryIndex.current * 122;
        categoryScrollViewRef.current.scrollTo({ 
          x: scrollPosition, 
          animated: true 
        });
      }
    }, 3000);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [isUserScrolling, categories, categoryScales]);



  const shouldAnimateEmptyOrder = orderModalVisible && cart.length === 0;

  useEffect(() => {
    if (shouldAnimateEmptyOrder) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(chefFloatY, {
            toValue: -15,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(chefFloatY, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(chefHatFloat, {
            toValue: -8,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(chefHatFloat, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleScale1, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale1, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(sparkleScale2, {
            toValue: 1.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale2, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(sparkleScale3, {
            toValue: 1.2,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale3, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(plateRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      chefFloatY.stopAnimation();
      chefHatFloat.stopAnimation();
      sparkleScale1.stopAnimation();
      sparkleScale2.stopAnimation();
      sparkleScale3.stopAnimation();
      pulseScale.stopAnimation();
      plateRotate.stopAnimation();
    }
  }, [shouldAnimateEmptyOrder, chefFloatY, chefHatFloat, sparkleScale1, sparkleScale2, sparkleScale3, pulseScale, plateRotate]);

  // ✅ Now safe to have conditional returns - all hooks have been called
  if (!hasValidTableNumber) {
    console.log('[CustomerOrder] No table number provided');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No table number provided</Text>
        <Text style={styles.errorSubtext}>Please scan the QR code on your table</Text>
      </View>
    );
  }

  console.log('[CustomerOrder] Rendering customer order screen for table:', table);
  console.log('[CustomerOrder] Menu query status:', menuQuery.status, 'Error:', menuQuery.error);
  console.log('[CustomerOrder] Ratings query status:', ratingsStatsQuery.status, 'Error:', ratingsStatsQuery.error);

  if (menuQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (menuQuery.isError) {
    const errorMessage = menuQuery.error instanceof Error 
      ? menuQuery.error.message 
      : typeof menuQuery.error === 'object' && menuQuery.error !== null && 'message' in menuQuery.error
      ? String(menuQuery.error.message)
      : 'Unknown error occurred';

    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load menu</Text>
        <Text style={styles.errorSubtext}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => menuQuery.refetch()}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KurdishCarpetBackground />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.customHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerCornerButton}>
            <LanguageSwitcher />
          </View>

          <View style={styles.headerCenter}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerCornerButton}>
            <View style={styles.tableIndicator}>
              <Utensils size={16} color="#D4AF37" strokeWidth={2} />
              <Text style={styles.tableNumber}>{table}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.categoryFilterSection}>
        <View style={styles.categoryContainer}>
          <View style={styles.categoryHighlight} />
          <ScrollView
            ref={categoryScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoryScrollContent,
              { paddingRight: width - 138 }
            ]}
            decelerationRate="fast"
            snapToInterval={122}
            snapToAlignment="start"
            onTouchStart={() => {
              setIsUserScrolling(true);
              if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
                autoScrollInterval.current = null;
              }
              if (userScrollTimeout.current) {
                clearTimeout(userScrollTimeout.current);
              }
            }}
            onMomentumScrollEnd={() => {
              if (userScrollTimeout.current) {
                clearTimeout(userScrollTimeout.current);
              }
              userScrollTimeout.current = setTimeout(() => {
                setIsUserScrolling(false);
              }, 3000);
            }}
          >
            {categories.map((category, index) => {
              const categoryItems = menuData?.filter(item => item.category === category) || [];
              const displayImage = categoryItems[0]?.image || getCategoryImage(category);
              const isActive = selectedCategory === category;
              
              if (!categoryScales.has(category)) {
                categoryScales.set(category, new Animated.Value(0.75));
              }
              const scaleAnim = categoryScales.get(category)!;
              
              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCategory(category);
                    if (category !== 'all') {
                      scrollToCategory(category);
                    }
                    
                    // Reset all scales
                    categories.forEach((cat, idx) => {
                      const scale = categoryScales.get(cat);
                      if (scale) {
                        Animated.timing(scale, {
                          toValue: 0.75,
                          duration: 300,
                          useNativeDriver: true,
                        }).start();
                      }
                    });
                    
                    // Animate selected category
                    const selectedScale = categoryScales.get(category);
                    if (selectedScale) {
                      Animated.spring(selectedScale, {
                        toValue: 1,
                        friction: 8,
                        tension: 100,
                        useNativeDriver: true,
                      }).start();
                    }
                    
                    setIsUserScrolling(true);
                    currentCategoryIndex.current = index;
                    
                    // Scroll to position
                    if (categoryScrollViewRef.current) {
                      const scrollPosition = index * 122;
                      categoryScrollViewRef.current.scrollTo({ 
                        x: scrollPosition, 
                        animated: true 
                      });
                    }
                    
                    if (userScrollTimeout.current) {
                      clearTimeout(userScrollTimeout.current);
                    }
                    userScrollTimeout.current = setTimeout(() => {
                      setIsUserScrolling(false);
                    }, 4000);
                  }}
                >
                  <Animated.View style={[
                    styles.categoryCard,
                    isActive && styles.categoryCardActive,
                    { transform: [{ scale: scaleAnim }] },
                  ]}>
                    {isActive && <View style={styles.activeIndicatorDot} />}
                    {category !== 'all' && (
                      <Image 
                        source={{ uri: displayImage }} 
                        style={styles.categoryCardImage}
                      />
                    )}
                    {category === 'all' && (
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1546069901-120a39972937?w=400&h=300&fit=crop' }} 
                        style={styles.categoryCardImage}
                      />
                    )}
                    <View style={styles.categoryCardOverlay} />
                    <View style={styles.categoryCardLabel}>
                      <Text style={[
                        styles.categoryCardText,
                        isActive && styles.categoryCardTextActive
                      ]}>
                        {tc(category)}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.menuList} 
        contentContainerStyle={styles.menuListContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No items available</Text>
            <Text style={styles.emptySubtitle}>Try selecting a different category</Text>
          </View>
        ) : (
          <>
            {categories.filter(cat => cat !== 'all').map((category) => {
              const categoryItems = filteredMenu.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <View 
                  key={category}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    categoryRefs.current.set(category, y);
                  }}
                >
                  <View style={styles.categorySection}>
                    <View style={styles.categorySectionHeader}>
                      <View style={styles.sectionHeaderLine} />
                      <Text style={styles.categorySectionTitle}>
                        {tc(category)}
                      </Text>
                      <View style={styles.sectionHeaderLine} />
                    </View>
                  </View>
                  
                  <View style={isGridView ? styles.menuItemsGrid : styles.menuItemsList}>
                    {categoryItems.map((item) => {
                const itemStats = ratingsStatsQuery.data?.find(stat => stat.menuItemId === item.id);
                const avgRating = itemStats?.averageRating || 0;
                const totalRatings = itemStats?.totalRatings || 0;
                
                const scaleAnim = addAnimations.get(item.id) || new Animated.Value(1);
                if (!addAnimations.has(item.id)) {
                  addAnimations.set(item.id, scaleAnim);
                }

                      return (
                        <View
                          key={item.id}
                          style={isGridView ? styles.menuItemGrid : styles.menuItem}
                        >
                        <Animated.View 
                          style={[
                            { width: '100%', transform: [{ scale: scaleAnim }] }
                          ]}
                        >
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              description: item.description,
                              image: item.image,
                              category: item.category,
                            });
                            setItemModalVisible(true);
                          }}
                        >
                        {item.image && (
                          <View style={isGridView ? styles.imageContainerGrid : styles.imageContainer}>
                            <Image source={{ uri: item.image }} style={isGridView ? styles.menuImageGrid : styles.menuImage} />
                            <View style={styles.actionButtons}>
                              {totalRatings > 0 && (
                                <TouchableOpacity
                                  style={styles.circularButton}
                                  onPress={() => {
                                    setSelectedItem({
                                      id: item.id,
                                      name: item.name,
                                      price: item.price,
                                      description: item.description,
                                      image: item.image,
                                      category: item.category,
                                    });
                                    setItemModalVisible(true);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Star size={16} color="#D4AF37" fill="#D4AF37" strokeWidth={2} />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.circularButtonAdd}
                                onPress={() => addToCart({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  description: item.description,
                                  image: item.image,
                                  category: item.category,
                                })}
                                activeOpacity={0.8}
                              >
                                <Plus size={18} color="#D4AF37" strokeWidth={3} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                        <View style={styles.menuInfo}>
                          <Text style={styles.menuName}>{getMenuItemName(item)}</Text>
                          <Text style={styles.menuPrice}>{item.price.toLocaleString()} IQD</Text>
                        </View>
                        </TouchableOpacity>
                        </Animated.View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            

          </>
        )}
      </ScrollView>

      <Animated.View style={[styles.bottomActionsBarContainer, { transform: [{ translateY: bottomBarTranslateY }] }]}>
        {isGlassAvailable ? (
          <GlassView 
            style={styles.bottomActionsBarGlass}
            glassEffectStyle="clear"
            tintColor="rgba(61, 1, 1, 0.7)"
          >
            <View style={styles.bottomActionsBarContent}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleReviews}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.reviews }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconSecondary]}>
                    <Star size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{t.viewRatings}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={notifyStaff}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.notify }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconSecondary]}>
                    <ChefHat size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{'Notify\nstaff'}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleViewOrder}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.order }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconPrimary]}>
                    <Utensils size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{t.yourOrder}</Text>
                </Animated.View>
              </TouchableOpacity>

            </View>
          </GlassView>
        ) : (
          <View style={styles.bottomActionsBarFallback}>
            <View style={styles.bottomActionsBarContent}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleReviews}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.reviews }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconSecondary]}>
                    <Star size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{t.viewRatings}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={notifyStaff}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.notify }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconSecondary]}>
                    <ChefHat size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{'Notify\nstaff'}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleViewOrder}
                activeOpacity={0.7}
              >
                <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.order }] }]}>
                  <View style={[styles.actionIconContainer, styles.actionIconPrimary]}>
                    <Utensils size={20} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.actionButtonText}>{t.yourOrder}</Text>
                </Animated.View>
              </TouchableOpacity>

            </View>
          </View>
        )}
      </Animated.View>

      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.orderModalOverlay}>
          <View style={styles.orderModalContent}>
            <View style={styles.orderModalHeader}>
              <Text style={styles.orderModalTitle}>{t.yourOrder}</Text>
              <TouchableOpacity
                style={styles.orderModalCloseButton}
                onPress={() => setOrderModalVisible(false)}
              >
                <X size={24} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyOrderState}>
                <Animated.View style={[styles.chefAnimationContainer, { transform: [{ translateY: chefFloatY }] }]}>
                  <Image 
                    source={require('@/assets/images/icon.png')} 
                    style={styles.emptyStateLogo}
                    resizeMode="contain"
                  />
                </Animated.View>

                <View style={styles.emptyOrderTextContainer}>
                  <Text style={styles.emptyOrderTitleNew}>{t.emptyCart}</Text>
                  <Text style={styles.emptyOrderSubtitleNew}>
                    {t.pleaseAddItems}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <ScrollView style={styles.orderModalItems}>
                  {cart.map((item) => (
                    <View key={item.menuItem.id} style={styles.orderModalItem}>
                      <View style={styles.orderModalItemInfo}>
                        <Text style={styles.orderModalItemName}>{getMenuItemName(item.menuItem)}</Text>
                        <Text style={styles.orderModalItemPrice}>
                          {(item.menuItem.price * item.quantity).toLocaleString()} IQD
                        </Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.menuItem.id, -1)}
                        >
                          <Minus size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.menuItem.id, 1)}
                        >
                          <Plus size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.orderModalFooter}>
                  <View style={styles.orderModalTotal}>
                    <Text style={styles.orderModalTotalLabel}>{t.total}:</Text>
                    <Text style={styles.orderModalTotalValue}>{cartTotal.toLocaleString()} IQD</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.orderModalSubmitButton}
                    onPress={() => {
                      handleSubmitOrder();
                      setOrderModalVisible(false);
                    }}
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.orderModalSubmitText}>{t.submitOrder}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {requestStatus.visible && (
        <Animated.View 
          style={[
            styles.statusToast,
            { opacity: statusOpacity }
          ]}
        >
          <Text style={styles.statusToastText}>{requestStatus.message}</Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => router.push('/public-menu')}
        activeOpacity={0.8}
      >
        <Eye size={20} color="#fff" strokeWidth={2.5} />
        <Text style={styles.switchButtonText}>{t.viewAll}</Text>
      </TouchableOpacity>

      <Modal
        visible={itemModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalContent}>
            {selectedItem && (
              <>
                <TouchableOpacity
                  style={styles.itemModalCloseButton}
                  onPress={() => setItemModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={24} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>

                {selectedItem.image && (
                  <Image
                    source={{ uri: selectedItem.image }}
                    style={styles.itemModalImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.itemModalInfo}>
                  <Text style={styles.itemModalName}>{getMenuItemName(selectedItem)}</Text>
                  <Text style={styles.itemModalDescription}>{getMenuItemDescription(selectedItem)}</Text>
                  
                  {ratingsStatsQuery.data?.find(stat => stat.menuItemId === selectedItem.id) && (
                    <View style={styles.itemModalRating}>
                      <Star size={20} color="#D4AF37" fill="#D4AF37" />
                      <Text style={styles.itemModalRatingText}>
                        {ratingsStatsQuery.data.find(stat => stat.menuItemId === selectedItem.id)!.averageRating.toFixed(1)}
                      </Text>
                      <Text style={styles.itemModalRatingCount}>
                        ({ratingsStatsQuery.data.find(stat => stat.menuItemId === selectedItem.id)!.totalRatings} reviews)
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemModalPriceContainer}>
                    <Text style={styles.itemModalPrice}>{selectedItem.price.toLocaleString()} IQD</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addToOrderButton}
                    onPress={() => {
                      addToCart(selectedItem);
                      setItemModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={20} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.addToOrderButtonText}>{t.addToCart}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartSummary}>
            <View style={styles.cartHeader}>
              <View style={styles.cartIconBadge}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cartTitle}>{cart.length} {t.items}</Text>
              <Text style={styles.cartTotal}>{cartTotal.toLocaleString()} IQD</Text>
            </View>

            <ScrollView
              style={styles.cartItems}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item.menuItem.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{getMenuItemName(item.menuItem)}</Text>
                    <Text style={styles.cartItemPrice}>
                      {(item.menuItem.price * item.quantity).toLocaleString()} IQD
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.menuItem.id, -1)}
                    >
                      <Minus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.menuItem.id, 1)}
                    >
                      <Plus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitOrder}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{t.submitOrder}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const KurdishCarpetBackground = () => (
  <Image 
    source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pfi2xp2ednotg7b5lw52y' }}
    style={styles.backgroundImage}
    resizeMode="cover"
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 1,
  },

  customHeader: {
    backgroundColor: 'rgba(61, 1, 1, 0.05)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)',
        backdropFilter: 'blur(12px)',
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 4,
    height: 110,
  },
  headerCornerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 90,
    height: 90,
  },
  tableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  tableNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0000',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 0, 0, 0.9)',
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  loadingLogo: {
    width: 80,
    height: 80,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#E8C968',
    marginTop: 16,
  },
  categoryFilterSection: {
    backgroundColor: 'transparent',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.4)',
  },
  categoryContainer: {
    position: 'relative' as const,
  },
  categoryHighlight: {
    position: 'absolute' as const,
    top: 4,
    left: 16,
    width: 110,
    height: 130,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#D4AF37',
    zIndex: 1,
    pointerEvents: 'none' as const,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 0 24px rgba(212, 175, 55, 0.7), 0 0 48px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  categoryHighlightHidden: {
    opacity: 0,
  },
  categoryScrollContent: {
    paddingLeft: 16,
    gap: 12,
    paddingVertical: 4,
  },
  categoryCard: {
    width: 110,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: '#1a0000',
    position: 'relative' as const,
  },
  categoryCardActive: {
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  activeIndicatorDot: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(61, 1, 1, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  categoryCardLabel: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 0, 0, 0.75)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
  },
  categoryCardText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  categoryCardTextActive: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginTop: 4,
    marginBottom: 0,
  },
  categorySectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.6,
  },
  categorySectionIcon: {
    fontSize: 28,
  },
  categorySectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    marginHorizontal: 16,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 22,
      },
    }),
  },
  menuList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 220,
    backgroundColor: 'transparent',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItemGrid: {
    width: '48%' as const,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    borderRadius: 14,
    overflow: 'visible' as const,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    marginBottom: 16,
    position: 'relative' as const,
    minHeight: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        width: 'calc(50% - 6px)',
        minWidth: 160,
        maxWidth: 250,
        minHeight: 240,
        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 15px rgba(212, 175, 55, 0.06)',
      },
    }),
  },
  menuItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  menuItemsList: {
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imageContainerGrid: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      web: {
        height: 150,
      },
    }),
  },
  menuImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuImageGrid: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row' as const,
    gap: 8,
    zIndex: 5,
  },
  circularButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  circularButtonAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#D4AF37',
    letterSpacing: 0.2,
  },
  ratingCount: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuInfo: {
    padding: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
    backgroundColor: 'rgba(61, 1, 1, 0.25)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  menuName: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 21,
    letterSpacing: 0.3,
    marginBottom: 0,
    marginTop: 0,
    textAlign: 'center' as const,
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        fontSize: 17,
        lineHeight: 23,
      },
    }),
  },
  menuPrice: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center' as const,
    minWidth: '70%' as const,
    ...Platform.select({
      web: {
        fontSize: 15,
      },
    }),
  },

  bottomActionsBarContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomActionsBarGlass: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 24, default: 16 }),
    overflow: 'hidden' as const,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -6px 24px rgba(212, 175, 55, 0.25)',
      },
    }),
  },
  bottomActionsBarFallback: {
    backgroundColor: 'rgba(61, 1, 1, 0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 24, default: 16 }),
    overflow: 'hidden' as const,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -6px 24px rgba(212, 175, 55, 0.25)',
      },
    }),
  },
  bottomActionsBarContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionButtonPrimary: {
    transform: [{ scale: 1.05 }],
  },
  actionButtonInner: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  actionIconSecondary: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 12,
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  actionButtonTextLight: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  actionButtonTextGold: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  actionButtonTextDark: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  cartFooter: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 0, 0, 0.96)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.4)',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  cartSummary: {
    marginBottom: 14,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  cartTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  cartTotal: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#E8C968',
    letterSpacing: 0.3,
  },
  cartItems: {
    maxHeight: 150,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cartItemPrice: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  quantity: {
    fontSize: 17,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    minWidth: 28,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8C968',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#1a0000',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    width: '100%',
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: 'rgba(232, 201, 104, 0.9)',
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  reviewsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  reviewsTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  reviewCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  overallRatingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  overallRatingNumber: {
    alignItems: 'center',
    gap: 8,
  },
  overallRatingValue: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: -2,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 4,
  },
  overallRatingCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  leaveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  leaveReviewText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cartIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  emptyLogo: {
    width: 60,
    height: 60,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  orderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'flex-end',
  },
  orderModalContent: {
    backgroundColor: 'rgba(26, 0, 0, 0.98)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopWidth: 3,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0 -8px 40px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  orderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  orderModalTitle: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  orderModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  emptyOrderState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    minHeight: 500,
    backgroundColor: 'transparent',
  },
  chefAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  chefCharacterNew: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  chefHatWrapper: {
    marginBottom: -25,
    zIndex: 3,
  },
  chefHatEmoji: {
    fontSize: 80,
  },
  chefBodyWrapper: {
    alignItems: 'center',
  },
  chefBodyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(254, 232, 200, 0.98)',
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  chefFaceNew: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chefEyesNew: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 10,
  },
  chefEyeNew: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#2D0000',
  },
  chefMouthNew: {
    width: 36,
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2D0000',
    backgroundColor: 'transparent',
  },
  floatingPlateNew: {
    position: 'absolute',
    top: 140,
    right: 20,
  },
  plateEmojiNew: {
    fontSize: 48,
  },
  emptyOrderTextContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyOrderTitleNew: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.gold,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  emptyStateLogo: {
    width: 150,
    height: 150,
  },
  emptyOrderSubtitleNew: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 280,
  },
  sparklesContainerNew: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleNew: {
    fontSize: 28,
  },
  orderModalItems: {
    maxHeight: 350,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  orderModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  orderModalItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderModalItemName: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  orderModalItemPrice: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  orderModalFooter: {
    padding: 24,
    paddingBottom: 28,
    backgroundColor: 'transparent',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(212, 175, 55, 0.25)',
  },
  orderModalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 10px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  orderModalTotalLabel: {
    fontSize: 19,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.4,
  },
  orderModalTotalValue: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '900' as const,
    color: '#E8C968',
    letterSpacing: 0.5,
  },
  orderModalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8C968',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  orderModalSubmitText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#1a0000',
    letterSpacing: 0.5,
  },
  statusToast: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.gold,
    zIndex: 1000,
  },
  statusToastText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  switchButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  itemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  itemModalContent: {
    backgroundColor: '#1a0000',
    borderRadius: 24,
    overflow: 'hidden' as const,
    width: '90%' as const,
    maxWidth: 500,
    borderWidth: 3,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  itemModalCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  itemModalImage: {
    width: '100%' as const,
    height: 250,
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        height: 300,
      },
    }),
  },
  itemModalInfo: {
    padding: 24,
  },
  itemModalName: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  itemModalDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
    marginBottom: 16,
  },
  itemModalRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  itemModalRatingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#D4AF37',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  itemModalRatingCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'NotoNaskhArabic_600SemiBold',
  },
  itemModalPriceContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    marginBottom: 20,
  },
  itemModalPrice: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  addToOrderButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  addToOrderButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#1a0000',
    letterSpacing: 0.3,
  },
});
