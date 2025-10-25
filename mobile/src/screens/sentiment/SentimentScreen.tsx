import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SentimentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentiment Analysis</Text>
      <Text style={styles.subtitle}>AI-powered market sentiment insights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
