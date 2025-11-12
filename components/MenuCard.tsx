import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuItem } from '@/types/restaurant';
import { formatPrice } from '@/constants/currency';

interface MenuCardProps {
  item: MenuItem;
}

export default function MenuCard({ item }: MenuCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.nameKurdish} numberOfLines={1}>
          {item.nameKurdish}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {!item.available && (
            <Text style={styles.unavailable}>Unavailable</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 165,
    backgroundColor: '#2A1515',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A2929',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#1A0B0B',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4E3B5',
    marginBottom: 4,
  },
  nameKurdish: {
    fontSize: 13,
    color: '#D4C595',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#B8A575',
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F4E3B5',
  },
  unavailable: {
    fontSize: 11,
    color: '#E85858',
    fontWeight: '600',
  },
});
