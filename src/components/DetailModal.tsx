import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface Spot {
  id: string;
  name: string;
  address: string;
  image: string;
  isEnabled: boolean;
  originalLink: string; // Google Mapsのリンク
}

interface DetailModalProps {
  spot: Spot | null;
  distance: number | null; // 距離を受け取る
  toggleSpotSwitch: (id: string) => void;
  removeSpotFromState: (id: string) => void; // ローカル状態更新用
}

const DetailModal: React.FC<DetailModalProps> = ({
  spot,
  toggleSpotSwitch,
  distance,
  removeSpotFromState,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [backgroundOpacity] = useState(new Animated.Value(0)); // 背景の透明度
  const [isProcessing, setIsProcessing] = useState(false); // 操作中フラグ

  useEffect(() => {
    if (spot) {
      setIsVisible(true);
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [spot]);

  if (!spot) return null;

  const closeModal = () => {
    if (isProcessing) return; // 操作中はモーダルを閉じさせない
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  };

  const toggleSpotInFirebase = async () => {
    if (!spot) return;

    const updatedValue = !spot.isEnabled;
    try {
      const spotRef = doc(db, "spots", spot.id);
      await updateDoc(spotRef, { isEnabled: updatedValue }); // Firestore に直接反映
      Alert.alert("成功", "状態を更新しました。");
    } catch (error) {
      console.error("Firebase更新エラー:", error);
      Alert.alert("エラー", "スポットの状態を更新できませんでした。");
    }
  };

  const deleteSpotFromFirebase = async () => {
    if (!spot) return;

    Alert.alert(
      '確認',
      `${spot.name}を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true); // 操作中フラグをオン
            try {
              const spotRef = doc(db, 'spots', spot.id);
              await deleteDoc(spotRef); // Firestore から直接削除
              closeModal(); // モーダルを閉じる
              Alert.alert('成功', 'スポットが削除されました。');
              removeSpotFromState(spot.id); // ローカル状態から削除
            } catch (error) {
              console.error('Firebase削除エラー:', error);
              Alert.alert('エラー', 'スポットを削除できませんでした。');
            } finally {
              setIsProcessing(false); // 操作中フラグをオフ
            }
          },
        },
      ]
    );
  };

  const openGoogleMaps = () => {
    if (spot.originalLink) {
      Linking.openURL(spot.originalLink).catch(err => {
        console.error('Google Mapsリンクエラー:', err);
        Alert.alert('エラー', 'Google Mapsを開けませんでした。');
      });
    } else {
      Alert.alert('エラー', 'リンクが無効です。');
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View style={{ flex: 1 }}>
        {/* 背景をタップで閉じる */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalBackground,
              { opacity: backgroundOpacity }, // アニメーションの透明度
            ]}
          />
        </TouchableWithoutFeedback>

        {/* モーダル本体 */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: backgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0], // モーダルが下からスライドイン
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{spot.name}</Text>
          </View>
          <ScrollView>
            <Image source={{ uri: spot.image }} style={styles.detailImage} />
            <View style={styles.attaInfoList}>
              <View style={styles.switchContainer}>
                <Text>Atta! 機能のオン・オフ</Text>
                <Switch
                  value={spot.isEnabled}
                  onValueChange={toggleSpotInFirebase}
                />
              </View>
              <View style={styles.attaInfoItem}>
                <Ionicons name="location" size={16} color="#66666d" />
                <Text style={styles.detailAddress}>{spot.address}</Text>
              </View>
              <View style={styles.attaInfoItem}>
                <Ionicons name="location" size={16} color="#66666d" />
                <Text style={styles.detailAddress}>
                  {distance !== null ? `ここから ${distance.toFixed(1)} m` : '距離を取得できません'}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.attaInfoItemBtns}>
            <TouchableOpacity onPress={openGoogleMaps} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Google Mapsで見る</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteSpotFromFirebase} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>登録削除</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: -1,
  },
  modalContent: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold',},
  attaInfoList: {
    gap: 8,
    paddingBottom: 64,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderColor: '#dadae3',
    borderWidth: 1,
    // shadowColor: '#252528',
    // shadowOpacity: 0.15,
    // shadowRadius: 2,
    // shadowOffset: { width: 0, height: 0 },
    // elevation: 2,
  },
  detailImage: { 
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 16, 
    marginTop: 8,
    borderColor: '#dadae3',
    borderWidth: 1,
  },
  attaInfoItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dadae3'
    // shadowColor: '#252528',
    // shadowOpacity: 0.15,
    // shadowRadius: 2,
    // shadowOffset: { width: 0, height: 0 },
    // elevation: 2,
  },
  detailAddress: { 
    fontSize: 12,
    color: '#66666d' 
  },
  attaInfoItemBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  linkButton: {
    flex: 1,
    borderColor: '#0060C8',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  linkButtonText: { color: '#0060C8', fontWeight: '500' },
  deleteButton: {
    borderColor: '#f44336',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#f44336', fontWeight: '500' },
  closeButton: {
    position: 'absolute',
    left: 0,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderColor: '#66666d'
  },
  closeButtonText: { 
    color: '#66666d', 
    fontWeight: '500' ,
    fontSize: 12
  },
});

export default DetailModal;
