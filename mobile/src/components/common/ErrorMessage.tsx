import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message: string;
  details?: string;
}

export default function ErrorMessage({ message, details }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ Error</Text>
      <Text style={styles.message}>{message}</Text>
      {details && (
        <Text style={styles.details}>{details}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
