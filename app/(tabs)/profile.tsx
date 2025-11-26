import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.top}>
        <View style={styles.avatarBox}>
          {/* placeholder avatar */}
          <View style={[styles.avatar, { backgroundColor: '#DCEEFF' }]} />
        </View>
        <ThemedText type="title" style={styles.name}>{user?.name || 'No name'}</ThemedText>
        <ThemedText type="subtitle" style={styles.username}>{user?.email ? `@${user.email.split('@')[0]}` : ''}</ThemedText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 24 },
  top: { alignItems: 'center' },
  avatarBox: { height: 120, width: 120, borderRadius: 60, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  name: { marginTop: 12, fontSize: 18, fontWeight: '700' },
  username: { marginTop: 6, color: '#666' },
  actions: { marginTop: 32, width: '100%', paddingHorizontal: 20 },
  logoutButton: { backgroundColor: '#FF3B30', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
});
