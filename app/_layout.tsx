import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import SignUpScreen from './signUp';

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        header: ({ route }) => (
          // <View style={styles.headerContainer}>
          //   {route.name === 'mailLogin' ? (
          //     <>
          //       <TouchableOpacity
          //         style={styles.headerIconBtn}
          //         onPress={() => router.back()}
          //       >
          //         <Ionicons name="arrow-back" size={20} color="#252528" />
          //       </TouchableOpacity>
          //       <Text style={styles.logo}>メールで続ける</Text>
          //       <View style={{ width: 44 }} />
          //     </>
          //   ) : (
          //     <>
          //     </>
          //   )}
          // </View>
          <></>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* <Stack.Screen name="mailLogin" options={{ headerShown: true }} /> */}
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
    backgroundColor: '#f8f8f8'
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
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
});
