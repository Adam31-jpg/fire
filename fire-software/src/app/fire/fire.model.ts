import * as L from 'leaflet';

export class Fire {
  constructor(
    public id: number,
    public position: L.LatLng,
    public intensity: number,
    public size: number,
    public hp: number
  ) {}
}
