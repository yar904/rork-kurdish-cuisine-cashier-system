# 🎨 Font Guide for Tapse Restaurant App

## Installed Fonts

Your app now has a sophisticated font system that automatically adapts to Kurdish, Arabic, and English languages.

### Font Families

#### 1. **DM Sans** (Body Text)
- **Purpose**: Clean, modern sans-serif for readable body text
- **Weights**: Regular (400), Medium (500), Bold (700)
- **Best for**: Buttons, labels, descriptions, menu items

#### 2. **Playfair Display** (Headings)
- **Purpose**: Elegant serif font for impactful headings
- **Weights**: Regular (400), SemiBold (600), Bold (700), ExtraBold (800), Black (900)
- **Best for**: Page titles, section headers, emphasis text

#### 3. **Cormorant Garamond** (Special Headings)
- **Purpose**: Sophisticated serif for restaurant branding
- **Weights**: Regular (400), SemiBold (600), Bold (700)
- **Best for**: Restaurant name, special announcements, elegant titles

#### 4. **Noto Naskh Arabic** (Kurdish/Arabic Text)
- **Purpose**: Professional Arabic script font for Kurdish and Arabic
- **Weights**: Regular (400), SemiBold (600), Bold (700)
- **Best for**: All Kurdish and Arabic text

---

## How to Use Fonts

### Import the fonts helper:
```typescript
import { fonts, getFontForLanguage } from '@/constants/colors';
```

### Available Font Constants:

```typescript
fonts.regular      // DM Sans Regular - for body text
fonts.medium       // DM Sans Medium - for emphasized text
fonts.semiBold     // Playfair Display SemiBold - for subheadings
fonts.bold         // Playfair Display Bold - for headings
fonts.extraBold    // Playfair Display ExtraBold - for strong emphasis
fonts.black        // Playfair Display Black - for maximum impact
fonts.heading      // Cormorant Garamond Bold - for elegant titles
fonts.arabic       // Noto Naskh Arabic SemiBold - for Kurdish/Arabic
fonts.arabicBold   // Noto Naskh Arabic Bold - for Kurdish/Arabic headings
```

---

## Font Usage Examples

### Example 1: Simple Text Style
```typescript
const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: Colors.gold,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.text,
  },
});
```

### Example 2: Language-Aware Font
```typescript
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontForLanguage } from '@/constants/colors';

function MyComponent() {
  const { language } = useLanguage();
  
  const styles = StyleSheet.create({
    title: {
      fontFamily: getFontForLanguage(language, 'bold'),
      fontSize: 24,
    },
    body: {
      fontFamily: getFontForLanguage(language, 'regular'),
      fontSize: 16,
    },
  });
  
  return (
    <View>
      <Text style={styles.title}>عنوان / Title / başlık</Text>
      <Text style={styles.body}>محتوى / Content / içerik</Text>
    </View>
  );
}
```

### Example 3: Kurdish Text with Proper Font
```typescript
const styles = StyleSheet.create({
  kurdishTitle: {
    fontFamily: fonts.arabicBold,    // Uses Noto Naskh Arabic Bold
    fontSize: 26,
    color: Colors.gold,
  },
  kurdishText: {
    fontFamily: fonts.arabic,         // Uses Noto Naskh Arabic SemiBold
    fontSize: 16,
    lineHeight: 24,
  },
});
```

---

## Font Combinations

### Combination 1: Elegant Restaurant Menu
```typescript
const styles = StyleSheet.create({
  restaurantName: {
    fontFamily: fonts.heading,       // Cormorant Garamond
    fontSize: 48,
    color: Colors.gold,
  },
  categoryTitle: {
    fontFamily: fonts.bold,          // Playfair Display
    fontSize: 28,
    color: Colors.primary,
  },
  itemName: {
    fontFamily: fonts.medium,        // DM Sans Medium
    fontSize: 18,
    color: Colors.text,
  },
  description: {
    fontFamily: fonts.regular,       // DM Sans Regular
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
```

### Combination 2: Modern Button Styles
```typescript
const styles = StyleSheet.create({
  primaryButton: {
    fontFamily: fonts.extraBold,     // Playfair Display ExtraBold
    fontSize: 20,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  secondaryButton: {
    fontFamily: fonts.medium,        // DM Sans Medium
    fontSize: 16,
    letterSpacing: 0.5,
    color: Colors.text,
  },
});
```

---

## Kurdish Font Best Practices

### ✅ DO:
- Use `fonts.arabic` or `fonts.arabicBold` for all Kurdish text
- Increase `lineHeight` by 1.4-1.6x for better readability
- Use larger font sizes (18-20px minimum) for Kurdish text
- Add proper letter spacing (0.5-1px)

### ❌ DON'T:
- Don't use Latin fonts for Kurdish text
- Don't make Kurdish text too small (< 16px)
- Don't forget to set `textAlign` for RTL languages

### Kurdish Text Example:
```typescript
const styles = StyleSheet.create({
  kurdishHeading: {
    fontFamily: fonts.arabicBold,
    fontSize: 32,
    lineHeight: 48,              // 1.5x font size
    letterSpacing: 1,
    textAlign: 'right',          // RTL alignment
    color: Colors.gold,
  },
  kurdishBody: {
    fontFamily: fonts.arabic,
    fontSize: 18,
    lineHeight: 28,              // 1.55x font size
    letterSpacing: 0.5,
    textAlign: 'right',
    color: Colors.text,
  },
});
```

---

## Platform Compatibility

The fonts automatically work across:
- ✅ **iOS**: Native font rendering
- ✅ **Android**: Native font rendering  
- ✅ **Web**: Google Fonts CDN (already configured)

---

## Testing Fonts

To see all fonts in action, visit the font preview page:
```typescript
router.push('/font-preview');
```

---

## Questions?

The font system is fully configured and ready to use. Just import `fonts` from `@/constants/colors` and apply them to your text styles!
