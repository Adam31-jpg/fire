import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import * as L from 'leaflet';
import {map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PassService {
  private apiKey = '5b3ce3597851110001cf6248334e14eee5ab49b7b8466c00eaead87a';

  constructor(private http: HttpClient) {}

  getRoute(start: L.LatLng, end: L.LatLng): Observable<L.LatLng[]> {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('start', `${start.lng},${start.lat}`)
      .set('end', `${end.lng},${end.lat}`);

    return this.http.get<any>(url, { params }).pipe(
      map(response => {
        // Exemple de conversion, dépend de la structure de votre réponse API
        const coordinates = response.features[0].geometry.coordinates;
        return coordinates.map((coord: [number, number]) => L.latLng(coord[1], coord[0]));
      })
    );
  }

}

