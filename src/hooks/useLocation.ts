import * as Location from 'expo-location';
import { useState } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const startLocationUpdates = (callback: (loc: Location.LocationObject) => void) => {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 10 },
      (loc) => {
        setLocation(loc);
        callback(loc);
      }
    );
  };

  return { location, startLocationUpdates };
};
