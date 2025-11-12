import { useMemo } from 'react';
import { MENU_ITEMS, CATEGORY_NAMES } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';

interface MenuSection {
  id: MenuCategory;
  name: string;
  items: MenuItem[];
}

export function useMenuSections() {
  const menuSections = useMemo(() => {
    const sections: MenuSection[] = [];
    const categoriesMap = new Map<MenuCategory, MenuItem[]>();

    MENU_ITEMS.forEach((item) => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, []);
      }
      categoriesMap.get(item.category)!.push(item);
    });

    categoriesMap.forEach((items, category) => {
      sections.push({
        id: category,
        name: CATEGORY_NAMES[category] || category,
        items,
      });
    });

    return sections;
  }, []);

  return { menuSections };
}
