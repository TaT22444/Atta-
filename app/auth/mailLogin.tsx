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
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { SimpleLineIcons } from '@expo/vector-icons';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // メールでログイン
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('ログイン成功', 'ログインしました');
      router.replace('/home'); // ホームページに遷移
    } catch (error) {
      console.error('ログインエラー:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          Alert.alert('エラー', 'このメールアドレスは登録されていません');
          break;
        case 'auth/wrong-password':
          Alert.alert('エラー', 'パスワードが間違っています');
          break;
        case 'auth/invalid-email':
          Alert.alert('エラー', '無効なメールアドレス形式です');
          break;
        default:
          Alert.alert('エラー', 'ログインに失敗しました');
      }
    }
  };  

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.switchingBtn}
        onPress={() => router.replace('/auth/mailSignUp')}
      >
        <View style={styles.switchingBtnWrapper}>
          <Text style={styles.switchingBtnLabel}>新規登録</Text>
          <Text style={styles.switchingBtnDesc}>アカウントをお持ちでない方はこちら</Text>
        </View>
        <SimpleLineIcons name="arrow-right-circle" size={20} color="#66666d" />
      </TouchableOpacity>

      <View style={styles.box}>
        <Text style={styles.title}>ログイン</Text>
        <Text style={styles.subText}>すでにアカウントをお持ちの方</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonLabel}>ログイン</Text>
        </TouchableOpacity>

        <Text style={styles.resetLabel}>
          <Text style={[styles.resetLabel, styles.textlink]}>
            パスワードをお忘れの方はこちら
          </Text>
        </Text>
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
  textlink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
    color: '#439AE6',
  },
  resetLabel: {
    textAlign: 'center',
    marginTop: 24,
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
    width: `100%`,
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
