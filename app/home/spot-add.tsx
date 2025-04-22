import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';

export default function AddSpotScreen() {
  const [spotLink, setSpotLink] = useState(''); // Google Mapsリンク
  const navigation = useNavigation();

  // スポット登録処理
  const handleAddSpot = async () => {
    try {
      // Google Mapsのリンク解析（簡易的に緯度・経度を抽出する仮の処理）
      const parsedData = parseGoogleMapsLink(spotLink);
      if (!parsedData) {
        Alert.alert('エラー', '無効なGoogle Mapsリンクです。');
        return;
      }

      // 登録済みスポットの取得
      const savedSpots = await AsyncStorage.getItem('spots');
      const spots = savedSpots ? JSON.parse(savedSpots) : [];

      // 無料プランの3スポット制限
      if (spots.length >= 3) {
        Alert.alert('上限に達しました', '無料プランでは3つまでしか登録できません。');
        return;
      }

      const newSpot = {
        id: Date.now().toString(),
        name: parsedData.name,
        address: parsedData.address,
        latitude: parsedData.latitude,
        longitude: parsedData.longitude,
      };

      const updatedSpots = [...spots, newSpot];
      await AsyncStorage.setItem('spots', JSON.stringify(updatedSpots));
      Alert.alert('成功', 'スポットが登録されました！');

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'スポットの登録中に問題が発生しました。');
    }
  };

  // Google Mapsリンクを解析してデータを取得（仮の関数）
  const parseGoogleMapsLink = (link: string) => {
    // シンプルな解析（本番では正確なパースが必要）
    if (!link.includes('google.com/maps')) return null;

    return {
      name: 'スターバックス渋谷駅前店', // 仮のデータ
      address: '東京都渋谷区3-4-3 渋谷タワー3階',
      latitude: 35.659, // 仮の緯度
      longitude: 139.702, // 仮の経度
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>スポットを追加</Text>
      <TextInput
        style={styles.input}
        placeholder="Google Mapsリンクを貼り付け"
        value={spotLink}
        onChangeText={setSpotLink}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddSpot}>
        <Text style={styles.buttonText}>スポットを登録</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
