declare module 'geomagnetism' {
  interface GeomagnetismModel {
    point: (latitude: number, longitude: number) => { decl: number };
  }

  interface Geomagnetism {
    model: () => GeomagnetismModel;
  }

  const geomagnetism: Geomagnetism;
  export default geomagnetism;
} 