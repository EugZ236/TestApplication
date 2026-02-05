import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet } from "react-native";

export default function QRScanPlaceholder() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Сканер QR</ThemedText>
      <ThemedText style={{ marginTop: 12, color: "#666" }}>
        Використовуйте вкладку «Сканер» (Explore) для сканування QR-кодів.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20 } });
