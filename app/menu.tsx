import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuCard from '@/components/MenuCard';
import { useMenuSections } from '@/hooks/useMenuSections';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { menuSections } = useMenuSections();

  return (
    <View style={styles.container}>
      {/* ✅ Scrollable menu content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuSections?.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>| {section.name}</Text>

            <View style={styles.grid}>
              {section.items?.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ✅ Floating bottom menu */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 6 : 10 },
        ]}
      >
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>🧾 My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>📞 Call Waiter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 Review</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>💰 Request Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ==== Container ====
  container: {
    flex: 1,
    backgroundColor: '#1A0B0B',
  },



  // ==== Scrollable area ====
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 110,
    paddingHorizontal: 0,
  },

  // ==== Menu Sections ====
  section: {
    marginBottom: 8,
    paddingTop: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E3B5',
    marginBottom: 12,
    marginLeft: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },

  // ==== Floating Bottom Bar ====
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#3A1E1E',
    paddingVertical: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 10,
  },

  actionBtn: {
    backgroundColor: '#5C2D2D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  actionText: {
    color: '#FFF3D8',
    fontWeight: '600',
    fontSize: 13,
  },
});