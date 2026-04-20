// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { showToast } from "@/utils/toast";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import React, { useEffect, useState } from "react";
// import {
//   Alert,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const BUDGET_KEY = "budget_v1";

// const currencySymbols: Record<string, string> = {
//   UAH: "₴",
//   USD: "$",
//   EUR: "€",
// };

// export default function BudgetPage() {
//   const [budget, setBudget] = useState<{
//     amount: number;
//     currency: string;
//   } | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [amountInput, setAmountInput] = useState("");
//   const [currency, setCurrency] = useState<"UAH" | "USD" | "EUR">("UAH");

//   useEffect(() => {
//     (async () => {
//       try {
//         const raw = await AsyncStorage.getItem(BUDGET_KEY);
//         if (raw) setBudget(JSON.parse(raw));
//       } catch (e) {
//         console.error(e);
//       }
//     })();
//   }, []);

//   async function saveBudget() {
//     const value = parseFloat(amountInput.replace(",", "."));
//     if (isNaN(value) || value <= 0) {
//       showToast.error("Неправильна сума", "Введіть коректну суму бюджету");
//       return;
//     }
//     const newBudget = { amount: value, currency };
//     try {
//       await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(newBudget));
//       setBudget(newBudget);
//       setModalVisible(false);
//     } catch (e) {
//       console.error(e);
//       showToast.error("Помилка", "Не вдалося зберегти бюджет");
//     }
//   }

//   async function clearBudget() {
//     try {
//       await AsyncStorage.removeItem(BUDGET_KEY);
//       setBudget(null);
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   function openCreate() {
//     setAmountInput(budget ? String(budget.amount) : "");
//     setCurrency(budget ? (budget.currency as any) : "UAH");
//     setModalVisible(true);
//   }

//   function formatAmount(amount: number) {
//     return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
//   }

//   return (
//     <ThemedView style={styles.container}>
//       {!budget ? (
//         <View style={styles.emptyArea}>
//           <TouchableOpacity style={styles.bigAdd} onPress={openCreate}>
//             <Text style={styles.bigPlus}>+</Text>
//             <Text style={styles.bigAddText}>Внести бюджет</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <View style={styles.chartArea}>
//           <View style={styles.chartWrapper}>
//             <View
//               style={[
//                 styles.donut,
//                 {
//                   borderColor:
//                     currency === "UAH"
//                       ? "#2F80ED"
//                       : currency === "USD"
//                         ? "#27AE60"
//                         : "#9B51E0",
//                 },
//               ]}
//             >
//               <View style={styles.donutInner}>
//                 <Text style={styles.amountText}>
//                   {currencySymbols[budget.currency]}
//                   {formatAmount(budget.amount)}
//                 </Text>
//               </View>
//             </View>
//             <TouchableOpacity style={styles.editButton} onPress={openCreate}>
//               <Text style={styles.editIcon}>✎</Text>
//             </TouchableOpacity>
//           </View>
//           <TouchableOpacity
//             style={styles.clearButton}
//             onPress={() => {
//               Alert.alert("Видалити бюджет", "Ви впевнені?", [
//                 { text: "Скасувати", style: "cancel" },
//                 {
//                   text: "Видалити",
//                   style: "destructive",
//                   onPress: clearBudget,
//                 },
//               ]);
//             }}
//           >
//             <Text style={{ color: "#D9534F" }}>Видалити бюджет</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <Modal visible={modalVisible} animationType="slide" transparent>
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={styles.modalBackdrop}
//         >
//           <View style={styles.modalCard}>
//             <ThemedText type="title">
//               {budget ? "Редагувати бюджет" : "Внести бюджет"}
//             </ThemedText>

//             <Text style={styles.label}>Сума</Text>
//             <TextInput
//               value={amountInput}
//               onChangeText={setAmountInput}
//               placeholder="1000"
//               keyboardType="numeric"
//               style={styles.input}
//             />

//             <Text style={[styles.label, { marginTop: 12 }]}>Валюта</Text>
//             <View style={styles.currencyRow}>
//               {(["UAH", "USD", "EUR"] as const).map((c) => (
//                 <TouchableOpacity
//                   key={c}
//                   style={[
//                     styles.currencyBtn,
//                     currency === c ? styles.currencySelected : null,
//                   ]}
//                   onPress={() => setCurrency(c)}
//                 >
//                   <Text
//                     style={
//                       currency === c
//                         ? styles.currencyTextSelected
//                         : styles.currencyText
//                     }
//                   >
//                     {currencySymbols[c]}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.primaryButton}
//                 onPress={saveBudget}
//               >
//                 <Text style={styles.primaryButtonText}>
//                   {budget ? "Зберегти" : "Внести"}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.ghostButton}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={styles.ghostButtonText}>Назад</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, alignItems: "center" },
//   emptyArea: { flex: 1, justifyContent: "center", alignItems: "center" },
//   bigAdd: { alignItems: "center", justifyContent: "center" },
//   bigPlus: {
//     fontSize: 56,
//     color: "#fff",
//     backgroundColor: "#007AFF",
//     width: 120,
//     height: 120,
//     textAlign: "center",
//     lineHeight: 120,
//     borderRadius: 60,
//   },
//   bigAddText: { marginTop: 12, fontSize: 18, fontWeight: "700" },
//   chartArea: { flex: 1, justifyContent: "center", alignItems: "center" },
//   chartWrapper: { alignItems: "center", justifyContent: "center" },
//   donut: {
//     width: 220,
//     height: 220,
//     borderRadius: 110,
//     borderWidth: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   donutInner: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   amountText: { fontSize: 20, fontWeight: "700" },
//   editButton: {
//     position: "absolute",
//     right: -8,
//     top: -8,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 3,
//   },
//   editIcon: { fontSize: 18 },
//   clearButton: { marginTop: 18 },

//   modalBackdrop: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0,0,0,0.3)",
//   },
//   modalCard: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//   },
//   label: { color: "#666", marginTop: 12 },
//   input: {
//     height: 48,
//     borderWidth: 1,
//     borderColor: "#E6EDF6",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginTop: 8,
//   },
//   currencyRow: { flexDirection: "row", marginTop: 8, gap: 12 },
//   currencyBtn: {
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#E6EDF6",
//     minWidth: 64,
//     alignItems: "center",
//   },
//   currencySelected: { borderColor: "#007AFF", backgroundColor: "#EAF4FF" },
//   currencyText: { fontSize: 18 },
//   currencyTextSelected: { fontSize: 18, fontWeight: "700", color: "#007AFF" },
//   modalActions: { marginTop: 20 },
//   primaryButton: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 12,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   primaryButtonText: { color: "#fff", fontWeight: "700" },
//   ghostButton: { marginTop: 8, alignItems: "center" },
//   ghostButtonText: { color: "#007AFF", fontWeight: "700" },
// });
