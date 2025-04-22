import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
  AppState
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
const GOOGLE_MAPS_API_KEY = 'AIzaSyAy0m4eC_DwrwW4x8mouclfTMsqdMsElec';
// const GOOGLE_MAPS_API_KEY = Constants.manifest.extra.googleMapsApiKey;
import * as Location from 'expo-location';
console.log('Google Maps API Key:', GOOGLE_MAPS_API_KEY);
import { fetchSpotsRealtime, addSpot, deleteSpot, updateSpot, loadSpotsFromCache, saveSpotsToCache } from '../../firebaseService';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'; // Firebase 設定ファイルをインポート

import DetailModal from '../../src/components/DetailModal';
import PremiumModal from '../../src/components/PremiumModal';


const R = 6371000; // 地球の半径 (メートル)

const MAX_FREE_SPOTS = 1; // 無料プランでの最大登録数

interface Spot {
  nextLevelTime: number;
  status: string;
  progress: number;
  timeSpent: number;
  firestoreId: string; // FirestoreドキュメントID
  id: string; // その他のユニークなID (必要なら)
  name: string;
  userId: string[]; // ユーザーIDを追加
  address: string;
  image: string;
  latitude: number; // 緯度
  longitude: number; // 経度
  isEnabled: boolean;
  originalLink: string;
}

const LEVEL_THRESHOLDS = [
  { name: '気になり人', times: 1 }, // 次のレベルまで1分
  { name: 'お試し組', times: 3 }, // 次のレベルまで60分（1時間）
  { name: 'リピーター', times: 10 }, // 次のレベルまで150分（2時間30分）
  { name: '常連', times: 20 }, // 次のレベルまで3000分（50時間）
  { name: 'マスター', times: 50 }, // 次のレベルまで6000分（100時間）
  { name: 'スーパーマスター', times: 150 }, // 次のレベルまで12000分（200時間）
  { name: '伝説のマスター', times: 450 }, // 次のレベルまで24000分（400時間）
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ListScreen() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);
  const [attaEnabled, setAttaEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputLink, setInputLink] = useState('');
  const [addressInput, setAddressInput] = useState(''); // 新しい住所入力用
  const [geoResult, setGeoResult] = useState(''); // 緯度経度の結果を表示するための状態
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [backgroundOpacity] = useState(new Animated.Value(0)); // 背景の透明度
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const remainingSpots = MAX_FREE_SPOTS - userSpots.length; // 残り登録回数
  const [isPremiumVisible, setPremiumModalVisible] = useState(false);

  // グラデーション付きテキストコンポーネント
const GradientText = ({ text, style }: { text: string; style: any }) => {
  return (
    <Svg height="20" width={`74%`}>
      <Defs>
        <SvgLinearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradient)"
        fontSize="14"
        fontWeight="bold"
        x="0"
        y="16"
        textAnchor="start"
        // style={style}
      >
        {text}
      </SvgText>
    </Svg>
  );
};

useEffect(() => {
  let locationSubscription: Location.LocationSubscription | null = null;

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('位置情報エラー', '位置情報の使用が許可されていません。');
      return;
    }

    locationSubscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      async (loc) => {
        const { latitude, longitude } = loc.coords;

        userSpots.forEach(async (spot) => {
          const distance = calculateDistance(latitude, longitude, spot.latitude, spot.longitude);

          const userId = auth.currentUser?.uid;
          if (!userId) return;

          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);

          const spotData = userDoc.data()?.spots?.[spot.firestoreId] || {};
          const isWithinRange = spotData.isWithinRange || false; // 現在の状態

          if (distance <= 50 && !isWithinRange) {
            // 50m以内に入った場合（状態が変化したときのみ更新）
            await updateDoc(userRef, {
              [`spots.${spot.firestoreId}.entryCount`]: (spotData.entryCount || 0) + 1,
              [`spots.${spot.firestoreId}.isWithinRange`]: true, // 状態を更新
            });
          } else if (distance > 50 && isWithinRange) {
            // 50m外に出た場合にリセット
            await updateDoc(userRef, {
              [`spots.${spot.firestoreId}.isWithinRange`]: false, // 状態をリセット
            });
          }
        });
      }
    );
  };

  startLocationTracking();

  return () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
}, [userSpots]);


