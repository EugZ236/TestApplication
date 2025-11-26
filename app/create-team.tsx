import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAM_STORAGE_KEY = 'teams_v1';

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7FB3FF');
  const [isSaving, setIsSaving] = useState(false);
  const [createContext, setCreateContext] = useState<'post_signup' | 'fab' | null>(null);

  const presetColors = ['#7FB3FF', '#FFC37F', '#B6E3B6', '#F7A6D0', '#D0C8FF'];

  async function saveTeam() {
    if (!name.trim()) {
      alert('Будь ласка, введіть назву команди');
      return;
    }

    setIsSaving(true);
    try {
      const existing = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      const teams = existing ? JSON.parse(existing) : [];
      const newTeam = {
        id: `team_${Date.now()}`,
        name: name.trim(),
        color,
      };
      teams.unshift(newTeam);
      await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams));
      // clear transient context and navigate
      try { await AsyncStorage.removeItem('create_context'); } catch (e) {}
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
      alert('Не вдалося зберегти команду');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ctx = await AsyncStorage.getItem('create_context');
        if (!mounted) return;
        if (ctx === 'post_signup') setCreateContext('post_signup');
        else setCreateContext('fab');
      } catch (e) {
        if (!mounted) return;
        setCreateContext('fab');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Create teams</ThemedText>

      <View style={styles.form}>
        <Text style={styles.label}>Team photo</Text>
        <View style={styles.avatarPlaceholder}>
          <View style={[styles.avatar, { backgroundColor: color }]} />
        </View>

        <Text style={styles.label}>Team name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Family"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Icon color</Text>
        <View style={styles.colorRow}>
          {presetColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c, borderWidth: c === color ? 2 : 0 }]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryButton, isSaving && { opacity: 0.6 }]} onPress={saveTeam} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={async () => {
              try { await AsyncStorage.removeItem('create_context'); } catch (e) {}
              if (createContext === 'post_signup') {
                router.replace('/(tabs)');
              } else {
                router.back();
              }
            }}
          >
            <Text style={styles.ghostButtonText}>{createContext === 'post_signup' ? 'Skip' : 'Back'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  form: { marginTop: 16 },
  label: { color: '#222', marginBottom: 8 },
  avatarPlaceholder: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D0D7E6',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20 },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  ghostButton: { marginTop: 8, alignItems: 'center' },
  ghostButtonText: { color: '#007AFF', fontWeight: '600' },
});
