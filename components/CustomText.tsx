import { Text as RNText, TextProps } from 'react-native';
import { fonts } from '@/constants/colors';

interface CustomTextProps extends TextProps {
  variant?: 'regular' | 'bold' | 'medium' | 'semiBold';
}

export function Text({ variant = 'regular', style, ...props }: CustomTextProps) {
  const fontFamily = fonts[variant] || fonts.regular;
  const fontWeight = variant === 'bold' ? '700' as const : variant === 'semiBold' ? '600' as const : variant === 'medium' ? '500' as const : '400' as const;
  
  return (
    <RNText
      {...props}
      style={[
        { fontFamily, fontWeight },
        style,
      ]}
    />
  );
}
