import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LocationObjectCoords } from 'expo-location';

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState<LocationObjectCoords | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      }
    };
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      {/* 地図表示 */}
      <MapView style={styles.map} showsUserLocation />

      {/* 下部アイコン */}
      <View style={styles.bottomIcons}>
        <TouchableOpacity>
          <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.currentLocation}>
          <Ionicons name="paper-plane" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="people" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    width: '100%',
  },
  icon: { width: 50, height: 50, borderRadius: 25 },
  currentLocation: {
    backgroundColor: '#FF9800',
    borderRadius: 25,
    padding: 15,
  },
});
