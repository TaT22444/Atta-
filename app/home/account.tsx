import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Svg, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons, AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumModal from '../../src/components/PremiumModal';

// GradientTextコンポーネントのバリエーションを作成
const GradientTitleText = ({ text }: { text: string }) => {
  return (
    <Svg height="24" width={`44%`}>
      <Defs>
        <SvgLinearGradient id="gradientTitle" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientTitle)"
        fontSize="16"
        fontWeight="bold"
        x="0"
        y="16"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

const GradientModalTitleText = ({ text }: { text: string }) => {
  return (
    <Svg height="24" width={`37.0%`}>
      <Defs>
        <SvgLinearGradient id="gradientTitle" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientTitle)"
        fontSize="16"
        fontWeight="bold"
        x="0"
        y="16"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

const GradientFeatureText = ({ text }: { text: string }) => {
  return (
    <Svg height="20" width={`65%`}>
      <Defs>
        <SvgLinearGradient id="gradientFeature" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#780DFF" stopOpacity="1" />
          <Stop offset="1" stopColor="#D236D6" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientFeature)"
        fontSize="16"
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

const GradientHighlightText = ({ text }: { text: string }) => {
  return (
    <Svg height="18" width={`100%`}>
      <Defs>
        <SvgLinearGradient id="gradientHighlight" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientHighlight)"
        fontSize="14"
        fontWeight="bold"
        x="0"
        y="14"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

const GradientSmallText = ({ text }: { text: string }) => {
  return (
    <Svg height="16" width={`100%`}>
      <Defs>
        <SvgLinearGradient id="gradientSmall" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientSmall)"
        fontSize="12"
        fontWeight="bold"
        x="0"
        y="12"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

export default function AccountScreen() {
  const [user, setUser] = useState<any>(null); // ユーザー情報を保存
  const [backgroundOpacity] = useState(new Animated.Value(0)); // 背景の透明度
  const [isPremiumDetailsVisible, setPremiumDetailsVisible] = useState(false); // 特典の開閉状態
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false); // モーダルの開閉状態v

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    } else {
      Alert.alert('エラー', 'ログイン情報が見つかりません');
      router.replace('/auth/mailLogin'); // 未ログインの場合、ログインページにリダイレクト
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'ログアウトの確認',
      '本当にログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              Alert.alert('ログアウト成功', 'ログアウトしました');
              router.replace('/auth/mailLogin');
            } catch (error) {
              console.error('ログアウトエラー:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('コピー成功', 'ユーザーIDをコピーしました');
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.premiumPlanContainer}>
        <View style={styles.premiumHeader}>
          <View style={styles.premiumHeaderLeft}>
            <GradientTitleText text="プレミアムプラン" />
            <Text style={styles.premiumPrice}>1600円/月</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.paymentButton}>
          <LinearGradient
            colors={['#780DFF', '#E393E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.paymentButtonGra}
          >
            <Text style={styles.paymentButtonText}>詳細</Text>
            {/* <Text style={styles.paymentButtonText}>お支払い</Text> */}
          </LinearGradient>
          </TouchableOpacity>
        </View>
        <PremiumModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
        />
      </View>

      <View style={styles.cardBox}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.userInfo}>
            <View style={styles.avatar} />
            <View style={styles.nameWrapper}>
              <Text style={styles.name}>{user?.displayName || '名前未設定'}</Text>
            </View>
            <AntDesign name="right" size={20} color="#66666d" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => copyToClipboard(user?.uid)}
            style={styles.userIdWrapper}
          >
            <Text style={styles.userIdLabel}>ユーザーID</Text>
            <View style={styles.userIdRow}>
              <Text style={styles.userId}>{user?.uid}</Text>
              <Ionicons name="copy-outline" size={20} color="#66666d" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.userIdLabel}>称号</Text>
            <View style={styles.titleList}>
              <TouchableOpacity style={styles.titleItem}></TouchableOpacity>
              <TouchableOpacity style={styles.titleItem}></TouchableOpacity>
              <TouchableOpacity style={styles.titleItem}></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil-outline" size={20} color="#252528" />
          <Text style={styles.actionLabel}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="qr-code-outline" size={20} color="#252528" />
          <Text style={styles.actionLabel}>QRコード</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF042C" />
          <Text style={[styles.actionLabel, styles.logoutButtonLabel]}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.space} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardBox: {
    marginTop: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#dadae3',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#ccc',
    marginRight: 16,
  },
  nameWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#252528',
  },
  titleWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 16
  },
  titleList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleItem: {
    width: 40,
    height: 40,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#dadae3'
  },
  userIdWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  userIdLabel: {
    fontSize: 12,
    color: '#66666d',
    marginBottom: 8,
  },
  userIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userId: {
    fontSize: 14,
    color: '#252528',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dadae3',
    gap: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#252528',
  },
  logoutButton: {
    borderColor: '#EF042C',
  },
  logoutButtonLabel: {
    color: '#EF042C',
  },
  premiumPlanContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#A020F0',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingBottom: 16,
    // borderBottomWidth: 1,
    // borderColor: '#dadae3'
  },
  premiumHeaderLeft: {
    marginTop: 4,
    flex : 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumPrice: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '400',
    color: '#66666d',
  },
  paymentButton: {
    height: 40,
  },
  paymentButtonGra: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  paymentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 16,
  },
  toggleDetails: {
    textAlign: 'center',
    color: '#66666d',
    fontWeight: '500',
    fontSize: 12
  },
  premiumDetails: {
    // marginTop: 16,
  },
  featureItem: {
    gap: 8,
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#dadae3'
  },
  featureLastItem: {
    borderBottomWidth: 0
  },
  featureItemBox: {
    gap: 8
  },
  featureItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#66666d',
    lineHeight: 20
  },
  featureItemWrapper: {
    flexDirection: 'row',
    // alignItems: 'center'
  },
  featureLabel: {
    fontWeight: '500',
    fontSize: 12,
    color: '#66666d',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureNumber: {
    fontSize: 14,
    color: '#66666d',
    fontWeight: '500',
  },
  featureTextWrapper: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureSubText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#66666d',
    fontWeight: '500'
  },
  space: {
    width: `100%`,
    height: 120
  },
  premiumModalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#252528',
    opacity: 0.4,
    zIndex: -1,
  },
  premiumModalContent: {
    width: `100%`,
    minHeight: `60%`,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#780DFF',
    backgroundColor: '#fff',
  },
  premiumModalHeader: {
    gap: 4,
    alignItems: 'center',
    paddingBottom: 8,
  },
  premiumModalDetail: {

  },
  premiumModalBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  premiumModalCloseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#66666d',
    borderRadius: 100
  },
  premiumModalCloseBtnText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#66666d'
  },
  premiumModalPaymentBtn: {
    flex: 1,
    borderRadius: 100
  },
  premiumModalPaymentBtnGra: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
  },
  premiumModalPaymentBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  }
});
