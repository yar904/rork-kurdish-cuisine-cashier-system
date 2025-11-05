import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Globe, ShoppingCart, Plus, Minus, X, Send, MessageCircle, Star, Utensils, ArrowLeft, Grid3x3, List } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useTables } from '@/contexts/TableContext';
import { Colors } from '@/constants/colors';
import { formatPrice } from '@/constants/currency';
import AIChatbot from '@/components/AIChatbot';
import { trpc } from '@/lib/trpc';

export default function PublicMenuScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { language, setLanguage, t, tc } = useLanguage();
  const { addItemToCurrentOrder, currentOrder, submitOrder, updateItemQuantity, removeItemFromCurrentOrder, calculateTotal, selectedTable, setSelectedTable } = useRestaurant();
  const { tables } = useTables();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchSlideAnim = useRef(new Animated.Value(0)).current;
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingItem, setRatingItem] = useState<MenuItem | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const { width } = useWindowDimensions();

  const contentScrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollY = useRef(0);
  const currentSlideIndex = useRef(0);
  const fabSlideAnimation = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const viewToggleAnimation = useRef(new Animated.Value(0)).current;
  const [categoryLayouts, setCategoryLayouts] = useState<Record<string, number>>({});
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedTable && !params.table) {
      setShowTableSelector(true);
    } else if (params.table) {
      const tableNum = parseInt(params.table as string);
      if (!isNaN(tableNum)) {
        setSelectedTable(tableNum);
      }
    }
  }, [params.table, setSelectedTable, selectedTable]);

  useEffect(() => {
    Animated.spring(fabSlideAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const handleAddToCart = () => {
    if (selectedItem) {
      addItemToCurrentOrder(selectedItem.id, itemQuantity, itemNotes || undefined);
      setSelectedItem(null);
      setItemNotes('');
      setItemQuantity(1);
      Alert.alert(t('success'), t('itemAddedToCart'));
    }
  };

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) {
      Alert.alert(t('emptyCart'), t('pleaseAddItems'));
      return;
    }

    if (!selectedTable) {
      Alert.alert(t('selectTable'), t('pleaseSelectTableFirst'));
      setShowTableSelector(true);
      return;
    }

    Alert.alert(
      t('submitOrder'),
      `${t('submitOrderConfirm')} ${selectedTable}?\n${t('total')}: ${formatPrice(calculateTotal(currentOrder))}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('submit'),
          style: 'default',
          onPress: async () => {
            const result = await submitOrder();
            setShowCart(false);
            if (result?.orderId) {
              router.push({
                pathname: '/order-tracking',
                params: {
                  orderId: result.orderId,
                  tableNumber: selectedTable?.toString() || '',
                  total: calculateTotal(currentOrder).toString(),
                },
              });
            } else {
              Alert.alert(
                t('success'),
                t('orderSubmittedSuccess'),
                [{ text: 'OK', style: 'default' }]
              );
            }
          },
        },
      ]
    );
  };

  const cartItemCount = currentOrder.reduce((sum, item) => sum + item.quantity, 0);

  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();
  const ratingsStats = ratingsStatsQuery.data || {};

  const createRatingMutation = trpc.ratings.create.useMutation({
    onSuccess: () => {
      Alert.alert(t('success'), t('ratingSubmitted'));
      setShowRatingModal(false);
      setRatingItem(null);
      setUserRating(0);
      setRatingComment('');
      ratingsStatsQuery.refetch();
    },
    onError: () => {
      Alert.alert(t('error'), t('failedToSubmitRequest'));
    },
  });

  const handleSubmitRating = () => {
    if (!ratingItem || !selectedTable) {
      Alert.alert(t('error'), t('pleaseSelectTableFirst'));
      return;
    }

    if (userRating === 0) {
      Alert.alert(t('error'), 'Please select a rating');
      return;
    }

    createRatingMutation.mutate({
      menuItemId: ratingItem.id,
      tableNumber: selectedTable,
      rating: userRating,
      comment: ratingComment || undefined,
    });
  };

  const categories = [
    { id: 'appetizers', nameKu: 'دەستپێکەکان', nameEn: 'Appetizers', nameAr: 'مقبلات' },
    { id: 'soups', nameKu: 'سوپەکان', nameEn: 'Soups', nameAr: 'شوربات' },
    { id: 'salads', nameKu: 'زەڵاتە', nameEn: 'Salads', nameAr: 'سلطات' },
    { id: 'kebabs', nameKu: 'کەبابەکان', nameEn: 'Kebabs', nameAr: 'كباب' },
    { id: 'rice-dishes', nameKu: 'خواردنی برنج', nameEn: 'Rice Dishes', nameAr: 'أطباق أرز' },
    { id: 'stews', nameKu: 'خۆراک', nameEn: 'Stews', nameAr: 'يخنات' },
    { id: 'seafood', nameKu: 'ماسی', nameEn: 'Seafood', nameAr: 'مأكولات بحرية' },
    { id: 'breads', nameKu: 'نان', nameEn: 'Breads', nameAr: 'خبز' },
    { id: 'desserts', nameKu: 'خواردنی شیرین', nameEn: 'Desserts', nameAr: 'حلويات' },
    { id: 'hot-drinks', nameKu: 'چا و قاوە', nameEn: 'Tea & Coffee', nameAr: 'شاي وقهوة' },
    { id: 'drinks', nameKu: 'خواردنی سارد', nameEn: 'Cold Drinks', nameAr: 'مشروبات باردة' },
    { id: 'shisha', nameKu: 'شیەشە', nameEn: 'Shisha', nameAr: 'شيشة' },
  ];

  const availableCategories = categories.filter((category) => {
    const categoryItems = MENU_ITEMS.filter(item => item.category === category.id && item.available);
    return categoryItems.length > 0;
  });

  const startAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    
    const interval = setInterval(() => {
      const nextIndex = (currentSlideIndex.current + 1) % availableCategories.length;
      const cardWidth = 130;
      const gap = 10;
      const scrollPosition = nextIndex * (cardWidth + gap);
      
      categoryScrollRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
      
      currentSlideIndex.current = nextIndex;
    }, 4000);
    
    autoScrollInterval.current = interval;
  }, [availableCategories.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [startAutoScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    if (currentScrollY > 80 && scrollDelta > 5) {
      if (isHeaderVisible) {
        setIsHeaderVisible(false);
        Animated.timing(headerTranslateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else if (scrollDelta < -10 || currentScrollY < 50) {
      if (!isHeaderVisible) {
        setIsHeaderVisible(true);
        Animated.spring(headerTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  const menuCategoryIds: MenuCategory[] = categories.map(c => c.id as MenuCategory);
  
  const filteredCategories = menuCategoryIds.filter((category) => {
    if (searchQuery === '') return true;
    const categoryName = tc(category).toLowerCase();
    const categoryItems = MENU_ITEMS.filter(item => item.category === category);
    const hasMatchingItems = categoryItems.some(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameKurdish.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return categoryName.includes(searchQuery.toLowerCase()) || hasMatchingItems;
  });

  const getItemName = (item: typeof MENU_ITEMS[0]) => {
    if (language === 'ar') return item.nameArabic;
    if (language === 'ku') return item.nameKurdish;
    return item.name;
  };

  const getItemDescription = (item: typeof MENU_ITEMS[0]) => {
    if (language === 'ar') return item.descriptionArabic;
    if (language === 'ku') return item.descriptionKurdish;
    return item.description;
  };

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    const isPremium = item.price > 25000;
    const itemStats = ratingsStats[item.id];
    const hasRatings = itemStats && itemStats.totalRatings > 0;
    
    if (layoutView === 'list') {
      return (
        <View 
          key={item.id} 
          style={[styles.menuItemCardList, isPremium && styles.premiumCardList]}
        >
          <TouchableOpacity
            style={styles.menuItemTouchableList}
            activeOpacity={0.95}
            onPress={() => {
              setSelectedItem(item);
              setItemQuantity(1);
              setItemNotes('');
            }}
          >
            <View style={styles.menuItemContentList}>
              {item.image && (
                <View style={styles.imageContainerList}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.menuItemImageList}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemNameList} numberOfLines={2}>
                  {getItemName(item)}
                </Text>
                
                <Text style={styles.menuItemDescriptionList} numberOfLines={2}>
                  {getItemDescription(item)}
                </Text>
                
                {hasRatings && (
                  <View style={styles.ratingBadgeList}>
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    <Text style={styles.ratingText}>{itemStats.averageRating.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({itemStats.totalRatings})</Text>
                  </View>
                )}
                
                <View style={styles.priceHighlightList}>
                  <Text style={styles.menuItemPriceList}>{formatPrice(item.price)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.rateButtonOnCardList}
            onPress={(e: any) => {
              setRatingItem(item);
              setUserRating(0);
              setRatingComment('');
              setShowRatingModal(true);
            }}
            activeOpacity={0.7}
          >
            <Star size={18} color="#D4AF37" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View 
        key={item.id} 
        style={[styles.menuItemCardHorizontal, isPremium && styles.premiumCard]}
      >
        <TouchableOpacity
          style={styles.menuItemTouchable}
          activeOpacity={0.85}
          onPress={() => {
            setSelectedItem(item);
            setItemQuantity(1);
            setItemNotes('');
          }}
        >
          <View style={styles.menuItemContentHorizontal}>
            {item.image && (
              <View style={styles.imageContainerHorizontal}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.menuItemImageHorizontal}
                  resizeMode="cover"
                />
                <View style={styles.imageGradientOverlay} />
              </View>
            )}
            
            <Text style={styles.menuItemNameHorizontal} numberOfLines={2}>
              {getItemName(item)}
            </Text>
            
            <View style={styles.priceHighlight}>
              <Text style={styles.menuItemPriceHorizontal}>{formatPrice(item.price)}</Text>
            </View>
            
            {hasRatings && (
              <View style={styles.ratingBadgeCentered}>
                <Star size={16} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.ratingText}>{itemStats.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({itemStats.totalRatings})</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rateButtonOnCard}
          onPress={(e: any) => {
            setRatingItem(item);
            setUserRating(0);
            setRatingComment('');
            setShowRatingModal(true);
          }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={language === 'en' ? `Rate ${getItemName(item)}` : language === 'ku' ? `هەڵسەنگاندنی ${getItemName(item)}` : `تقييم ${getItemName(item)}`}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'Opens rating form' : language === 'ku' ? 'فۆرمی هەڵسەنگاندن دەکاتەوە' : 'يفتح نموذج التقييم'}
        >
          <Star size={18} color="#D4AF37" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleCategoryPress = (categoryId: string) => {
    const yOffset = categoryLayouts[categoryId];
    if (yOffset !== undefined && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: yOffset + 220, animated: true });
    }
  };

  const renderCategorySection = (category: MenuCategory) => {
    const categoryItems = MENU_ITEMS.filter((item) => {
      const matchesCategory = item.category === category;
      const matchesSearch =
        searchQuery === '' ||
        getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getItemDescription(item).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && item.available;
    });

    if (categoryItems.length === 0) return null;

    return (
      <View 
        key={category} 
        style={styles.categorySection}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          setCategoryLayouts(prev => ({
            ...prev,
            [category]: layout.y
          }));
        }}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={styles.categoryDecorLeft} />
            <Text style={styles.categoryTitle}>{tc(category)}</Text>
            <View style={styles.categoryDecorRight} />
          </View>
        </View>
        <View style={styles.categoryItemsGrid}>
          {categoryItems.map(renderMenuItem)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qb12yvk9zoc3zrfv2t956' }}
        style={[StyleSheet.absoluteFillObject, Platform.select({ web: { display: 'none' as const } })]}
        resizeMode="cover"
      />

      {/* All Modal Components */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem?.image && (
                <Image 
                  source={{ uri: selectedItem.image }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedItem(null)}
                  activeOpacity={0.8}
                >
                  <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.modalItemName}>{selectedItem ? getItemName(selectedItem) : ''}</Text>
                <Text style={styles.modalItemPrice}>{selectedItem ? formatPrice(selectedItem.price) : ''}</Text>
                <Text style={styles.modalItemDescription}>{selectedItem ? getItemDescription(selectedItem) : ''}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.quantitySelector}>
                  <Text style={styles.quantitySelectorLabel}>{t('quantity')}:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus size={20} color="#3d0101" />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{itemQuantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus size={20} color="#3d0101" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>{t('specialRequirements')}:</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder={t('anySpecialRequirements')}
                    placeholderTextColor="rgba(26, 26, 26, 0.4)"
                    value={itemNotes}
                    onChangeText={setItemNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddToCart}
                >
                  <ShoppingCart size={20} color="#fff" />
                  <Text style={styles.modalAddButtonText}>
                    {t('addToCart')} - {formatPrice((selectedItem?.price ?? 0) * itemQuantity)}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCart}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCart(false)}
      >
        <View style={[styles.cartContainer, { paddingTop: insets.top }]}>
          <View style={styles.cartHeader}>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cartTitle}>{t('yourOrder')}</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.cartItems}>
            {currentOrder.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingCart size={64} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyCartText}>{t('noItemsInOrder')}</Text>
              </View>
            ) : (
              currentOrder.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{getItemName(item.menuItem)}</Text>
                    {item.notes && (
                      <Text style={styles.cartItemNotes}>{t('note')}: {item.notes}</Text>
                    )}
                    <Text style={styles.cartItemPrice}>
                      {formatPrice(item.menuItem.price)} × {item.quantity} = {formatPrice(item.menuItem.price * item.quantity)}
                    </Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity
                      style={styles.cartQuantityButton}
                      onPress={() => updateItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.cartQuantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartQuantityButton}
                      onPress={() => updateItemQuantity(index, item.quantity + 1)}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cartDeleteButton}
                      onPress={() => removeItemFromCurrentOrder(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.cartFooter}>
            {selectedTable && (
              <TouchableOpacity 
                style={styles.tableInfo}
                onPress={() => setShowTableSelector(true)}
              >
                <Text style={styles.tableInfoText}>{t('table')}: {selectedTable}</Text>
                <Text style={styles.tableInfoChange}>{t('change')}</Text>
              </TouchableOpacity>
            )}
            {!selectedTable && (
              <TouchableOpacity 
                style={styles.selectTableButton}
                onPress={() => setShowTableSelector(true)}
              >
                <Text style={styles.selectTableButtonText}>{t('selectTable')}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.cartTotal}>
              <Text style={styles.cartTotalLabel}>{t('total')}:</Text>
              <Text style={styles.cartTotalAmount}>{formatPrice(calculateTotal(currentOrder))}</Text>
            </View>
            <TouchableOpacity
              style={[styles.cartSubmitButton, currentOrder.length === 0 && styles.cartSubmitButtonDisabled]}
              onPress={handleSubmitOrder}
              disabled={currentOrder.length === 0}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.cartSubmitButtonText}>{t('submitOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTableSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (selectedTable) {
            setShowTableSelector(false);
          }
        }}
      >
        <View style={styles.tableSelectorOverlay}>
          <View style={styles.tableSelectorContent}>
            <View style={styles.tableSelectorHeader}>
              <Text style={styles.tableSelectorTitle}>{t('selectYourTable')}</Text>
              <Text style={styles.tableSelectorSubtitle}>{t('chooseTableDescription')}</Text>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.tableGrid}
              showsVerticalScrollIndicator={false}
            >
              {tables.map(table => {
                const isSelected = selectedTable === table.number;
                const isAvailable = table.status === 'available' || table.status === 'occupied';
                
                return (
                  <TouchableOpacity
                    key={table.number}
                    style={[
                      styles.tableCard,
                      isSelected && styles.tableCardSelected,
                      !isAvailable && styles.tableCardDisabled,
                    ]}
                    onPress={() => {
                      setSelectedTable(table.number);
                      setShowTableSelector(false);
                    }}
                    disabled={!isAvailable}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.tableCardInner, isSelected && styles.tableCardInnerSelected]}>
                      <Text style={[styles.tableCardNumber, isSelected && styles.tableCardNumberSelected]}>
                        {table.number}
                      </Text>
                      <View style={styles.tableCardInfo}>
                        <Text style={[styles.tableCardCapacity, isSelected && styles.tableCardCapacitySelected]}>
                          {table.capacity} {t('seats')}
                        </Text>
                        {!isAvailable && (
                          <Text style={styles.tableCardStatus}>{t('notAvailable')}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {selectedTable && (
              <TouchableOpacity
                style={styles.tableSelectorClose}
                onPress={() => setShowTableSelector(false)}
              >
                <Text style={styles.tableSelectorCloseText}>{t('close')}</Text>
              </TouchableOpacity>
            )}
            
            {!selectedTable && (
              <View style={styles.tableSelectorFooter}>
                <Text style={styles.tableSelectorFooterText}>{t('tapTableToSelect')}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAIAssistant}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAIAssistant(false)}
      >
        <AIChatbot visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      </Modal>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={[styles.searchModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.searchModalBackButton}
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
              }}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>
              {language === 'en' ? 'Search' : language === 'ku' ? 'گەڕان بکە' : 'ابحث'}
            </Text>
            <TouchableOpacity
              style={styles.searchModalSearchIcon}
              onPress={() => {}}
            >
              <Search size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchModalInputContainer}>
            <Search size={20} color="rgba(255, 255, 255, 0.7)" style={styles.searchModalInputIcon} />
            <TextInput
              style={styles.searchModalInput}
              placeholder={language === 'en' ? 'Search for dishes...' : language === 'ku' ? 'گەڕان لە خواردن...' : 'ابحث عن الأطباق...'}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery !== '' && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchModalClearButton}
              >
                <X size={18} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.searchModalResults} showsVerticalScrollIndicator={false}>
            {searchQuery === '' ? (
              <View style={styles.searchModalContent}>
                {availableCategories.map((category) => {
                  const categoryItems = MENU_ITEMS.filter(item => item.category === category.id && item.available);
                  if (categoryItems.length === 0) return null;
                  
                  const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;
                  
                  return (
                    <View key={category.id} style={styles.searchCategorySection}>
                      <View style={styles.searchCategoryHeader}>
                        <View style={styles.searchCategoryDecorLeft} />
                        <Text style={styles.searchCategoryTitle}>{categoryName}</Text>
                        <View style={styles.searchCategoryDecorRight} />
                      </View>
                      
                      {categoryItems.map((item) => {
                        const itemStats = ratingsStats[item.id];
                        const hasRatings = itemStats && itemStats.totalRatings > 0;
                        
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.searchResultItem}
                            onPress={() => {
                              setSelectedItem(item);
                              setItemQuantity(1);
                              setItemNotes('');
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.searchResultItemContent}>
                              <View style={styles.searchResultItemInfo}>
                                <Text style={styles.searchResultItemName} numberOfLines={2}>
                                  {getItemName(item)}
                                </Text>
                                {hasRatings && (
                                  <View style={styles.searchResultRatingBadge}>
                                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                                    <Text style={styles.searchResultRatingText}>{itemStats.averageRating.toFixed(1)}</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.searchResultItemPrice}>{formatPrice(item.price)}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.searchModalContent}>
                <View style={styles.searchResultsList}>
                  {MENU_ITEMS.filter((item) => {
                    const matchesSearch =
                      getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
                      getItemDescription(item).toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesSearch && item.available;
                  }).map((item) => {
                    const itemStats = ratingsStats[item.id];
                    const hasRatings = itemStats && itemStats.totalRatings > 0;
                    
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.searchResultItem}
                        onPress={() => {
                          setSelectedItem(item);
                          setItemQuantity(1);
                          setItemNotes('');
                          setShowSearchModal(false);
                          setSearchQuery('');
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.searchResultItemContent}>
                          <View style={styles.searchResultItemInfo}>
                            <Text style={styles.searchResultItemName} numberOfLines={2}>
                              {getItemName(item)}
                            </Text>
                            {hasRatings && (
                              <View style={styles.searchResultRatingBadge}>
                                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                                <Text style={styles.searchResultRatingText}>{itemStats.averageRating.toFixed(1)}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.searchResultItemPrice}>{formatPrice(item.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {MENU_ITEMS.filter((item) => {
                    const matchesSearch =
                      getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
                      getItemDescription(item).toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesSearch && item.available;
                  }).length === 0 && (
                    <View style={styles.searchModalEmpty}>
                      <Search size={64} color="rgba(255, 255, 255, 0.3)" />
                      <Text style={styles.searchModalEmptyText}>
                        {t('noItemsFound')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRatingModal(false)}
              activeOpacity={0.8}
            >
              <X size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={styles.ratingModalTitle}>
              {ratingItem ? t('rateThisDish') : (language === 'en' ? 'All Reviews' : language === 'ku' ? 'هەموو هەڵسەنگاندنەکان' : 'جميع التقييمات')}
            </Text>
            {ratingItem && (
              <Text style={styles.ratingModalItemName}>{getItemName(ratingItem)}</Text>
            )}
            
            {!ratingItem && (
              <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
                {Object.entries(ratingsStats).map(([itemId, stats]) => {
                  const menuItem = MENU_ITEMS.find(item => item.id === itemId);
                  if (!menuItem || stats.totalRatings === 0) return null;
                  
                  return (
                    <TouchableOpacity
                      key={itemId}
                      style={styles.reviewItem}
                      onPress={() => {
                        setRatingItem(menuItem);
                        setUserRating(0);
                        setRatingComment('');
                      }}
                    >
                      <View style={styles.reviewItemHeader}>
                        <Text style={styles.reviewItemName} numberOfLines={1}>{getItemName(menuItem)}</Text>
                        <View style={styles.reviewItemRating}>
                          <Star size={16} color="#D4AF37" fill="#D4AF37" />
                          <Text style={styles.reviewItemRatingText}>{stats.averageRating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewItemCount}>
                        {stats.totalRatings} {language === 'en' ? 'reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'تقييم'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {Object.keys(ratingsStats).length === 0 && (
                  <View style={styles.noReviewsContainer}>
                    <Star size={48} color="rgba(212, 175, 55, 0.3)" />
                    <Text style={styles.noReviewsText}>
                      {language === 'en' ? 'No reviews yet' : language === 'ku' ? 'هێشتا هەڵسەنگاندن نییە' : 'لا توجد تقييمات بعد'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {ratingItem && (
              <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserRating(star)}
                  style={styles.starButton}
                >
                  <Star
                    size={40}
                    color="#D4AF37"
                    fill={star <= userRating ? "#D4AF37" : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
              </View>
            )}

            {ratingItem && <Text style={styles.ratingModalLabel}>{t('addReview')}</Text>}
            {ratingItem && (
              <>
                <TextInput
                  style={styles.ratingInput}
                  placeholder={t('reviewOptional')}
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.submitRatingButton, (userRating === 0 || createRatingMutation.isPending) && styles.submitRatingButtonDisabled]}
                  onPress={handleSubmitRating}
                  disabled={userRating === 0 || createRatingMutation.isPending}
                >
                  <Star size={20} color="#fff" fill="#fff" />
                  <Text style={styles.submitRatingButtonText}>
                    {createRatingMutation.isPending ? t('submitting') : t('submitRating')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Header with hide animation */}
      <Animated.View style={[
        styles.header, 
        { 
          paddingTop: insets.top + 4,
          transform: [{ translateY: headerTranslateY }],
        }
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/landing')}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Globe size={22} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {showLanguageMenu && (
          <View style={styles.languageMenu}>
            {(['en', 'ku', 'ar'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setLanguage(lang);
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}>
                  {lang === 'en' ? 'English' : lang === 'ku' ? 'کوردی' : 'العربية'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Sticky Category and View Switcher Section */}
      <View style={[styles.stickySection, { paddingTop: insets.top + 85 }]}>
        <View style={styles.categorySliderContainer}>
          <View style={styles.categoryTitleContainer}>
            <View style={styles.categoryDecorLeft} />
            <Text style={styles.categorySliderTitle}>{t('exploreCategories')}</Text>
            <View style={styles.categoryDecorRight} />
          </View>
          <ScrollView 
            ref={categoryScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categorySlider}
            snapToInterval={140}
            decelerationRate="fast"
            snapToAlignment="center"
            onScrollBeginDrag={() => {
              if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
              }
            }}
            onScrollEndDrag={startAutoScroll}
          >
            {availableCategories.map((category) => {
              const categoryItems = MENU_ITEMS.filter(item => item.category === category.id && item.available);
              const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (autoScrollInterval.current) {
                      clearInterval(autoScrollInterval.current);
                    }
                    handleCategoryPress(category.id);
                  }}
                >
                  <View style={styles.categoryCardImageContainer}>
                    {categoryItems[0]?.image && (
                      <Image 
                        source={{ uri: categoryItems[0].image }} 
                        style={styles.categoryCardImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.categoryCardOverlay} />
                  </View>
                  <View style={styles.categoryCardFooter}>
                    <Text style={styles.categoryCardTitle}>{categoryName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.viewSwitcherContainer}>
          <View style={styles.viewSwitcher}>
            <Animated.View
              style={[
                styles.viewSwitcherPill,
                {
                  transform: [
                    {
                      translateX: viewToggleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 39],
                      }),
                    },
                  ],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                if (layoutView !== 'grid') {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  Animated.spring(viewToggleAnimation, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 8,
                  }).start();
                  setLayoutView('grid');
                }
              }}
              activeOpacity={0.7}
            >
              <Grid3x3 size={18} color={layoutView === 'grid' ? '#3d0101' : 'rgba(232, 201, 104, 0.8)'} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                if (layoutView !== 'list') {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  Animated.spring(viewToggleAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 8,
                  }).start();
                  setLayoutView('list');
                }
              }}
              activeOpacity={0.7}
            >
              <List size={18} color={layoutView === 'list' ? '#3d0101' : 'rgba(232, 201, 104, 0.8)'} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Menu Content */}
      <ScrollView 
        ref={contentScrollRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingTop: insets.top + 195 }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.menuSections}>
          {filteredCategories.map(renderCategorySection)}
        </View>

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noItemsFound')}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerTitle}>تەپسی سلێمانی</Text>
          <View style={styles.footerDivider} />
          
          <Text style={styles.footerText}>
            {language === 'en' ? 'Thank you for choosing Tapsi Sulaymaniyah' : language === 'ku' ? 'سوپاس بۆ هەڵبژاردنی تەپسی سلێمانی' : 'شكراً لاختياركم تابسي السليمانية'}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <Animated.View
        style={[
          styles.floatingMenu,
          {
            transform: [
              {
                translateY: fabSlideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: fabSlideAnimation,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowAIAssistant(true)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={language === 'en' ? 'AI Chat Assistant' : language === 'ku' ? 'یارمەتیدەری وتووێژی AI' : 'مساعد الدردشة AI'}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'Get help choosing menu items' : language === 'ku' ? 'یارمەتی وەربگرە بۆ هەڵبژاردنی خواردن' : 'احصل على المساعدة في اختيار عناصر القائمة'}
        >
          <Animated.View style={styles.fabIconContainer}>
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'AI Chat' : language === 'ku' ? 'وتووێژی AI' : 'دردشة AI'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabButton, styles.fabButtonPrimary]}
          onPress={() => setShowCart(true)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`${language === 'en' ? 'My Order' : language === 'ku' ? 'داواکاریم' : 'طلبي'}, ${cartItemCount} ${language === 'en' ? 'items' : language === 'ku' ? 'دانە' : 'عناصر'}`}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'View your shopping cart' : language === 'ku' ? 'سەبەتەی کڕینەکەت ببینە' : 'عرض سلة التسوق الخاصة بك'}
        >
          <Animated.View style={styles.fabIconContainer}>
            <Utensils size={24} color="#3d0101" strokeWidth={2} />
            {cartItemCount > 0 && (
              <View style={styles.fabCartBadge}>
                <Text style={styles.fabCartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </Animated.View>
          <Text style={[styles.fabLabel, styles.fabLabelPrimary]}>
            {language === 'en' ? 'My Order' : language === 'ku' ? 'داواکاریم' : 'طلبي'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open('https://www.google.com/search?q=Tapsi+Sulaymaniyah+reviews', '_blank');
            } else {
              Alert.alert(
                language === 'en' ? 'Google Reviews' : language === 'ku' ? 'هەڵسەنگاندنی گووگڵ' : 'مراجعات جوجل',
                language === 'en' ? 'Please visit our Google page to leave a review' : language === 'ku' ? 'تکایە سەردانی پەڕەی گووگڵمان بکە بۆ هێشتنەوەی هەڵسەنگاندن' : 'يرجى زيارة صفحتنا على جوجل لترك تقييم'
              );
            }
          }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={language === 'en' ? 'Reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'التقييمات'}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'View and leave reviews' : language === 'ku' ? 'بینینی هەڵسەنگاندنەکان و هێشتنەوەی هەڵسەنگاندن' : 'عرض وترك التقييمات'}
        >
          <Animated.View style={styles.fabIconContainer}>
            <Star size={24} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'Reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'التقييمات'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowSearchModal(true)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={language === 'en' ? 'Search menu' : language === 'ku' ? 'گەڕان لە مینیو' : 'بحث في القائمة'}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'Search for dishes' : language === 'ku' ? 'گەڕان لە خواردنەکان' : 'ابحث عن الأطباق'}
        >
          <Animated.View style={styles.fabIconContainer}>
            <Search size={24} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'Search' : language === 'ku' ? 'گەڕان' : 'بحث'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d0101',
    position: 'relative' as const,
    ...Platform.select({
      web: {
        width: '100%',
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qb12yvk9zoc3zrfv2t956')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      },
    }),
  },
  header: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 8,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerLogo: {
    width: 70,
    height: 70,
    ...Platform.select({
      web: {
        width: 80,
        height: 80,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageMenu: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(61, 1, 1, 0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
  },
  languageOptionTextActive: {
    fontWeight: '700' as const,
    color: '#E8C968',
  },
  stickySection: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(61, 1, 1, 0.98)',
  },
  categorySliderContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 8,
    paddingTop: 6,
    ...Platform.select({
      web: {
        paddingBottom: 12,
        paddingTop: 8,
      },
    }),
  },
  categorySliderTitle: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#E8C968',
    marginTop: 4,
    marginLeft: 16,
    marginBottom: 3,
    letterSpacing: 0.3,
    textAlign: 'left' as const,
    textTransform: 'capitalize' as const,
    ...Platform.select({
      web: {
        fontSize: 18,
        marginTop: 6,
        marginBottom: 4,
      },
    }),
  },
  categorySlider: {
    paddingHorizontal: 10,
    paddingBottom: 3,
    ...Platform.select({
      web: {
        paddingHorizontal: 14,
      },
    }),
  },
  categoryCard: {
    width: 90,
    height: 80,
    backgroundColor: '#3d0101',
    borderRadius: 10,
    overflow: 'hidden' as const,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        width: 110,
        height: 95,
      },
    }),
  },
  categoryCardImageContainer: {
    width: '100%',
    height: 52,
    position: 'relative' as const,
    backgroundColor: '#2a1a1a',
    ...Platform.select({
      web: {
        height: 65,
      },
    }),
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  categoryCardFooter: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    backgroundColor: '#2a1a1a',
    width: '100%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    ...Platform.select({
      web: {
        paddingVertical: 4,
        height: 30,
      },
    }),
  },
  categoryCardTitle: {
    fontSize: 9,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.1,
    lineHeight: 11,
    ...Platform.select({
      web: {
        fontSize: 11,
        lineHeight: 14,
      },
    }),
  },
  viewSwitcherContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        paddingVertical: 14,
      },
    }),
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    borderRadius: 20,
    padding: 3,
    position: 'relative' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  viewSwitcherPill: {
    position: 'absolute' as const,
    left: 3,
    top: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDecorLeft: {
    width: 4,
    height: 20,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    marginRight: 10,
  },
  categoryDecorRight: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#D4AF37',
    marginLeft: 12,
    borderRadius: 1,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative' as const,
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 100, android: 92, default: 92 }),
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  menuSections: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#E8C968',
    letterSpacing: 0.3,
    textTransform: 'capitalize' as const,
  },
  categoryItemsGrid: {
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: 10,
    ...Platform.select({
      web: {
        justifyContent: 'flex-start' as const,
        gap: 14,
        paddingHorizontal: 16,
      },
    }),
  },
  menuItemCardList: {
    width: '100%' as const,
    backgroundColor: '#3d0101',
    borderRadius: 16,
    overflow: 'visible' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  premiumCardList: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 24px rgba(212, 175, 55, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  menuItemTouchableList: {
    flex: 1,
  },
  menuItemContentList: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  imageContainerList: {
    width: 100,
    height: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden' as const,
    ...Platform.select({
      web: {
        width: 120,
        height: 120,
      },
    }),
  },
  menuItemImageList: {
    width: '100%',
    height: '100%',
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemNameList: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 24,
    letterSpacing: 0.3,
    marginBottom: 4,
    ...Platform.select({
      web: {
        fontSize: 20,
        lineHeight: 26,
      },
    }),
  },
  menuItemDescriptionList: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontSize: 14,
        lineHeight: 20,
      },
    }),
  },
  priceHighlightList: {
    marginTop: 'auto' as const,
  },
  menuItemPriceList: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  ratingBadgeList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
    gap: 3,
    marginBottom: 8,
  },
  rateButtonOnCardList: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    }),
  },
  menuItemCardHorizontal: {
    width: '48.5%' as const,
    backgroundColor: '#3d0101',
    borderRadius: 14,
    overflow: 'visible' as const,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        width: '31%',
        minWidth: 200,
        maxWidth: 300,
        boxShadow: '0 3px 14px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 24px rgba(212, 175, 55, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  imageContainerHorizontal: {
    width: '100%',
    height: 110,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      web: {
        height: 160,
      },
    }),
  },
  menuItemImageHorizontal: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      android: {
        backgroundColor: 'rgba(61, 1, 1, 0.3)',
      },
      ios: {
        backgroundColor: 'rgba(61, 1, 1, 0.3)',
      },
      web: {
        backgroundColor: 'rgba(61, 1, 1, 0.6)',
      },
    }),
  },
  menuItemContentHorizontal: {
    padding: 0,
  },
  menuItemNameHorizontal: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 18,
    letterSpacing: 0.2,
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'center' as const,
    paddingHorizontal: 8,
    ...Platform.select({
      web: {
        fontSize: 16,
        lineHeight: 22,
      },
    }),
  },
  priceHighlight: {
    marginBottom: 8,
    alignItems: 'center' as const,
  },
  menuItemPriceHorizontal: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 16,
      },
    }),
  },
  menuItemTouchable: {
    flex: 1,
  },
  rateButtonOnCard: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    }),
  },
  ratingBadgeCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'center' as const,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  ratingCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  footer: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#3d0101',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLogo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#D4AF37',
    marginBottom: 16,
    borderRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center' as const,
        width: '100%',
        marginBottom: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: '80%',
        marginTop: 'auto' as const,
      },
    }),
  },
  modalImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        height: 320,
      },
    }),
  },
  modalBody: {
    padding: 20,
    paddingTop: 24,
    ...Platform.select({
      web: {
        padding: 24,
      },
    }),
  },
  modalCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3d0101',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 3px 12px rgba(61, 1, 1, 0.4)',
      },
    }),
  },
  modalItemName: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontSize: 26,
      },
    }),
  },
  modalItemPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3d0101',
    marginBottom: 12,
    ...Platform.select({
      web: {
        fontSize: 24,
      },
    }),
  },
  modalItemDescription: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
    ...Platform.select({
      web: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
      },
    }),
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantitySelectorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDD0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d0101',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'center' as const,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  cartContainer: {
    flex: 1,
    backgroundColor: '#3d0101',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cartItems: {
    flex: 1,
    padding: 20,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    fontWeight: '500' as const,
  },
  cartItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cartItemInfo: {
    marginBottom: 12,
  },
  cartItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cartItemNotes: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  cartItemPrice: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQuantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    minWidth: 30,
    textAlign: 'center' as const,
  },
  cartDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 77, 77, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto' as const,
  },
  cartFooter: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tableInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tableInfoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  tableInfoChange: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600' as const,
  },
  selectTableButton: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectTableButtonText: {
    color: '#3d0101',
    fontSize: 16,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  cartTotalAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  cartSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cartSubmitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartSubmitButtonText: {
    color: '#3d0101',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  tableSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
    }),
  },
  tableSelectorContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    ...Platform.select({
      web: {
        borderRadius: 24,
        maxWidth: 600,
        maxHeight: '80%',
      },
    }),
  },
  tableSelectorHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  tableSelectorTitle: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    marginBottom: 8,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  tableSelectorSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  tableGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  tableCard: {
    width: 90,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tableCardSelected: {
    borderColor: '#3d0101',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(61, 1, 1, 0.3)',
      },
    }),
  },
  tableCardDisabled: {
    opacity: 0.4,
    borderColor: '#D1D5DB',
  },
  tableCardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  tableCardInnerSelected: {
    backgroundColor: '#3d0101',
  },
  tableCardInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  tableCardNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    lineHeight: 38,
  },
  tableCardNumberSelected: {
    color: '#FFFFFF',
  },
  tableCardCapacity: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  tableCardCapacitySelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tableCardStatus: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  tableSelectorClose: {
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tableSelectorCloseText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  tableSelectorFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  tableSelectorFooterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500' as const,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#3d0101',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  searchModalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalTitle: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: 12,
  },
  searchModalSearchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
  },
  searchModalInputIcon: {
    marginRight: 12,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400' as const,
  },
  searchModalClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchModalResults: {
    flex: 1,
  },
  searchModalContent: {
    paddingVertical: 8,
  },
  searchModalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  searchCategorySection: {
    marginBottom: 24,
  },
  searchCategoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  searchCategoryDecorLeft: {
    width: 4,
    height: 20,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    marginRight: 10,
  },
  searchCategoryDecorRight: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginLeft: 12,
    borderRadius: 1,
  },
  searchCategoryTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  searchModalEmptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  searchResultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  searchResultItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  searchResultItemPrice: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  searchResultRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  searchResultRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#D4AF37',
  },
  ratingModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        maxWidth: 500,
        alignSelf: 'center' as const,
        width: '100%',
        marginBottom: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: '75%',
        marginTop: 'auto' as const,
      },
    }),
  },
  ratingModalTitle: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  ratingModalItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  ratingModalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top' as const,
    marginBottom: 24,
  },
  submitRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitRatingButtonDisabled: {
    backgroundColor: 'rgba(61, 1, 1, 0.4)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  submitRatingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  reviewsList: {
    maxHeight: 400,
    marginVertical: 12,
  },
  reviewItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewItemName: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  reviewItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewItemRatingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  reviewItemCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noReviewsText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  floatingMenu: {
    position: 'absolute' as const,
    bottom: Platform.select({ ios: 24, android: 16, default: 20 }),
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(61, 1, 1, 0.97)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.6)',
    borderBottomColor: 'rgba(212, 175, 55, 0.6)',
    borderLeftColor: 'rgba(212, 175, 55, 0.6)',
    borderRightColor: 'rgba(212, 175, 55, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
      web: {
        boxShadow: '0 -8px 40px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      },
    }),
  },
  fabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 5,
    minHeight: 68,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(212, 175, 55, 0.6)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        minHeight: 76,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
      },
    }),
  },
  fabButtonPrimary: {
    backgroundColor: 'rgba(212, 175, 55, 0.98)',
    borderColor: '#D4AF37',
    borderWidth: 2.5,
    transform: [{ scale: 1 }],
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 6px 28px rgba(212, 175, 55, 0.7), 0 0 40px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
      },
    }),
  },
  fabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative' as const,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  fabLabel: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    letterSpacing: 0.4,
    lineHeight: 15,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fabLabelPrimary: {
    color: '#3d0101',
    fontWeight: '700' as const,
  },
  fabCartBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  fabCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
