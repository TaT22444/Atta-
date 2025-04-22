declare module 'wmm' {
  interface WMMResult {
    declination: number;
  }

  function wmm(latitude: number, longitude: number, date: Date): WMMResult;
  export default wmm;
} 