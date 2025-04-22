import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInAnonymously, signInWithCredential } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // Firebaseの初期設定をインポート
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestoreの関連関数をインポート
import { Ionicons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const router = useRouter();
  
  // Googleログイン用のリクエストを作成
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '823481101265-j4vknpoh096rig29e929jjo3fvsp24jn.apps.googleusercontent.com', // Google Cloud Consoleから取得したWebクライアントID
    iosClientId: 'YOUR_IOS_CLIENT_ID', // 必要に応じて設定
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // 必要に応じて設定
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'Atta', // app.jsonで設定したスキーム
    }),
    extraParams: {
      prompt: 'select_account', // アカウント選択画面を表示する
    },
  });

  // Googleログイン成功時の処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleLogin(id_token);
      }
    }
  }, [response]);

    

// 匿名ログイン処理
const handleAnonymousLogin = async () => {
  try {
    const result = await signInAnonymously(auth);
    const userId = result.user.uid; // ログインしたユーザーのUIDを取得
    console.log('ログイン成功: UID =', userId);

    // Firestoreにユーザーデータを登録
    await registerUserInFirestore(userId);

    Alert.alert('ログイン成功', 'ゲストとしてログインしました');
    router.replace('/home'); // ログイン後、ホームページに遷移
  } catch (error) {
    console.error('匿名ログインエラー:', error);
    Alert.alert('エラー', 'ログインに失敗しました');
  }
};

// Googleログイン後、Firebaseに認証を渡す
const handleGoogleLogin = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const userId = result.user.uid;
    console.log('Googleログイン成功:', userId);

    Alert.alert('ログイン成功', 'Googleアカウントでログインしました');
    router.replace('/home');
  } catch (error) {
    console.error('Googleログインエラー:', error);
    Alert.alert('エラー', 'Googleログインに失敗しました');
  }
};

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
  
  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
      <Text style={styles.title}>Atta!</Text>
      </View>

      <View style={styles.inner}>

      {/* Apple ログイン */}
      <TouchableOpacity style={styles.button}>
        <AntDesign style={styles.buttonIcon} name='apple1' size={24} color={'#252528'} />
        <Text style={styles.buttonText}>Appleで続ける</Text>
      </TouchableOpacity>

      {/* Google ログイン */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => promptAsync()}
        disabled={!request}
      >
      <FontAwesome5 style={styles.buttonIcon} name='google' size={24} color={'#252528'} />
        <Text style={styles.buttonText}>Googleで続ける</Text>
      </TouchableOpacity>

      {/* mail ログイン */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/auth')} >
        <Ionicons style={styles.buttonIcon} name='mail-outline' size={24} color={'#252528'} />
        <Text style={styles.buttonText}>メールアドレスで続ける</Text>
      </TouchableOpacity>

      {/* ゲストログイン */}
      <TouchableOpacity
        style={[styles.button, styles.guestButton]}
        onPress={handleAnonymousLogin}
      >
        <Text style={[styles.buttonText, styles.guestButtonText]}>
          ゲストとして始める
        </Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        アプリを始めることで
        <Text style={styles.linkText}>利用規約</Text>、
        <Text style={styles.linkText}>プライバシーポリシー</Text>
        に同意したとみなされます
      </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    backgroundColor: '#f8f8f8',
  },
  inner: {
    width: `100%`,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 40
  },
  titleWrapper: {
    flex: 0.7,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  button: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dadae3',
  },
  buttonIcon: {
    position: 'absolute',
    left: 40
  },
  buttonText: {
    fontSize: 16,
    color: '#252528',
    fontWeight: '400'
  },
  guestButton: {
    backgroundColor: 'none',
    borderColor: '#dadae3',
    borderWidth: 1,
  },
  guestButtonText: {
    color: '#66666d',
    fontSize: 14
  },
  termsText: {
    // position: 'absolute',
    // bottom: 24,
    paddingHorizontal: 16,
    lineHeight: 24,
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600'
  },
});
