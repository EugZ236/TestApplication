import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function BudgetPage() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Budget</ThemedText>
      <ThemedText style={{ marginTop: 12, color: '#666' }}>This page is empty for now.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
