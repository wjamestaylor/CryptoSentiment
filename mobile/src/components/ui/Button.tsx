import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyles.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={[styles.text, variantStyles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryContainer: {
    backgroundColor: '#10b981',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryContainer: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryText: {
    color: '#f1f5f9',
  },
  dangerContainer: {
    backgroundColor: '#ef4444',
  },
  dangerText: {
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.5,
  },
});
