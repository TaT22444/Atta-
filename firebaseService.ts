// firebaseService.ts
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Spot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image: string;
  isEnabled: boolean;
  userId: string[];
}

// スポットを取得（リアルタイム）
export const fetchSpotsRealtime = (callback: (spots: Spot[]) => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('ユーザーIDが取得できません');
    return;
  }

  const spotsQuery = query(collection(db, 'spots'), where('userId', 'array-contains', userId));
  const unsubscribe = onSnapshot(spotsQuery, (snapshot) => {
    const spots = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Spot[];
    callback(spots);
  });

  return unsubscribe; // リスナーを外部で管理可能
};

// スポットを取得（静的）
export const fetchSpotsOnce = async (): Promise<Spot[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('ユーザーIDが取得できません');

  const spotsQuery = query(collection(db, 'spots'), where('userId', 'array-contains', userId));
  const snapshot = await getDocs(spotsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Spot[];
};

// スポットを追加
export const addSpot = async (spot: Omit<Spot, 'id'>) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('ユーザーIDが取得できません');

  const docRef = await addDoc(collection(db, 'spots'), { ...spot, userId: [userId] });
  return docRef.id;
};

// スポットを削除
export const deleteSpot = async (spotId: string) => {
  await deleteDoc(doc(db, 'spots', spotId));
};

// スポットを更新
export const updateSpot = async (spotId: string, data: Partial<Spot>) => {
  await updateDoc(doc(db, 'spots', spotId), data);
};

// ローカルキャッシュ保存
export const saveSpotsToCache = async (spots: Spot[]) => {
  await AsyncStorage.setItem('userSpots', JSON.stringify(spots));
};

// ローカルキャッシュ取得
export const loadSpotsFromCache = async (): Promise<Spot[]> => {
  const cachedData = await AsyncStorage.getItem('userSpots');
  return cachedData ? JSON.parse(cachedData) : [];
};
