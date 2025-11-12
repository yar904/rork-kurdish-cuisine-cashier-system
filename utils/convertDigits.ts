export const convertDigits = {
  toEnglish: (input: string | number | undefined | null): string => {
    if (input === undefined || input === null) return "";
    const str = String(input);
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  },

  toArabic: (input: string | number | undefined | null): string => {
    if (input === undefined || input === null) return "";
    const str = String(input);
    return str.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d, 10)]);
  },
};

export const formatCurrency = (
  amount: number,
  language: "en" | "ku" | "ar" = "en"
): string => {
  const formatted = amount.toLocaleString("en-US");
  
  if (language === "ku" || language === "ar") {
    return convertDigits.toArabic(formatted);
  }
  
  return formatted;
};

export const formatCurrencyWithSymbol = (
  amount: number,
  language: "en" | "ku" | "ar" = "en",
  currency: string = "IQD"
): string => {
  const formatted = formatCurrency(amount, language);
  
  if (language === "ku") {
    return `${formatted} ${currency === "IQD" ? "دینار" : currency}`;
  } else if (language === "ar") {
    return `${formatted} ${currency === "IQD" ? "دینار" : currency}`;
  }
  
  return `${currency} ${formatted}`;
};
