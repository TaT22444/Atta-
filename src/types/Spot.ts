// src/types/Spot.ts
export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image?: string; // オプションで画像URLを追加
  distance?: number; // スポットまでの距離
}
