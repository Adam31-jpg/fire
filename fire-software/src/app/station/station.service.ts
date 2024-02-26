import { Injectable } from '@angular/core';
import {Truck} from "../truck/truck.model";
import {Station} from "./station.model";
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private stations: Station[] = [
    new Station(1, 'Station Paris', L.latLng(48.8566,2.3522), [
      new Truck(1, 'Truck Paris 1', 1000, L.latLng(48.8566,2.3522)),
      new Truck(2, 'Truck Paris 2', 1500, L.latLng(48.8566,2.3522))
    ]),
    new Station(2, 'Station Marseille', L.latLng(43.2965,5.3698), [
      new Truck(3, 'Truck Marseille 1', 1200, L.latLng(43.2965,5.3698)),
      new Truck(4, 'Truck Marseille 2', 1400, L.latLng(43.2965,5.3698))
    ]),
    new Station(3, 'Station Lyon', L.latLng(45.7640,4.8357), [
      new Truck(5, 'Truck Lyon 1', 1100, L.latLng(45.7640,4.8357)),
      new Truck(6, 'Truck Lyon 2', 1300, L.latLng(45.7640,4.8357))
    ]),
    new Station(4, 'Station Toulouse', L.latLng(43.6045,1.4442), [
      new Truck(7, 'Truck Toulouse 1', 1250, L.latLng(43.6045,1.4442)),
      new Truck(8, 'Truck Toulouse 2', 1350, L.latLng(43.6045,1.4442))
    ]),
    new Station(5, 'Station Nice', L.latLng(43.7102,7.2620), [
      new Truck(9, 'Truck Nice 1', 1150, L.latLng(43.7102,7.2620)),
      new Truck(10, 'Truck Nice 2', 1450, L.latLng(43.7102,7.2620))
    ])
  ];

  constructor() { }

  getStations(): Station[] {
    return this.stations;
  }
}
