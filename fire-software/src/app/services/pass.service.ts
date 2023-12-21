import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class PassService {
  private apiKey = '5b3ce3597851110001cf6248334e14eee5ab49b7b8466c00eaead87a';

  constructor(private http: HttpClient) {}

  getRoute(start: L.LatLng, end: L.LatLng) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${this.apiKey}`;
    const params = {
      start: `${start.lng},${start.lat}`,
      end: `${end.lng},${end.lat}`
    };

    return this.http.get(url, { params });
  }
}