useEffect(() => {
  const fetchEntryCount = async () => {
    if (selectedSpot) {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        const entryCount = userDoc.data()?.spots?.[selectedSpot.firestoreId]?.entryCount || 0;
        setSelectedSpot({ ...selectedSpot, entryCount });
      }
    }
  };

  fetchEntryCount();
}, [selectedSpot]);



useEffect(() => {
  const loadSpots = async () => {
    try {
      const savedUserSpots = await AsyncStorage.getItem('userSpots');
      if (!savedUserSpots) {
        // 初期化されていない場合は処理を終了
        console.warn('登録された店舗データが見つかりません');
        return;
      }
      const parsedSpots: Spot[] = JSON.parse(savedUserSpots);
  
      // 妥当性チェックしてエラーがあれば除外しつつ初期値を設定
      const validSpots = parsedSpots.map((spot) => {
        const isValid =
          typeof spot.latitude === 'number' &&
          typeof spot.longitude === 'number' &&
          spot.latitude >= -90 &&
          spot.latitude <= 90 &&
          spot.longitude >= -180 &&
          spot.longitude <= 180;
  
        if (!isValid) {
          console.error('無効なデータを検出:', spot);
          return null; // 無効なデータを除外
        }
  
        // 初期値を設定
        return {
          ...spot,
          status: spot.status || '気になり人', // 初期ステータス
          timeSpent: spot.timeSpent || 0, // 初期滞在時間
          progress: spot.progress || 0, // 初期進捗バー
        };
      }).filter((spot) => spot !== null); // nullを除外
  
      setUserSpots(validSpots as Spot[]);
      console.log('有効な店舗データ:', validSpots);
    } catch (error) {
      console.error('店舗データのロード中にエラーが発生:', error);
      Alert.alert('エラー', '店舗データのロードに失敗しました。');
    }
  };  

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報へのアクセスが許可されていません。');
        console.error('位置情報のアクセス権限が拒否されました');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      console.log('現在地:', loc.coords);
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error('現在地の取得中にエラーが発生:', error);
      Alert.alert('エラー', '現在地の取得に失敗しました。');
    }
  };

  loadSpots();
  getLocation();
}, []);

  const fetchGeocode = async () => {
    if (!addressInput) {
      Alert.alert('エラー', '住所を入力してください。');
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key が未設定です');
      Alert.alert('エラー', 'Google Maps API Key が設定されていません。');
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: addressInput,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );
      if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        const latLng = `緯度: ${location.lat}, 経度: ${location.lng}`;
        console.log('Geocode結果:', latLng);
        setGeoResult(latLng);
        Alert.alert('成功', latLng);
      } else {
        console.error('Geocodeエラー:', response.data);
        Alert.alert('エラー', '住所から緯度経度を取得できませんでした。');
      }
    } catch (error) {
      console.error('fetchGeocodeエラー:', error);
      Alert.alert('エラー', 'APIリクエスト中に問題が発生しました。');
    }
  };

  // Atta! スイッチの切り替え
  const toggleAttaSwitch = () => {
    setAttaEnabled((previousState) => !previousState);
  };

  // スポットスイッチの切り替え
  const toggleSpotSwitch = (id: string) => {
    setUserSpots((prevSpots) =>
      prevSpots.map((spot) =>
        spot.id === id ? { ...spot, isEnabled: !spot.isEnabled } : spot
      )
    );
  };

  const expandShortUrl = async (shortUrl: string): Promise<string | null> => {
    try {
      console.log(`短縮URLを展開中: ${shortUrl}`);
      const response = await axios.get(shortUrl, { maxRedirects: 0 });
      console.log(`展開されたURL: ${response.request.responseURL}`);
      return response.request.responseURL || null;
    } catch (error: any) {
      if (error.response && error.response.status === 301) {
        console.log(`リダイレクト先URL: ${error.response.headers.location}`);
        return error.response.headers.location || null;
      }
      console.error('短縮URL展開エラー:', error);
      return null;
    }
  };

  const resolvePlaceId = async (url: string): Promise<string | null> => {
    const expandedUrl = await expandShortUrl(url);
    if (!expandedUrl) {
      console.error('短縮URLの展開に失敗しました。');
      Alert.alert('エラー', 'リンクの展開に失敗しました。');
      return null;
    }
  
    console.log(`展開後のURL: ${expandedUrl}`);
  
    // URLから住所または店舗名を抽出する（簡略化の例）
    const queryMatch = expandedUrl.match(/maps\?q=([^&]+)/);
    const query = queryMatch ? decodeURIComponent(queryMatch[1]) : expandedUrl;
  
    console.log(`APIに渡す検索クエリ: ${query}`);
  
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`,
        {
          params: {
            input: query,
            inputtype: 'textquery',
            fields: 'place_id',
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );
  
      if (response.data.candidates && response.data.candidates.length > 0) {
        const placeId = response.data.candidates[0].place_id;
        console.log(`APIで取得されたplace_id: ${placeId}`);
        return placeId;
      } else {
        console.error('APIからplace_idを取得できませんでした。レスポンス:', response.data);
        Alert.alert('エラー', '有効な店舗情報が見つかりませんでした。');
        return null;
      }
    } catch (error) {
      console.error('place_id取得エラー:', error);
      Alert.alert('エラー', 'place_idの取得に失敗しました。');
      return null;
    }
  };  

  useEffect(() => {
    const fetchSpotsFromFirestore = async () => {
      try {
        const userId = auth.currentUser?.uid; // 現在のユーザーIDを取得
        if (!userId) {
          Alert.alert('エラー', 'ログイン情報が見つかりません。');
          return;
        }
  
        const querySnapshot = await getDocs(collection(db, 'spots'));
  
        // ユーザーIDが一致するデータのみ取得し、FirestoreのIDを含める
        const spotsData: Spot[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              ...data,
              firestoreId: doc.id,
            } as Spot;
          })
          .filter((spot) => Array.isArray(spot.userId) && spot.userId.includes(userId));
  
        // ローカル状態とAsyncStorageに保存
        setUserSpots(spotsData);
        await AsyncStorage.setItem('userSpots', JSON.stringify(spotsData));
  
        console.log('Firestoreから取得したデータ:', spotsData);
      } catch (error) {
        console.error('Firestoreからデータを取得中にエラー:', error);
        Alert.alert('エラー', 'データの取得中に問題が発生しました。');
      }
    };
  
    fetchSpotsFromFirestore();
  }, []);  
  
  
  const addSpot = async (newSpot: Omit<Spot, 'id' | 'firestoreId' | 'status' | 'timeSpent'>) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('エラー', 'ログイン情報が見つかりません。');
        return;
      }
  
      // Firestoreにスポットデータを追加
      const docRef = await addDoc(collection(db, 'spots'), {
        ...newSpot,
        userId: [userId],
        status: '気になり人', // 初期ステータス
        timeSpent: 0, // 初期滞在時間
      });
  
      console.log('Firestore に保存されたドキュメント ID:', docRef.id);
  
      // ユーザーの`spots`フィールドに店舗データを追加
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
  
      const updatedSpotData = {
        [docRef.id]: {
          timeSpent: 0,
          status: '気になり人',
          progress: 0,
        },
      };
  
      if (userDoc.exists()) {
        const currentSpots = userDoc.data().spots || {};
        await updateDoc(userRef, {
          spots: { ...currentSpots, ...updatedSpotData },
        });
      } else {
        await setDoc(userRef, {
          spots: updatedSpotData,
        });
      }
  
      Alert.alert('成功', '新しいスポットが登録されました！');
    } catch (error) {
      console.error('スポットの追加中にエラー:', error);
      Alert.alert('エラー', 'スポットの追加に失敗しました。');
    }
  };
  
  
  const handleAddSpot = async () => {
    console.log(`入力されたリンク: ${inputLink}`);
    const expandedLink = await expandShortUrl(inputLink); // 短縮URLを展開
    if (!expandedLink) {
      Alert.alert('エラー', '有効なGoogle Mapsリンクを入力してください。');
      return;
    }
  
    console.log(`展開されたリンク: ${expandedLink}`);
    const userId = auth.currentUser?.uid; // 現在のユーザーIDを取得
    if (!userId) {
      Alert.alert('エラー', 'ログイン情報が見つかりません。');
      return;
    }
  
    try {
      // Firestoreでリンクを確認
      const spotsCollection = collection(db, 'spots');
      const querySnapshot = await getDocs(spotsCollection);
      const existingSpotDoc = querySnapshot.docs.find(
        (doc) => doc.data().originalLink === expandedLink
      );
  
      if (existingSpotDoc) {
        console.log('既存のスポットが見つかりました:', existingSpotDoc.id);
        const existingData = existingSpotDoc.data();
        const existingUserIds = Array.isArray(existingData.userId)
          ? existingData.userId
          : [];
  
        if (!existingUserIds.includes(userId)) {
          const updatedUserIds = [...existingUserIds, userId];
          await updateDoc(doc(db, 'spots', existingSpotDoc.id), {
            userId: updatedUserIds,
          });
  
          // **Firestoreのデータを再取得してローカル状態を更新**
          const updatedQuerySnapshot = await getDocs(collection(db, 'spots'));
          const updatedSpots = updatedQuerySnapshot.docs
            .map((doc) => ({ ...doc.data(), firestoreId: doc.id } as Spot))
            .filter((spot) => Array.isArray(spot.userId) && spot.userId.includes(userId));
  
          setUserSpots(updatedSpots);
  
          // **ユーザーのデータに登録**
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const currentRegisteredSpots = userDoc.data().registeredSpots || [];
            await updateDoc(userRef, {
              registeredSpots: [...currentRegisteredSpots, existingSpotDoc.id],
            });
          } else {
            await setDoc(userRef, {
              registeredSpots: [existingSpotDoc.id],
            });
          }
        }
  
        Alert.alert('成功', '既存のスポットが更新されました！');
        setInputLink('');
        setIsModalVisible(false);
        return;
      }
  
      console.log('新規スポットの登録を開始します');
      const placeId = await resolvePlaceId(expandedLink);
      if (!placeId) {
        Alert.alert('エラー', '有効なGoogle Mapsリンクを入力してください。');
        return;
      }
  
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,geometry,photos,types',
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );
  
      const result = response.data.result;
      if (!result) {
        Alert.alert('エラー', '店舗情報を取得できませんでした。');
        return;
      }
  
      const location = result.geometry.location;
      const newSpot = {
        name: result.name,
        address: result.formatted_address,
        image: result.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${result.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : 'https://via.placeholder.com/150',
        latitude: location.lat,
        longitude: location.lng,
        types: result.types || [],
        isEnabled: false,
        userId: [userId], // ユーザーIDを配列で保存
        originalLink: expandedLink,
      };
  
      // addSpot を利用してスポットを追加
      await addSpot(newSpot);
  
      setInputLink('');
      setIsModalVisible(false);
    } catch (error) {
      console.error('スポットの追加中にエラー:', error);
      Alert.alert('エラー', 'スポットの追加に失敗しました。');
    }
  };  
  
  const openDetailModal = async (spot: Spot) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('エラー', 'ログイン情報が見つかりません。');
        return;
      }
  
      // Firestoreからスポット情報を取得
      const spotRef = doc(db, 'spots', spot.firestoreId);
      const spotDoc = await getDoc(spotRef);
      const spotData = spotDoc.exists() ? spotDoc.data() : null;
  
      // Firestoreからユーザー固有のスポット情報を取得
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userSpotData =
        userDoc.exists() && userDoc.data()?.spots?.[spot.firestoreId]
          ? userDoc.data().spots[spot.firestoreId]
          : {};
  
      // `selectedSpot`にスポットデータとユーザー固有のデータを統合
      setSelectedSpot({
        ...spot,
        ...spotData,
        ...userSpotData,
      });
  
      setIsDetailModalVisible(true);
  
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('詳細モーダルのデータ取得中にエラー:', error);
      Alert.alert('エラー', '詳細情報の取得に失敗しました。');
    }
  };
  

  const closeDetailModal = () => {
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedSpot(null);
      setIsDetailModalVisible(false);
    });
  };
  
  const removeSpot = async (id: string) => {
  Alert.alert(
    '確認',
    '削除しても新しく登録できる店舗の数は増えませんが、本当に削除しますか？',
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('削除対象ID:', id);

            // 削除対象が存在するか確認
            const spotRef = doc(db, 'spots', id);
            const docSnapshot = await getDoc(spotRef);

            if (!docSnapshot.exists()) {
              console.error('削除対象のドキュメントが存在しません:', id);
              Alert.alert('エラー', '削除対象のデータが見つかりませんでした。');
              return;
            }

            // Firestore から削除
            await deleteDoc(spotRef);
            console.log('Firestore から削除成功');

            // ローカル状態を更新
            const updatedSpots = userSpots.filter((spot) => spot.id !== id);
            setUserSpots(updatedSpots);

            // AsyncStorage を更新
            await AsyncStorage.setItem('userSpots', JSON.stringify(updatedSpots));

            // モーダルを閉じる
            closeDetailModal();

            Alert.alert('成功', 'スポットが削除されました！');
          } catch (error) {
            console.error('Firestore の削除中にエラー:', error);
            Alert.alert('エラー', 'スポットの削除に失敗しました。');
          }
        },
      },
    ]
  );
};

  const renderSpotCard = ({ item }: { item: Spot }) => {
    const distance = currentLocation
      ? calculateDistance(currentLocation.latitude, currentLocation.longitude, item.latitude, item.longitude)
      : null;

      return (
        <TouchableOpacity key={item.firestoreId} style={styles.spotCard} onPress={() => openDetailModal(item)}>
        <Image source={{ uri: item.image }} style={styles.spotImage} />
        <View style={styles.spotInfo}>
          <Text style={styles.spotName}>{item.name}</Text>
          {/* <Text style={styles.spotSubText}>{item.address}</Text> */}
          {distance !== null && <Text style={styles.spotSubText}>ここから {distance.toFixed(1)}m</Text>}
        </View>
        <Switch
          value={item.isEnabled}
          onValueChange={() => toggleSpotSwitch(item.id)}
          thumbColor={item.isEnabled ? '#37BA8C' : '#f4f3f4'}
          trackColor={{ false: '#ddd', true: '#9CF8C7' }}
        />
      </TouchableOpacity>
      )
  };

  return (
    <ScrollView style={styles.container}>

      {/* <View style={styles.switchContainer}>
        <Text style={styles.switchTitle}>Atta! 機能オン・オフ</Text>
        <Switch
          value={attaEnabled}
          onValueChange={toggleAttaSwitch}
          thumbColor={attaEnabled ? '#37BA8C' : '#f4f3f4'}
          trackColor={{ false: '#ddd', true: '#9CF8C7' }}
        />
      </View>
      <Text style={styles.switchDescription}>
        オンにするとこの説明部分が入ります。
      </Text> */}

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Google Maps リンクを入力</Text>
            <TextInput
              style={styles.input}
              placeholder="https://goo.gl/maps/..."
              value={inputLink}
              onChangeText={setInputLink}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddSpot}>
              <Text style={styles.modalButtonText}>追加</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PremiumModal
        isVisible={isPremiumVisible}
        onClose={() => setPremiumModalVisible(false)}
      />

      <View style={styles.attaListContainer}>
        <View style={styles.attaListHeader}>
          <Text style={styles.sectionTitle}>あなた ({userSpots.length})</Text>
          <Ionicons name='ticket-outline' size={16} color={'#66666d'} />
          <Text style={styles.AttaLimit}>所持数: {remainingSpots}</Text>
          {/* <Text style={styles.AttaLimit}>登録可能回数: {remainingSpots}/{MAX_FREE_SPOTS}</Text> */}
        </View>
        <TouchableOpacity
  style={[
    styles.addButton,
    remainingSpots === 0 && styles.upgradeButton, // 登録不可時の特別なスタイル
  ]}
  onPress={() => {
    if (remainingSpots > 0) {
      setIsModalVisible(true)
    } else {
      setPremiumModalVisible(true)
    }
  }}
>
  <View style={styles.addButtonLeft}>
    <Ionicons
      name="add"
      size={20}
      color={remainingSpots > 0 ? "#252528" : "#6A0DAD"} // 登録不可時は蛍光紫
    />
    {remainingSpots > 0 ? (
      <Text style={styles.addButtonText}>登録</Text>
    ) : (
      <GradientText text="チケット購入 or アップグレード" style={styles.gradientText} />
    )}
  </View>
  {remainingSpots > 0 ? (
    <View style={{marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8}}>
      <Ionicons name='ticket-outline' size={16} color={'#66666d'} />
      <Text style={styles.addButtonLimitNumber}>-1</Text>
    </View>
  ) : (
    <Text style={styles.addButtonLimitNumber}>
      あと{remainingSpots > 0 ? remainingSpots : 0}回
    </Text>
  )}
  {/* <Text style={styles.addButtonLimitNumber}>
    あと{remainingSpots > 0 ? remainingSpots : 0}回
  </Text> */}
</TouchableOpacity>

        <FlatList
          style={styles.attaCardList}
          data={userSpots}
          keyExtractor={(item) => item.firestoreId || item.id}
          renderItem={renderSpotCard}
          scrollEnabled={false}
        />
        <Modal visible={isDetailModalVisible} transparent animationType="none" onRequestClose={closeDetailModal}>
          <View style={{ flex: 1 }}>
            {/* 黒い背景をフェードイン */}
            <TouchableWithoutFeedback onPress={closeDetailModal}>
             <Animated.View
               style={[
                 styles.modalBackground,
                 { opacity: backgroundOpacity }, // アニメーションの透明度を適用
               ]}
             />
           </TouchableWithoutFeedback>

           {/* モーダルの中身をスライドイン */}
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
             {selectedSpot && (
               <View>
                 <View style={styles.modalHeader}>
                   <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                     <Text style={styles.closeButtonText}>閉じる</Text>
                   </TouchableOpacity>
                   <Text style={styles.modalTitle}>{selectedSpot.name}</Text>
                 </View>
                 <ScrollView>
                 <Image source={{ uri: selectedSpot.image }} style={styles.detailImage} />
                 <View style={styles.attaInfoList}>
                   {/* <View style={styles.switchContainer}>
                     <Text>Atta! 機能のオン・オフ</Text>
                     <Switch
                       value={selectedSpot.isEnabled}
                       onValueChange={() => toggleSpotSwitch(selectedSpot.id)}
                     />
                   </View> */}
                   <View style={styles.attaStatusContent}>
                    <Text style={styles.attaStatusLabel}>あなたのステータス</Text> 
                    <View style={styles.attaStatusBox}>
                      <View style={styles.attaStatusNameWrapper}>
                        <Text style={styles.attaStatusName}>{selectedSpot.status}</Text>
                        {/* <Text style={styles.attaStatusName}>気になり人</Text> */}
                        <Text style={styles.attaStatusState}>
                        次のレベルまであと {LEVEL_THRESHOLDS.find(threshold => threshold.times > (selectedSpot?.entryCount || 0))?.times - (selectedSpot?.entryCount || 0)} Atta!
                      </Text>
                      </View>
                      <View style={styles.attaStatusBarWrapper}>
                      <View
                        style={[
                          styles.attaStatusBar,
                          { width: `${selectedSpot?.progress || 0}%` },
                        ]}
                      />
                      </View>
                    </View>
                    <View style={styles.attaStatusTimeWrapper}>
                      <Text style={styles.attaStatusTimeLabel}>Atta!</Text>
                      <Text style={styles.attaStatusTime}>
                        {selectedSpot?.entryCount || 0}回
                      </Text>
                    </View>
                    <Text style={styles.attaStatusText}>あなたがこの店舗の50m以内に来た際に、Atta!となります。</Text>
                   </View>
                   <View style={[styles.attaInfoItem]}>
                     <Ionicons name="location" size={16} color="#66666d" />
                     <Text style={styles.detailAddress}>{selectedSpot.address}</Text>
                   </View>
                   <View style={styles.attaInfoItem}>
                     <Ionicons name="location" size={16} color="#66666d" />
                     <Text style={styles.detailAddress}>ここから12km</Text>
                   </View>
                 </View>
                 </ScrollView>
                 <View style={styles.attaInfoItemBtns}>
                   <TouchableOpacity
                      onPress={() => {
                       if (selectedSpot.originalLink) {
                         Linking.openURL(selectedSpot.originalLink).catch((err) =>
                           Alert.alert('エラー', 'Google Mapsリンクを開けませんでした。')
                         );
                       } else {
                         Alert.alert('エラー', '正しいGoogle Mapsリンクが見つかりません。');
                       }
                     }}
                     style={styles.linkButton}
                   >
                      <Text style={styles.linkButtonText}>Google Mapsで見る</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => removeSpot(selectedSpot.id)} style={styles.deleteButton}>
                     <Text style={styles.deleteButtonText}>登録削除</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             )}
           </Animated.View>
         </View>
       </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingHorizontal: 16,},
  attaInfoList: {
    gap: 4,
    paddingBottom: 64,
    marginTop: 8,
  },
  attaStatusContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dadae3'
  },
  attaStatusLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d'
  },
  attaStatusBox: {
    marginTop: 16
  },
  attaStatusNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  attaStatusName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#252528'
  },
  attaStatusState: {
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d'
  },
  attaStatusBarWrapper: {
    width: `100%`,
    marginTop: 8,
    backgroundColor: '#dadae3',
    borderRadius: 100
  },
  attaStatusBar: {
    // flex: 1,
    width: `1%`,
    height: 6,
    borderRadius: 100,
    backgroundColor: '#37BA8C'
  },
  attaStatusTimeWrapper: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  attaStatusTimeLabel: {
    fontSize: 14,
    color: '#66666d',
    fontWeight: '400',
  },
  attaStatusTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#252528'
  },
  attaStatusText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d',
    marginTop: 8,
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
  },
  switchTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  switchDescription: { fontSize: 12, color: '#666' },
  attaListContainer: { 
    marginTop: 24,
  },
  attaListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  AttaLimit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66666d',
    marginLeft: 8,
    marginRight: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginRight: 'auto'},
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderColor: '#dadae3',
    borderWidth: 1,
  },
  upgradeButton: {
    borderColor: '#D09EFF', // 蛍光紫の枠線
    borderWidth: 1,
    shadowColor: '#A020F0',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  addButtonLeft: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 14, fontWeight: 'bold', color: '#252528' },
  addButtonLimitNumber: {
    fontSize: 14,
    fontWeight: '400',
    color: '#66666d',
  },
  gradientWrapper: {
    borderRadius: 16, // グラデーション背景用の角丸
    overflow: 'hidden', // テキストが角丸内に収まるようにする
  },
  // gradientBackground: {
  //   paddingHorizontal: 12,
  //   paddingVertical: 8,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // gradientText: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   textAlign: 'center',
  // },
  // gradientText: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#fff',
  // },
  attaCardList: {
    marginTop: 8,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
    // shadowColor: '#252528',
    // shadowOpacity: 0.15,
    // shadowRadius: 2,
    // shadowOffset: { width: 0, height: 0 },
    // elevation: 2,
    borderColor: '#dadae3',
    borderWidth: 1,
  },
  spotImage: { width: 50, height: 50, borderRadius: 10, marginRight: 10 },
  spotInfo: { 
    flex: 1,
    gap: 4,
    marginRight: 4,
  },
  spotName: { fontSize: 14, fontWeight: 'bold' },
  spotSubText: { fontSize: 12, color: '#666' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
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
    minHeight: 500
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold',},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#37BA8C',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#f44336' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', },
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
  },
  attaInfoItemFirst: {
    marginTop: 8
  },
  detailAddress: { 
    fontSize: 12,
    color: '#66666d' 
  },
  attaInfoItemBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
