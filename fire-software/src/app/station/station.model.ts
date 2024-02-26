import {Truck} from "../truck/truck.model";

export class Station {
  constructor(
    public id: number,
    public name: string,
    public position: L.LatLng,
    public trucks: Truck[]
  ) {}
}
