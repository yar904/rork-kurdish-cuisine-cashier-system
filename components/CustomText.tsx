import { Text as RNText, TextProps } from 'react-native';
import { fonts } from '@/constants/colors';

interface CustomTextProps extends TextProps {
  variant?: 'regular' | 'bold' | 'medium' | 'semiBold';
}

export function Text({ variant = 'regular', style, ...props }: CustomTextProps) {
  const fontFamily = fonts[variant] || fonts.regular;
  
  return (
    <RNText
      {...props}
      style={[
        { fontFamily },
        style,
      ]}
    />
  );
}
