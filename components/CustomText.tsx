import { Text as RNText, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  variant?: 'regular' | 'bold';
}

export function Text({ variant = 'regular', style, ...props }: CustomTextProps) {
  const fontFamily = variant === 'bold' ? 'PeshangDes5-Bold' : 'PeshangDes5-Regular';
  
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
