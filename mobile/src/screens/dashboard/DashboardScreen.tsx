import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../config/trpc';

export default function DashboardScreen() {
  // Example tRPC query
  const { data, isLoading, error } = api.crypto.getTopCryptos.useQuery({ limit: 10 });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to CryptoSentiment</Text>
      </View>

      <View style={styles.content}>
        {isLoading && (
          <Text style={styles.loadingText}>Loading market data...</Text>
        )}

        {error && (
          <Text style={styles.errorText}>Error loading data</Text>
        )}

        {data && (
          <View>
            <Text style={styles.sectionTitle}>Top Cryptocurrencies</Text>
            {/* Crypto list would go here */}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 32,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 32,
  },
});
