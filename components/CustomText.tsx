import { Text as RNText, TextProps } from 'react-native';
import { fonts } from '@/constants/colors';

interface CustomTextProps extends TextProps {
  variant?: 'regular' | 'bold' | 'medium' | 'semiBold';
}

export function Text({ variant = 'regular', style, ...props }: CustomTextProps) {
  const fontFamily = fonts[variant] || fonts.regular;
  const fontWeight = variant === 'bold' ? '900' as const : variant === 'semiBold' ? '800' as const : variant === 'medium' ? '700' as const : '600' as const;
  
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
