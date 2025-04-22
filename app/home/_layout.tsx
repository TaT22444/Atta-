import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import SignUpScreen from './signUp';

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        header: ({ route }) => (
          <View style={styles.headerContainer}>
            {['account', 'list', 'notification'].includes(route.name) ? (
              <>
                <TouchableOpacity
                  style={styles.headerIconBack}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={20} color="#252528" />
                </TouchableOpacity>
                <Text style={[styles.logo, styles.logoChild]}>
                  {route.name === 'account' && 'アカウント'}
                  {route.name === 'list' && 'Atta!リスト'}
                  {route.name === 'notification' && 'お知らせ'}
                </Text>
                <TouchableOpacity style={styles.headerIconBtn}>
                  <Ionicons name='bag-outline' size={20} color={'#252528'} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.headerIconBtn}>
                  <Ionicons name="notifications-outline" size={20} color="#252528" />
                </TouchableOpacity>
                <Text style={styles.logo}>Atta!</Text>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => router.push('home/account')}
                >
                  <MaterialCommunityIcons name="account" size={20} color="#252528" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="account" options={{ headerShown: true }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoChild: {
    fontSize: 20,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadae3',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
