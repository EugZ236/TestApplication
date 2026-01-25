import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TEAM_STORAGE_KEY = 'teams_v1';

export default function TeamsScreen() {
  const router = useRouter();
  const [teams, setTeams] = useState<Array<any>>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
    }, [])
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  async function saveTeams(list: any[]) {
    await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(list));
    setTeams(list);
  }

  function openMenu(team: any, x?: number, y?: number) {
    setSelectedTeam(team);
    setMenuVisible(true);
    if (typeof x === 'number' && typeof y === 'number') setMenuPos({ x, y });
  }

  function closeMenu() {
    setMenuVisible(false);
    setSelectedTeam(null);
    setMenuPos(null);
  }

  function openInfo() {
    setMenuVisible(false);
    setInfoVisible(true);
  }

  function openEdit() {
    // navigate to edit page
    setMenuVisible(false);
    if (selectedTeam) {
      AsyncStorage.setItem('edit_team_id', selectedTeam.id);
      router.push('/edit-team');
    }
  }

  async function confirmDelete(id: string) {
    Alert.alert('Видалити команду', 'Ви впевнені, що хочете видалити команду?', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          const newList = teams.filter((t) => t.id !== id);
          await saveTeams(newList);
          closeMenu();
        },
      },
    ]);
  }

  async function loadTeams() {
    const raw = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    setTeams(list);
  }

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Teams</ThemedText>
        <TouchableOpacity
          onPress={() => {
            setShowSearch((prev) => {
              const next = !prev;
              if (prev) setQuery('');
              return next;
            });
          }}
        >
          <IconSymbol name="magnifyingglass" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {showSearch ? (
        <TextInput value={query} onChangeText={setQuery} placeholder="Search teams" style={styles.searchInput} />
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.teamRow}
            onPress={async () => {
              try {
                await AsyncStorage.setItem('view_team_id', item.id);
              } catch (e) {
                console.error(e);
              }
              router.push('/team');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.teamIcon, { backgroundColor: item.color }]}>
              <Text style={styles.teamIconText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.teamName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.moreButton}
              onPressIn={(e) => {
                const { pageX, pageY } = e.nativeEvent;
                openMenu(item, pageX, pageY);
              }}
            >
              <IconSymbol name="ellipsis" size={18} color="#333" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nothing here. For now.</Text>
            <Text style={styles.emptySubtitle}>This is where you’ll find your teams.</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-team')}>
              <Text style={styles.createButtonText}>Create team</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={async () => { await AsyncStorage.setItem('create_context', 'fab'); router.push('/create-team'); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal visible={menuVisible} animationType="fade" transparent onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeMenu}>
          {menuPos ? (
            (() => {
              const { width } = require('react-native').Dimensions.get('window');
              const menuWidth = 160;
              // position menu to the left of the touch X so it doesn't overflow
              let left = Math.round(menuPos.x - menuWidth + 8);
              if (left < 8) left = 8;
              if (left + menuWidth > width - 8) left = width - menuWidth - 8;
              // small vertical offset so menu is centered relative to touch
              const top = Math.round(menuPos.y - 24);
              return (
                <View style={[styles.popoverContainer, { top, left, width: menuWidth }]}> 
                  <View style={styles.popoverCard}>
                    <Text style={styles.popoverTitle}>{selectedTeam?.name}</Text>
                    <TouchableOpacity style={styles.popoverRow} onPress={openInfo}>
                      <Text style={styles.popoverText}>Інформація</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popoverRow} onPress={openEdit}>
                      <Text style={styles.popoverText}>Редагувати</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popoverRow} onPress={() => confirmDelete(selectedTeam?.id)}>
                      <Text style={[styles.popoverText, { color: '#D9534F' }]}>Видалити</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()
          ) : null}
        </TouchableOpacity>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoVisible} animationType="slide" transparent={false} onRequestClose={() => setInfoVisible(false)}>
        <ThemedView style={{ flex: 1, padding: 20 }}>
          <ThemedText type="title">Інформація про команду</ThemedText>
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>{selectedTeam?.name}</Text>
            <Text style={{ color: '#666', marginTop: 8 }}>ID: {selectedTeam?.id}</Text>
            <Text style={{ color: '#666', marginTop: 8 }}>Колір: {selectedTeam?.color}</Text>
          </View>
          <View style={{ marginTop: 24 }}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.primaryButtonText}>Назад</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>

      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  searchInput: { height: 44, borderWidth: 1, borderColor: '#E6EDF6', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  teamRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F7FB', padding: 12, borderRadius: 12, marginBottom: 12 },
  teamIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamIconText: { color: '#fff', fontWeight: '700' },
  teamName: { fontSize: 16, fontWeight: '700', flex: 1 },
  moreButton: { padding: 8 },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontWeight: '700', fontSize: 18, marginBottom: 6 },
  emptySubtitle: { color: '#666', marginBottom: 16 },
  createButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  createButtonText: { color: '#fff', fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
  },
  popoverContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  popoverCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  popoverTitle: { fontWeight: '700', marginBottom: 6 },
  popoverRow: { paddingVertical: 8 },
  popoverText: { fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },
});


