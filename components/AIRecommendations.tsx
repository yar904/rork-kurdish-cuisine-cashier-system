import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Sparkles, TrendingUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { MenuItem } from '@/types/restaurant';
import { formatPrice } from '@/constants/currency';

interface AIRecommendationsProps {
  tableNumber: number;
  onSelectItem: (itemId: string) => void;
}

export default function AIRecommendations({ tableNumber, onSelectItem }: AIRecommendationsProps) {
  const { t } = useLanguage();
  const { orders, getAIRecommendations } = useRestaurant();
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, orders]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const recs = await getAIRecommendations(tableNumber);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading AI recommendations...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={20} color={Colors.primary} />
          <Text style={styles.headerText}>AI Recommendations</Text>
        </View>
        <TrendingUp size={16} color={Colors.success} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => onSelectItem(item.id)}
          >
            <View style={styles.aiBadge}>
              <Sparkles size={12} color="#fff" />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemKurdish} numberOfLines={1}>{item.nameKurdish}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  itemCard: {
    width: 140,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  itemKurdish: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
