import { useLanguage } from "@/contexts/LanguageContext";

export const useKurdishFont = () => {
  const { language } = useLanguage();
  const isKurdish = language === "ku";
  const isArabic = language === "ar";

  return {
    heading: isKurdish || isArabic ? "NaPecZTI-Bold" : "PlayfairDisplay_700Bold",
    regular: isKurdish || isArabic ? "DroidKufi-Regular" : "DMSans_400Regular",
    bold: isKurdish || isArabic ? "DroidKufi-Bold" : "DMSans_700Bold",
    medium: isKurdish || isArabic ? "DroidKufi-Bold" : "DMSans_500Medium",
  };
};
