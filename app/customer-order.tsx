import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Plus, Minus, Send, Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addAnimations] = useState(new Map<string, Animated.Value>());

  const menuQuery = trpc.menu.getAll.useQuery();
  
  const mockReviews: Review[] = [
    { id: '1', userName: 'Ahmed K.', rating: 5, comment: 'Absolutely delicious! The best kebab I\'ve ever had.', date: '2024-01-15', menuItemId: '7' },
    { id: '2', userName: 'Sara M.', rating: 4, comment: 'Great biryani, very flavorful and aromatic.', date: '2024-01-14', menuItemId: '11' },
    { id: '3', userName: 'Omar H.', rating: 5, comment: 'The dolma is just like my grandmother used to make!', date: '2024-01-13', menuItemId: '1' },
    { id: '4', userName: 'Layla S.', rating: 5, comment: 'Best kunafa in town, perfectly sweet and crispy.', date: '2024-01-12', menuItemId: '22' },
    { id: '5', userName: 'Khalid R.', rating: 4, comment: 'Mixed grill was excellent, generous portions.', date: '2024-01-11', menuItemId: '10' },
  ];

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Order Submitted!',
        'Your order has been sent to the kitchen. We\'ll bring it to your table soon!',
        [{ text: 'OK', onPress: () => setCart([]) }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(menuQuery.data?.map(item => item.category) || []);
    return ['all', ...Array.from(cats)];
  }, [menuQuery.data]);

  const filteredMenu = useMemo(() => {
    if (!menuQuery.data) return [];
    if (selectedCategory === 'all') return menuQuery.data.filter(item => item.available);
    return menuQuery.data.filter(item => item.category === selectedCategory && item.available);
  }, [menuQuery.data, selectedCategory]);

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

    if (!table) {
      Alert.alert('Error', 'Table number not found');
      return;
    }

    createOrderMutation.mutate({
      tableNumber: parseInt(table),
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
      total: cartTotal,
    });
  };

  if (menuQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Table ${table} - Order`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <View style={styles.iconRing1} />
              <View style={styles.iconRing2} />
              <View style={styles.iconCircle}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.emptyLogo}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No items available</Text>
            <Text style={styles.emptySubtitle}>Try selecting a different category</Text>
          </View>
        ) : (
          <>
            {filteredMenu.map((item) => {
              const itemReviews = mockReviews.filter(r => r.menuItemId === item.id);
              const avgRating = itemReviews.length > 0 
                ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length 
                : 0;
              
              const scaleAnim = addAnimations.get(item.id) || new Animated.Value(1);
              if (!addAnimations.has(item.id)) {
                addAnimations.set(item.id, scaleAnim);
              }

              return (
                <Animated.View 
                  key={item.id} 
                  style={[styles.menuItem, { transform: [{ scale: scaleAnim }] }]}
                >
                  {item.image && (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.image }} style={styles.menuImage} />
                      {avgRating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Star size={12} color="#fff" fill="#fff" />
                          <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      description: item.description,
                      image: item.image,
                      category: item.category,
                    })}
                    activeOpacity={0.7}
                  >
                    <Plus size={22} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
            
            {mockReviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                {mockReviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>{review.userName[0]}</Text>
                        </View>
                        <View>
                          <Text style={styles.reviewUserName}>{review.userName}</Text>
                          <View style={styles.reviewStars}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                color={i < review.rating ? Colors.gold : Colors.border}
                                fill={i < review.rating ? Colors.gold : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

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
              <Text style={styles.cartTitle}>{cart.length} items</Text>
              <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
            </View>

            <ScrollView
              style={styles.cartItems}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item.menuItem.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.menuItem.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
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
                <Text style={styles.submitButtonText}>Submit Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  categoriesScroll: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoriesContent: {
    padding: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  categoryTextActive: {
    color: '#fff',
  },
  menuList: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  menuDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  priceContainer: {
    backgroundColor: 'rgba(61, 1, 1, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  menuPrice: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartFooter: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cartSummary: {
    marginBottom: 12,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cartTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  cartItems: {
    maxHeight: 150,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIconContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconRing1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(203, 161, 53, 0.3)',
  },
  iconRing2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(203, 161, 53, 0.5)',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(203, 161, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gold,
    marginBottom: 8,
    letterSpacing: -0.5,
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
});
