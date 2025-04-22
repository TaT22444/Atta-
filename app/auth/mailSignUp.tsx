import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { SimpleLineIcons } from '@expo/vector-icons';

export default function MailSignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  // Firestoreにユーザーデータを登録
  const registerUserInFirestore = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // ユーザーが存在しない場合、新規登録
        await setDoc(userRef, {
          createdAt: new Date().toISOString(),
          registeredSpots: [],
        });
        console.log('新規ユーザーがFirestoreに登録されました:', userId);
      } else {
        console.log('既存のユーザーです:', userId);
      }
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
    }
  };

  // メールで新規登録
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('入力エラー', 'すべてのフィールドを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('パスワード不一致', 'パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      Alert.alert('パスワードエラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Firestoreにユーザー情報を登録
      await registerUserInFirestore(userId);

      Alert.alert('登録成功', 'アカウントが作成されました');
      router.replace('/home'); // ホームページに遷移
    } catch (error) {
      console.error('登録エラー:', error);
      Alert.alert('エラー', 'アカウント作成に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      {/* ログインページに切り替え */}
      <TouchableOpacity
        style={styles.switchingBtn}
        onPress={() => router.replace('/auth/mailLogin')}
      >
        <View style={styles.switchingBtnWrapper}>
          <Text style={styles.switchingBtnLabel}>ログイン</Text>
          <Text style={styles.switchingBtnDesc}>アカウントをお持ちの方はこちら</Text>
        </View>
        <SimpleLineIcons name="arrow-right-circle" size={20} color="#66666d" />
      </TouchableOpacity>

      {/* 新規登録フォーム */}
      <View style={styles.box}>
        <Text style={styles.title}>新規登録</Text>
        <Text style={styles.subText}>新しく始める方</Text>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            placeholderTextColor="#66666d"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>パスワード (半角英数字8文字以上)</Text>
          <TextInput
            style={styles.input}
            placeholder="半角英数字8文字以上"
            placeholderTextColor="#66666d"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>パスワード (確認)</Text>
          <TextInput
            style={styles.input}
            placeholder="確認用パスワード"
            placeholderTextColor="#66666d"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonLabel}>新規登録</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
  },
  box: {
    flex: 1,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    gap: 8,
  },
  subText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#66666d',
  },
  inputBox: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#252528',
    fontWeight: '400',
  },
  input: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#66666d',
    fontSize: 12,
  },
  button: {
    borderRadius: 999,
    backgroundColor: '#37BA8C',
    borderWidth: 1,
    borderColor: '#9CF8C7',
    marginTop: 40,
    paddingHorizontal: 64,
    paddingVertical: 24,
    alignSelf: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  switchingBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dadae3',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  switchingBtnWrapper: {
    gap: 4,
  },
  switchingBtnLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#252528',
  },
  switchingBtnDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#66666d',
  },
});
