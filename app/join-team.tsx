import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAM_STORAGE_KEY = 'teams_v1';

export default function JoinTeamPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть код');
      return;
    }
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      // Accept either exact team id or case-insensitive team name as code
      const team = list.find((t: any) => t.id === code.trim() || t.name.toLowerCase() === code.trim().toLowerCase());
      if (!team) {
        Alert.alert('Не знайдено', 'Команду з таким кодом не знайдено');
        return;
      }
      // Simulate joining: in a real app we'd call API / add membership
      Alert.alert('Успіх', `Ви приєдналися до команди "${team.name}"`, [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
    } catch (e) {
      console.error(e);
      Alert.alert('Помилка', 'Щось пішло не так');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Приєднатися за кодом</ThemedText>

      <Text style={styles.instruction}>Введіть код інвайту нижче</Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Код інвайту"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleJoin} disabled={isLoading}>
        <Text style={styles.primaryButtonText}>{isLoading ? '...' : 'Приєднатися'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ghostButton, { marginTop: 16 }]}
        onPress={() => Alert.alert('Заглушка', 'Сканування QR ще не реалізовано. Тут буде функція сканування QR-коду.')}
      >
        <Text style={styles.ghostButtonText}>Приєднатися за QR</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  instruction: { color: '#666', marginTop: 12, marginBottom: 8 },
  input: { height: 52, borderWidth: 1, borderColor: '#D0D7E6', borderRadius: 10, paddingHorizontal: 12, marginTop: 8 },
  primaryButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  ghostButton: { alignItems: 'center' },
  ghostButtonText: { color: '#007AFF', fontWeight: '600' },
});
