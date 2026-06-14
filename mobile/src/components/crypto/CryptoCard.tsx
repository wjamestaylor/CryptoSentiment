import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CryptoCardProps {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  image?: string;
  onPress?: () => void;
}

export default function CryptoCard({
  name,
  symbol,
  price,
  change24h,
  onPress,
}: CryptoCardProps) {
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.symbol}>{symbol.toUpperCase()}</Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.price}>${price.toLocaleString()}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {isPositive ? '+' : ''}{change24h.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  leftSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 14,
    color: '#94a3b8',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: '500',
  },
});
