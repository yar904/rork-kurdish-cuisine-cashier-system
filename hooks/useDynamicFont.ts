import { useLanguage } from "@/contexts/LanguageContext";

export const useDynamicFont = () => {
  const { language } = useLanguage();
  const isRTL = language === "ku" || language === "ar";

  return {
    direction: isRTL ? ("rtl" as const) : ("ltr" as const),
    regular: isRTL ? "NotoNaskhArabic_400Regular" : "DMSans_400Regular",
    medium: isRTL ? "NotoNaskhArabic_600SemiBold" : "DMSans_500Medium",
    bold: isRTL ? "NotoNaskhArabic_700Bold" : "DMSans_700Bold",
    heading: isRTL ? "NotoNaskhArabic_700Bold" : "PlayfairDisplay_700Bold",
    headingExtraBold: isRTL ? "NotoNaskhArabic_700Bold" : "PlayfairDisplay_800ExtraBold",
    headingBlack: isRTL ? "NotoNaskhArabic_700Bold" : "PlayfairDisplay_900Black",
    fallback: isRTL ? "sans-serif-arabic" : "sans-serif",
    isRTL,
  };
};
