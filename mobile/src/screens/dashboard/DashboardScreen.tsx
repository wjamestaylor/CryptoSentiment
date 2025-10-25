import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../config/trpc';
import CryptoCard from '../../components/crypto/CryptoCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  
  const { data, isLoading, error, refetch } = api.crypto.getTopCryptos.useQuery({ 
    limit: 50 
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load market data" 
        details={error.message}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#10b981"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Top Cryptocurrencies</Text>
        <Text style={styles.subtitle}>Real-time market data</Text>
      </View>

      <View style={styles.content}>
        {data?.data?.map((crypto: any) => (
          <CryptoCard
            key={crypto.id}
            id={crypto.id}
            name={crypto.name}
            symbol={crypto.symbol}
            price={crypto.current_price}
            change24h={crypto.price_change_percentage_24h || 0}
          />
        ))}
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
    padding: 16,
  },
});

