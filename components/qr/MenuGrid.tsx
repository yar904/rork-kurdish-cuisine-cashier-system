import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { Text } from '@/components/CustomText';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  available: boolean;
}

interface MenuGridProps {
  items: MenuItem[];
  onItemPress: (item: MenuItem) => void;
}

export function MenuGrid({ items, onItemPress }: MenuGridProps) {
  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={[styles.card, !item.available && styles.cardUnavailable]}
      onPress={() => item.available && onItemPress(item)}
      disabled={!item.available}
      activeOpacity={0.8}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      )}
      {!item.image && (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>IQD {item.price.toLocaleString()}</Text>
          {!item.available && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  cardUnavailable: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#F6EEDD',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F6EEDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  info: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  unavailableBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unavailableText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
