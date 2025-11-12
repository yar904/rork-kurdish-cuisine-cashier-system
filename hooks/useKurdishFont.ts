import { useLanguage } from "@/contexts/LanguageContext";

export const useKurdishFont = () => {
  const { language } = useLanguage();
  const isKurdish = language === "ku";
  const isArabic = language === "ar";

  return {
    heading: isKurdish || isArabic ? "NotoNaskhArabic_700Bold" : "PlayfairDisplay_700Bold",
    regular: isKurdish || isArabic ? "NotoNaskhArabic_400Regular" : "DMSans_400Regular",
    bold: isKurdish || isArabic ? "NotoNaskhArabic_700Bold" : "DMSans_700Bold",
    medium: isKurdish || isArabic ? "NotoNaskhArabic_600SemiBold" : "DMSans_500Medium",
  };
};
