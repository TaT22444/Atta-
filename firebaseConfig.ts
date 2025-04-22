// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqnX2qYmliy7lAfHQVLpBsIN6eyA-5MU4",
  authDomain: "atta-9f7a0.firebaseapp.com",
  projectId: "atta-9f7a0",
  storageBucket: "atta-9f7a0.firebasestorage.app",
  messagingSenderId: "823481101265",
  appId: "1:823481101265:web:78a1d9def1362f75240ef0",
  measurementId: "G-SY7E2G0M4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, auth, db }
