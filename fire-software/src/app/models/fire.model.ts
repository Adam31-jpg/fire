export interface Fire {
  id: number;
  position: L.LatLng;
  intensity: number;
  size: number;
  hp: number;
  isBeingExtinguished: boolean;
}
