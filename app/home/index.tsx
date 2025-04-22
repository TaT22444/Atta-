import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Alert, Modal, FlatList, TextInput, TouchableWithoutFeedback, Animated, ScrollView, Linking } from 'react-native';
import { Svg, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Entypo, Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DetailModal from '../../src/components/DetailModal';
import axios from 'axios';

import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, writeBatch, query, where } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { router } from 'expo-router';

const STORE_LAT = 35.819000749117876;
const STORE_LON = 139.8072771653966;
const R = 6371000;

const GOOGLE_MAPS_API_KEY = 'AIzaSyAy0m4eC_DwrwW4x8mouclfTMsqdMsElec';

interface Spot {
  id: string;
  name: string;
  address: string;
  image: string;
  latitude: number; // 緯度
  longitude: number; // 経度
  isEnabled: boolean; // ON/OFFスイッチ用
  originalLink: string; // 追加
}

const GradientInputText = ({ text, style }: { text: string; style: any }) => {
  return (
    <Svg height="20" width={`28.5%`}>
      <Defs>
        <SvgLinearGradient id="gradientFeature" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#780DFF" stopOpacity="1" />
          <Stop offset="1" stopColor="#D236D6" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientFeature)"
        fontSize="14"
        fontWeight="500"
        x="0"
        y="16"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

// 通知ハンドラの設定：フォアグラウンドでも通知を表示
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export default function MapScreen() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);
  const [isAttaActive, setIsAttaActive] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [distanceToStore, setDistanceToStore] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false); 
  const [listModalVisible, setListModalVisible] = useState(false); // リストモーダル用
  const [hasNotified, setHasNotified] = useState(false); // 150m内に初回進入時の通知用フラグ
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null); // 選択された店舗
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null); // 選択された店舗との距離
  const storeName = "Atta!草加店";
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(800)).current; // 初期位置を画面外（下）に設定
  const [searchKeyword, setSearchKeyword] = useState(''); // 検索キーワード
  const [searchRadius, setSearchRadius] = useState(100); // 検索範囲（デフォルト100m）
  const [apiCallCount, setApiCallCount] = useState(0); // API呼び出し回数
  const [searchResults, setSearchResults] = useState<Spot[]>([]); // 検索結果用の状態


  const openSearchModal = () => {
    setIsSearchModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0, // スライドイン（画面内に移動）
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSearchModal = () => {
    Animated.timing(slideAnim, {
      toValue: 800, // スライドアウト（画面外に移動）
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSearchModalVisible(false);
    });
  };

  const startSearch = async () => {
    if (!location) {
      Alert.alert('エラー', '現在地が取得されていません。');
      return;
    }

    if (!searchKeyword) {
      Alert.alert('エラー', '検索キーワードを入力してください。');
      return;
    }

    try {
      setApiCallCount((prevCount) => prevCount + 1);

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          key: GOOGLE_MAPS_API_KEY,
          location: `${location.latitude},${location.longitude}`,
          radius: 1000,
          keyword: searchKeyword,
        },
      });

      const places = response.data.results;

      const querySnapshot = await getDocs(collection(db, "spots"));
      const existingSpots = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (deg: number) => deg * (Math.PI / 180);
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const batch = writeBatch(db);
      const newResults: Spot[] = [];

      for (const place of places) {
        const existingSpot = existingSpots.find((spot) => spot.originalLink === `https://www.google.com/maps/place/?q=place_id:${place.place_id}`);

        if (existingSpot) {
          console.log(`既存のスポットが見つかりました: ${existingSpot.name}`);
          newResults.push(existingSpot);
        } else {
          const newSpot = {
            name: place.name,
            address: place.vicinity || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            image: place.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              : 'https://via.placeholder.com/150',
              originalLink: `https://www.google.com/maps?q=${encodeURIComponent(place.name)}+${encodeURIComponent(place.vicinity || '')}`,
            isEnabled: false,
            types: place.types || [],
          };

          const newSpotRef = doc(collection(db, "spots"));
          batch.set(newSpotRef, newSpot);
          newResults.push({ ...newSpot, id: newSpotRef.id });
          console.log(`新しいスポットを追加しました: ${newSpot.name}`);
        }
      }

      await batch.commit();

      const filteredSpots = newResults.filter((spot) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          spot.latitude,
          spot.longitude
        );
        console.log(`店舗: ${spot.name}, 距離: ${distance.toFixed(2)}m`);
        return distance <= 1000;
      });

      setSearchResults(filteredSpots);
      closeSearchModal();

      console.log('検索キーワード:', searchKeyword);
      console.log('ヒットしたスポット数:', filteredSpots.length);
      console.log('API呼び出し回数:', apiCallCount + 1);
    } catch (error) {
      console.error('検索中にエラーが発生しました:', error);
      Alert.alert('エラー', '検索中にエラーが発生しました。');
    }
  };

  

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("エラー", "ログイン情報が見つかりません。");
      return;
    }
  
    // `where` クエリでログイン中のユーザーのスポットのみ取得
    const spotsQuery = query(
      collection(db, "spots"),
      where("userId", "array-contains", userId)
    );
  
    // Firestore リアルタイムリスナーの設定
    const unsubscribe = onSnapshot(spotsQuery, (snapshot) => {
      const spots: Spot[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Spot[];
  
      setUserSpots(spots); // 状態を更新
      console.log("取得したスポット:", spots); // デバッグログ
    });
  
    return () => unsubscribe(); // リスナーのクリーンアップ
  }, [auth.currentUser]);
  

  const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1))*Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon2 - lon1));
    let brng = Math.atan2(y, x) * (180 / Math.PI);
    if (brng < 0) brng += 360;
    return brng;
  }

  const onSpotPress = (spot: Spot) => {
    if (location) {
      const distance = getDistanceFromLatLonInM(
        location.latitude,
        location.longitude,
        spot.latitude,
        spot.longitude
      );
      setSelectedSpot(spot);
      setSelectedDistance(distance);
    } else {
      Alert.alert("エラー", "現在地が取得されていません");
    }
  };

  useEffect(() => {
    console.log('userSpotsが更新されました:', userSpots);
  }, [userSpots]);

  // useEffect(() => {
  //   console.log('userSpotsが更新されました:', userSpots);
  // }, [userSpots]);
  
  const startAttaFeature = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsAttaActive(true);
  
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('位置情報へのアクセスが許可されていません');
      return;
    }
  
    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      async (loc) => {
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        setLocation({ latitude: lat, longitude: lon });
  
        // Firebaseから取得したスポットの距離を計算
        userSpots.forEach(async (spot) => {
          const dist = getDistanceFromLatLonInM(lat, lon, spot.latitude, spot.longitude);
  
          if (dist <= 150 && !spot.isEnabled) {
            // 通知を送信
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Atta!",
                body: `${spot.name}の近くにいます！`,
              },
              trigger: null,
            });
  
            // 触覚フィードバックを実行
            for (let i = 0; i < 3; i++) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
  
            // 通知を送信済みとしてフラグを更新
            spot.isEnabled = true;
            await updateDoc(doc(db, "spots", spot.id), { isEnabled: true });
            setUserSpots([...userSpots]);
          } else if (dist > 150 && spot.isEnabled) {
            // 再び通知可能にする
            spot.isEnabled = false;
            await updateDoc(doc(db, "spots", spot.id), { isEnabled: false });
            setUserSpots([...userSpots]);
          }
        });
      }
    );
  };

  useEffect(() => {
    const loadSpotsFromFirebase = async () => {
      try {
        const userId = auth.currentUser?.uid; // 現在ログイン中のユーザーIDを取得
        if (!userId) {
          Alert.alert("エラー", "ログイン情報が見つかりません。");
          return;
        }
  
        // `where`クエリを使用して、ログイン中のユーザーに関連するスポットのみを取得
        const spotsQuery = query(
          collection(db, "spots"),
          where("userId", "array-contains", userId)
        );
  
        const querySnapshot = await getDocs(spotsQuery);
        const spots: Spot[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Spot[];
  
        setUserSpots(spots); // 状態を更新
        console.log("取得したスポット:", spots); // デバッグログ
      } catch (error) {
        console.error("Firebaseからデータを取得中にエラー:", error);
        Alert.alert("エラー", "データの取得に失敗しました。");
      }
    };
  
    loadSpotsFromFirebase();
  }, []);
  
  
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('エラー', '位置情報へのアクセスが許可されていません。');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        console.log('現在地:', loc.coords); // 現在地の緯度経度を出力
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (error) {
        console.error('現在地の取得中にエラーが発生:', error);
        Alert.alert('エラー', '現在地の取得に失敗しました。');
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    console.log('店舗の座標:', { lat: STORE_LAT, lon: STORE_LON }); // 店舗の座標を出力
  }, []);

  // 通知許可リクエスト
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('通知へのアクセスが許可されていません');
      }
    })();
  }, []);

  useEffect(() => {
    let magnetometerSubscription: any;
    Magnetometer.setUpdateInterval(100);
    magnetometerSubscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let rawHeading = Math.atan2(y, x) * (180 / Math.PI);
      if (rawHeading < 0) rawHeading += 360;
      setHeading(rawHeading);
    });
    return () => {
      if (magnetometerSubscription) magnetometerSubscription.remove();
    };
  }, []);

    // 距離計算時の補正
