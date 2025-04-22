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
  Animated
} from 'react-native';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Svg, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons, AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    <Svg height="16" width={`64.9%`}>
      <Defs>
        <SvgLinearGradient id="gradientTitle" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientTitle)"
        fontSize="14"
        fontWeight="bold"
        x="0"
        y="13.4"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

const GradientModalItemText = ({ text }: { text: string }) => {
  return (
    <Svg height="16" width={`32.8%`}>
      <Defs>
        <SvgLinearGradient id="gradientTitle" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6A0DAD" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF69B4" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradientTitle)"
        fontSize="14"
        fontWeight="bold"
        x="0"
        y="13"
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
        fontWeight="600"
        x="0"
        y="16"
        textAnchor="start"
      >
        {text}
      </SvgText>
    </Svg>
  );
};

interface PremiumModal {
  isVisible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isVisible, onClose }: PremiumModal) {
  const [isModalVisible, setModalVisible] = useState(false); // モーダルの開閉状態
  const [selectedTab, setSelectedTab] = useState<'premium' | 'items'>('premium');

  return(
    <Modal
        visible={isVisible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
        >
          <View style={styles.premiumModalContainer}>
            <TouchableWithoutFeedback onPress={onClose}>
             <Animated.View
               style={[
                 styles.modalBackground,
               ]}
             />
           </TouchableWithoutFeedback>
           <View style={styles.premiumModalContent}>
           <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'premium' && styles.activeTab,
              ]}
              onPress={() => setSelectedTab('premium')}
            >
              {selectedTab === 'premium' ? (
                <GradientModalTitleText text="プレミアムプラン" />
              ) : (
                <Text style={styles.inactiveTabText}>プレミアムプラン</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === 'items' && styles.activeTab,
              ]}
              onPress={() => setSelectedTab('items')}
            >
              {selectedTab === 'items' ? (
                <GradientModalItemText text="アイテム" />
              ) : (
                <Text style={styles.inactiveTabText}>アイテム</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.premiumModalDetail}>
            {selectedTab === 'premium' ? (
              <View style={{flex: 1}}>
                <View style={styles.premiumModalDetailContent}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>特典1</Text>
                  <View style={styles.featureItemWrapper}>
                    <GradientFeatureText text="Atta!リスト登録枠増加" />
                    <View style={styles.featureTextWrapper}>
                      <Text style={styles.featureSubText}>
                        +10
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>特典2</Text>
                  <View style={styles.featureItemBox}>
                    <View style={styles.featureItemWrapper}>
                      <GradientFeatureText text="Atta! Search" />
                      <View style={styles.featureTextWrapper}>
                        <Text style={styles.featureSubText}>+50</Text>
                      </View>
                    </View>
                    <Text style={styles.featureItemText}>好きな場所の名前やジャンルをあらかじめ設定し、その近くを通ったら通知でお知らせします！</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>特典3</Text>
                  <View style={styles.featureItemBox}>
                    <View style={styles.featureItemWrapper}>
                      <GradientFeatureText text="Atta! Friend" />
                      <View style={styles.featureTextWrapper}>
                      </View>
                    </View>
                    <Text style={styles.featureItemText}>フレンドの「Atta!リスト」の店舗に対しても、近くを通った際にAtta!と通知でお知らせします！
                    </Text>
                  </View>
                </View>
                <View style={[styles.featureItem, styles.featureLastItem]}>
                  <Text style={styles.featureLabel}>特典4</Text>
                  <View style={styles.featureItemWrapper}>
                  <GradientFeatureText text="広告削除" />
                  </View>
                </View>
                </View>
                <View style={styles.premiumModalBtns}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.premiumModalCloseBtn}
                  >
                    <Text style={styles.premiumModalCloseBtnText}>閉じる</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.premiumModalPaymentBtn}>
                    <LinearGradient
                      colors={['#780DFF', '#E393E5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.premiumModalPaymentBtnGra}
                    >
                      <Text style={styles.premiumModalPaymentBtnText}>アップグレード(1200円/月)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{flex: 1}}>
                <ScrollView style={styles.itemContainer}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemLabelWraper}>
                      <Text style={styles.itemLabel}>Atta!リスト 枠拡張チケット</Text>
                      <Text style={styles.itemLabelPossession}>所持数: 0枚</Text></View>
                    <View style={styles.itemList}>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×1</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>120円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×3</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>340円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×10</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>1080円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.itemContent, styles.itemContent2]}>
                    <View style={styles.itemLabelWraper}>
                      <Text style={styles.itemLabel}>Atta!リスト 枠拡張チケット</Text>
                      <Text style={styles.itemLabelPossession}>所持数: 0枚</Text></View>
                    <View style={styles.itemList}>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×1</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>140円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×3</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>420円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemBox}>
                      <View style={styles.itemIconWrapper}>
                        <Ionicons name='ticket-outline' size={32} />
                      </View>
                      <Text style={styles.itemName}>×10</Text>
                      {/* <Text style={styles.itemText}>ここにアイテムの説明が入ります</Text> */}
                      <LinearGradient
                        colors={['#780DFF', '#E393E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemPriceWrapper}
                      >
                        <Text style={styles.itemPrice}>1320円</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
            </View>
           </View>
          </View>
        </Modal>
  )
}

const styles = StyleSheet.create({
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
    height: `74%`,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#780DFF',
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    flex: 1,
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderColor: '#dadae3',
  },
  activeTab: {
    borderBottomWidth: 1.2,
    borderColor: '#780DFF',
  },
  inactiveTabText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#66666d'
  },
  premiumModalHeader: {
    gap: 4,
    alignItems: 'center',
    paddingBottom: 8,
  },
  premiumPrice: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '400',
    color: '#66666d',
  },
  premiumModalDetail: {
    flex: 1,
  },
  premiumModalDetailContent: {
    flex: 1,
  },
  premiumModalBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
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
  itemContainer: {
    flex: 1,
  },
  itemContent: {
    marginTop: 24,
  },
  itemContent2: {
    marginTop: 40,
  },
  itemLabelWraper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#252528',
  },
  itemLabelPossession: {
    fontSize: 12,
    fontWeight: '400',
    color: '#66666d'
  },
  itemList: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dadae3',
  },
  itemIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemName: {
    fontSize: 12,
    color: '#66666d',
    fontWeight: '600',
    marginTop: 8,
  },
  itemPriceWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
})
