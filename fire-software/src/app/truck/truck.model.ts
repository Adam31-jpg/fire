export class Truck {
  constructor(
    public id: number,
    public name: string,
    public capacity: number,
    public position: L.LatLng,
    public isAvailable: boolean
  ) {}
}