const calculateRadius = (distance: number) => distance * pxPerMeter;

  const pxPerMeter = 1; 
  const circleData = [
    { distance: 0, radius: calculateRadius(50) },
    { distance: 50, radius: calculateRadius(100) },
    { distance: 100, radius: calculateRadius(150) },
    { distance: 150, radius: calculateRadius(200) },
  ];

  const compassStyle = {
    transform: [{ rotate: `${-heading}deg` }],
  };

  let storePinStyle = {};
  if (location && distanceToStore !== null) {
    const dist = distanceToStore;
    const bearing = getBearing(location.latitude, location.longitude, STORE_LAT, STORE_LON);
    const radiusPx = dist * pxPerMeter;

    storePinStyle = {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999, 
      transform: [
        { rotate: `${bearing}deg` },
        { translateY: -radiusPx }
      ]
    };
  }

    // スポットスイッチの切り替え
    const toggleSpotSwitch = (id: string) => {
      setUserSpots((prevSpots) =>
        prevSpots.map((spot) =>
          spot.id === id ? { ...spot, isEnabled: !spot.isEnabled } : spot
        )
      );
    };

  // リストアイコン押下時、下からモーダル表示
  const onListPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setListModalVisible(true);
  };

  const onCommunityPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("コミュニティアイコンが押されました");
  };
  
  return (
    <View style={styles.container}>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBarItem}>
          <Ionicons name='people' size={16} color={'#66666d'} />
          <View style={styles.itemSunNumber}>
            <Text style={styles.itemSunNumberText}>{userSpots.length}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.verticlaSlash}></View>
        <TouchableOpacity style={styles.actionBarItem}>
          <Ionicons name='people' size={16} color={'#66666d'} />
          <View style={styles.itemSunNumber}>
            <Text style={styles.itemSunNumberText}>3</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.verticlaSlash}></View>
        {/* <View style={styles.actionBarItem}>
          <Ionicons name='search' size={16} color={'#921CF9'} />
          <TextInput
            placeholder='検索キーワード'
            placeholderTextColor={'#921CF9'}
            style={styles.actionBarInput}
          />
        </View> */}
        <TouchableOpacity onPress={openSearchModal} style={styles.actionBarItem}>
          <Ionicons name='search' size={16} color={'#66666d'} />
          <Text style={styles.actionBarUpgradeText}>キーワードで検索</Text>
        </TouchableOpacity>
        {/* モーダル */}
      {/* モーダル */}
      </View>
      {isSearchModalVisible && (
        <View style={{flex: 1, width: `100%`, zIndex: 99}}>
          {/* 半透明背景 */}
          <TouchableWithoutFeedback onPress={closeSearchModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          {/* モーダルコンテンツ */}
          <Animated.View
            style={[
              styles.searchModal,
              { transform: [{ translateY: slideAnim }] }, // スライドアニメーション適用
            ]}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeSearchModal} style={styles.modalHeaderBtn}>
                  <Text style={styles.modalHeaderBtnLabel}>閉じる</Text>
                </TouchableOpacity>
                <Text style={styles.modalHeaderLabel}>Atta Search</Text>
                <TouchableOpacity style={[styles.modalHeaderBtn, styles.modalHeaderBtnTicket]}>
                  <Entypo name='ticket' size={14} color={'#66666d'} />
                  <Text style={styles.modalHeaderBtnTicketLabel}>40</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalSettingBox}>
                <ScrollView style={{paddingTop: 16}}>
                <Text style={styles.modalSettingDesc}>興味のある場所の名前やジャンルを設定することで、近くに興味のある場所・店舗がある場合に「Atta!」とお知らせします!</Text>
                <Text style={styles.modalSettingLabel}>検索キーワード</Text>
                <TextInput
                  style={styles.modalSettingInput}
                  placeholder='場所や店舗の名前、ジャンルを入力'
                  placeholderTextColor={'#66666d'}
                  value={searchKeyword}
                  onChangeText={setSearchKeyword}
                />
                <Text style={styles.modalSettingLabel}>検索頻度</Text>
                <Text style={styles.modalSettingText}>Atta Searchが行われる移動距離を設定します</Text>
                <View style={styles.modalSettingList}>
                  <TouchableOpacity style={[styles.modalSettingListItem, styles.modalSettingListItemActive]}>
                    <Text style={[styles.modalSettingListItemLabel, styles.modalSettingListItemLabelActive]}>10mごと</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSettingListItem}>
                    <Text style={styles.modalSettingListItemLabel}>30mごと</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSettingListItem}>
                    <Text style={styles.modalSettingListItemLabel}>50mごと</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSettingListItem}>
                    <Text style={styles.modalSettingListItemLabel}>100mごと</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalResultBox}>
                  <Text style={styles.modalResultLabel}>検索結果</Text>
                <FlatList
                  style={styles.resultCardList}
                  scrollEnabled={false}
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const distance = location
                      ? getDistanceFromLatLonInM(location.latitude, location.longitude, item.latitude, item.longitude)
                      : null;
        
                    return (
                      <TouchableOpacity
                        style={styles.resultCard}
                        onPress={() => {
                          Linking.openURL(item.originalLink).catch((err) => {
                            console.error("リンクを開けませんでした:", err);
                            Alert.alert("エラー", "Google Mapsを開けませんでした。");
                          });
                        }}                        
                        >
                        <Image source={{ uri: item.image }} style={styles.resultImage} />
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          {distance !== null && (
                            <Text style={styles.resultDistance}>
                              現在地から {distance.toFixed(1)} m
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                </View>
                </ScrollView>
                <View style={styles.modalSettingBtnWrapper}>
                  <TouchableOpacity style={styles.modalSettingSaveBtn}>
                    <Text style={styles.modalSettingSaveBtnLabel}>保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={startSearch}  style={styles.modalSettingStartBtn}>
                    <Text style={styles.modalSettingStartBtnLabel}>開始!</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Entypo name='ticket' size={14} color={'#fff'} />
                      <Text style={{color: '#fff', fontWeight: '500',}}>/100m</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

<DetailModal
  spot={selectedSpot}
  distance={selectedDistance}
  toggleSpotSwitch={toggleSpotSwitch}
  removeSpotFromState={(id) => {
    setUserSpots((prevSpots) => prevSpots.filter((spots) => spots.id !== id));
  }}
  // loadSpotsFromFirebase={}
/>

      {isAttaActive && (
        <View style={styles.circleContainer}>
          {circleData.map((c, index) => (
            <View
              key={index}
              style={[styles.circle, { width: c.radius * 2, height: c.radius * 2 }]}
            />
          ))}

          <View style={styles.layersContainer}>
            <View style={[styles.layer, styles.layer1]} />
            <View style={[styles.layer, styles.layer2]} />
          </View>

          <View style={styles.userIconContainer}>
            <View style={styles.placeholderUserIcon} />
          </View>

          {circleData.map((c, index) => (
            <View
              key={`label-${index}`}
              style={[
                styles.labelContainer,
                { transform: [{ translateY: c.radius }] },
              ]}
            >
              <Text style={styles.labelText}>{c.distance}m</Text>
            </View>
          ))}

{searchResults.map((spot) => {
  const dist = location
    ? getDistanceFromLatLonInM(location.latitude, location.longitude, spot.latitude, spot.longitude)
    : null;

  const bearing = location
    ? getBearing(location.latitude, location.longitude, spot.latitude, spot.longitude)
    : 0;

  const radiusPx = dist ? calculateRadius(dist) : 0;

  return (
    <TouchableOpacity
      key={spot.id}
      style={{
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [
          { rotate: `${bearing}deg` },
          { translateY: -radiusPx - 50 },
        ],
        zIndex: 2,
      }}
      onPress={() => onSpotPress(spot)}
    >
      <View style={styles.storePin} />
      <View style={styles.storeLabelContainer}>
        <Text style={styles.storeLabelText}>{spot.name}</Text>
      </View>
    </TouchableOpacity>
  );
})}


        </View>
      )}
      {/* 下部ボタンコンテナ */}
      <View style={styles.bottomButtonsContainer}>
        {/* 左ボタン（コミュニティアイコン） */}
        <TouchableOpacity style={styles.sideButton} onPress={onCommunityPress}>
          <Ionicons name="people" size={20} color="#252528" />
        </TouchableOpacity>

        {/* 中央ボタン（現在位置） */}
        <TouchableOpacity style={styles.currentLocationButton} onPress={startAttaFeature}>
          <Ionicons name="paper-plane" size={24} color="white" />
        </TouchableOpacity>

        {/* 右ボタン（リストアイコン） */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => router.push('home/list')}
        >
          <Ionicons name="list" size={20} color="#252528" />
        </TouchableOpacity>
      </View>

      {/* {location && (
        <Text style={styles.locationText}>
          Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
        </Text>
      )}

      {distanceToStore !== null && (
        <Text style={styles.distanceText}>
          Store Dist: {distanceToStore.toFixed(2)}m
        </Text>
      )} */}

      {/* <View style={styles.compassContainer}>
        <View style={styles.compassBackground}>
          <Ionicons name="compass" size={24} color="#333" style={compassStyle} />
        </View>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f2f2f2', 
    alignItems: 'center' 
  },
  actionBar: {
    position: 'absolute',
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
    borderRadius: 100,
    backgroundColor: '#fff',
    shadowColor: '#252528',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8
  },
  verticlaSlash: {
    width: 1,
    height: 12,
    backgroundColor: '#dadae3'
  },
  actionBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionBarInput: {
    color: '#252528'
  },
  actionBarUpgradeText: {
    fontSize: 14,
    fontWeight: '400'
  },
  modalOverlay: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    flex: 1,
    width: `100%`,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  searchModal: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: `90%`,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    // paddingBottom: 400,
    shadowColor: '#252528',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    zIndex: 99
  },
  modalContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    width: '100%',
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#37BA8C',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemSunNumber: {
    width: 20,
    height: 20,
    backgroundColor: '#252528',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemSunNumberText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fbfbfb',
  },
  circleContainer: {
    position: 'absolute',
    top: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 1,
    borderColor: '#dadae3',
    borderRadius: 999,
    position: 'absolute',
  },
  layersContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 999,
    elevation: 4,
  },
  layer1: {
    width: 72,
    height: 72,
    shadowColor: '#252528',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 3
  },
  layer2: {
    width: 88,
    height: 88,
    shadowColor: '#252528',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2
  },
  userIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 51,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    position: 'absolute',
    shadowColor: '#252528',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 4
  },
  placeholderUserIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccc',
  },
  labelContainer: {
    position: 'absolute',
  },
  labelText: {
    padding: 8,
    fontSize: 12,
    color: '#66666D',
    backgroundColor: '#f2f2f2'
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '80%',
    justifyContent: 'space-between',
  },
  sideButton: {
    backgroundColor: '#fff',
    width: 52,
    height: 52,
    borderRadius: 50,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#999',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  currentLocationButton: {
    backgroundColor: '#37BA8C',
    borderWidth: 1,
    borderColor: '#9CF8C7',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#4ACA86',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  locationText: {
    position: 'absolute',
    top: 50,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceText: {
    position: 'absolute',
    top: 80,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 5,
    borderRadius: 4,
  },
  compassContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  compassBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  storePin: {
    // position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#37BA8C',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#fff',
  },
  storeLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    elevation: 2,
    zIndex: 1000 
  },
  storeLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#252528',
  },
  modalBackdrop: {
    position: 'absolute',
    bottom: 0,
    flex: 1,
    height: `100%`,
    width: `100%`,
    backgroundColor: '#f8f8f8',
    opacity: 0.1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#37BA8C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  // リストモーダル
  listModalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    padding: 20,
    elevation: 10
  },
  listModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listModalCount: {
    fontSize: 14,
    color: '#333'
  },
  listModalCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#37BA8C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4
  },
  listModalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  storeItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: '#ddd',
    borderWidth: 0.5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  storeItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#ccc'
  },
  storeItemInfo: {
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  storeItemAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  modalHeader: {
    // flex: 1,
    width: `100%`,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modalHeaderBtnTicket: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#dadae3'
  },
  modalHeaderBtnTicketLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d'
  },
  modalHeaderBtnLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#252528',
    textDecorationLine: 'underline',
    paddingBottom: 2
  },
  modalHeaderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#252528'
  },
  modalSettingBox: {
    flex: 1,
    // paddingTop: 16
  },
  modalSettingDesc: {
    fontSize: 12,
    lineHeight: 20,
    color: '#66666d'
  },
  modalSettingLabel: {
    marginTop: 24,
    fontSize: 12,
    color: '#252528',
    fontWeight: '500'
  },
  modalSettingInput: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#dadae3',
    borderRadius: 16
  },
  modalSettingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d'
  },
  modalSettingList: {
    width: `100%`,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  modalSettingListItem: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dadae3'
  },
  modalSettingListItemActive: {
    backgroundColor: '#252528',
    borderWidth: 0
  },
  modalSettingListItemLabel: {
    fontSize: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  modalSettingListItemLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSettingBtnWrapper: {
    height: 52,
    position: 'absolute',
    bottom: 40,
    width: `80%`,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 99
  },
  modalSettingSaveBtn: {
    paddingHorizontal: 40,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#dadae3',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  modalSettingSaveBtnLabel: {
    fontSize: 14,
    color: '#252528'
  },
  modalSettingStartBtn: {
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    backgroundColor: '#37BA8C',
    gap: 8
  },
  modalSettingStartBtnLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  resultCardList: {
    marginTop: 16,
  },
  resultCard: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadae3',
    borderRadius: 16,
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultDistance: {
    fontSize: 14,
    color: '#666',
  },
  modalResultBox: {
    marginTop: 24,
    marginBottom: 160,
    // borderTopWidth: 1,
    // borderColor: '#dadae3'
  },
  modalResultLabel: {     
    fontSize: 12,
    color: '#252528',
    fontWeight: '500'
  }
});
