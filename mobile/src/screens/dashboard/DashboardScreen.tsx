import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import Constants from 'expo-constants';
import { api } from '../../config/trpc';
import CryptoCard from '../../components/crypto/CryptoCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [tapCount, setTapCount] = React.useState(0);
  const tapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const { data, isLoading, error, refetch } = api.crypto.getTopCryptos.useQuery({ 
    limit: 50 
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Secret tap pattern to access developer/debug settings
  const handleTitleTap = React.useCallback(() => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Reset tap count after 2 seconds of inactivity
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);

    // Show developer menu after 7 taps
    if (newCount === 7) {
      setTapCount(0);
      
      // Get dynamic configuration
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'Unknown';
      const buildType = __DEV__ ? 'Debug' : 'Release';
      
      Alert.alert(
        'Developer Menu',
        'Developer/Debug features:\n\n' +
        `• App Version: ${appVersion}\n` +
        `• API URL: ${apiUrl}\n` +
        `• Build: ${buildType}\n\n` +
        'Note: This is a hidden menu for power users and administrators. ' +
        'Access it by tapping the title 7 times quickly.',
        [
          { text: 'Close', style: 'cancel' },
          { 
            text: 'View Logs', 
            onPress: () => Alert.alert('Logs', 'Log viewer would open here') 
          },
        ]
      );
    }
  }, [tapCount]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

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
        <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
          <Text style={styles.title}>Top Cryptocurrencies</Text>
          <Text style={styles.subtitle}>Real-time market data</Text>
        </TouchableOpacity>
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

