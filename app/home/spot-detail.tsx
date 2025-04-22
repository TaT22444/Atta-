import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SpotDetailScreen() {
  const { id, name, address } = useLocalSearchParams(); // パラメータからスポット情報を取得
  const navigation = useNavigation();
  const [isAttaEnabled, setIsAttaEnabled] = useState(true);

  // Atta!機能トグルの切り替え
  const toggleAtta = () => setIsAttaEnabled((previousState) => !previousState);

  // スポット削除処理
  const handleDeleteSpot = async () => {
    try {
      const savedSpots = await AsyncStorage.getItem('spots');
      const spots = savedSpots ? JSON.parse(savedSpots) : [];
      const updatedSpots = spots.filter((spot: any) => spot.id !== id);

      await AsyncStorage.setItem('spots', JSON.stringify(updatedSpots));
      Alert.alert('削除完了', 'スポットが削除されました。');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'スポットの削除中に問題が発生しました。');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.address}>{address}</Text>

      {/* Atta!機能のON/OFF */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Atta! 機能のオン・オフ</Text>
        <Switch value={isAttaEnabled} onValueChange={toggleAtta} />
      </View>

      {/* Google Mapsリンク */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => Alert.alert('Google Mapsを開きます', 'リンク機能は実装中です。')}
      >
        <Text style={styles.mapButtonText}>Google Mapsで開く</Text>
      </TouchableOpacity>

      {/* 削除ボタン */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSpot}>
        <Text style={styles.deleteButtonText}>スポットを削除</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  address: { fontSize: 16, color: '#666', marginBottom: 20 },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: { fontSize: 18 },
  mapButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  mapButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});
