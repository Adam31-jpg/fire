import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { PassService } from "../services/pass.service";
import {Truck} from "../truck/truck.model";
import {Fire} from "../fire/fire.model";
import {Station} from "../station/station.model";
import {StationService} from "../station/station.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  private map!: L.Map;
  trucks: Truck[] = [];
  stations: Station[] = [];
  fires: Fire[] = [];
  private truckMarkers: Map<number, L.Marker> = new Map();


  constructor(private passService: PassService, private stationService: StationService) {}

  ngOnInit(): void {
    this.initMap();
    this.stations = this.stationService.getStations();
    this.initStationsAndTrucks();
  }

  private initStationsAndTrucks(): void {
    // Initialisation des stations et des camions...
    this.stations.forEach(station => {
      station.trucks.forEach(truck => {
        const marker = L.marker([truck.position.lat, truck.position.lng], {
          icon: L.icon({
            iconUrl: 'assets/camion.gif',
            iconSize: [50, 50]
          })
        }).addTo(this.map);
        this.truckMarkers.set(truck.id, marker); // Stocke le marqueur avec l'ID du camion comme clé
      });
    });
  }

  private initMap(): void {
    this.map = L.map('map').setView([46.2276, 2.2137], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  createFire(): void {
    const lat = this.generateRandomCoordinate(43.0, 49.0);
    const lng = this.generateRandomCoordinate(0.0, 5.0);
    const position = new L.LatLng(lat, lng);
    const intensity = this.generateRandomIntensity(1, 10);
    const newFire = new Fire(this.fires.length + 1, position, intensity, 1, 100);
    this.fires.push(newFire);

    L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [50, 50]
      })
    }).addTo(this.map).bindPopup(`Incendie: Intensité ${intensity}`);

    this.dispatchTruckFromClosestStation(position);
  }

  dispatchTruckFromClosestStation(firePosition: L.LatLng): void {
    const closestStation = this.findClosestStation(firePosition);
    if (!closestStation || closestStation.trucks.length === 0) {
      console.log("Aucun camion disponible ou station trouvée.");
      return;
    }

    const truckToSend = closestStation.trucks[0];
    console.log("Camion envoyé depuis la station: ", closestStation.name)

    const truckMarker = this.truckMarkers.get(truckToSend.id);
    if (truckMarker) {
      this.animateTruckMovement(truckMarker, truckToSend.position, firePosition);
    }
  }

  animateTruckMovement(truckMarker: L.Marker, start: L.LatLng, end: L.LatLng): void {
    const steps = 20;
    const latStep = (end.lat - start.lat) / steps;
    const lngStep = (end.lng - start.lng) / steps;

    let currentStep = 0;
    const move = () => {
      if (currentStep <= steps) {
        const nextLat = start.lat + latStep * currentStep;
        const nextLng = start.lng + lngStep * currentStep;
        truckMarker.setLatLng(new L.LatLng(nextLat, nextLng));
        currentStep++;
        requestAnimationFrame(move);
      } else {
        console.log('Camion arrivé à l\'incendie');
        // Ici, vous pouvez gérer la logique une fois que le camion a atteint l'incendie
      }
    };
    move();
  }

  drawRoute(from: L.LatLng, to: L.LatLng): void {
    this.passService.getRoute(from, to).subscribe(routePoints => {
      const polyline = L.polyline(routePoints, { color: 'blue' }).addTo(this.map);
      this.map.fitBounds(polyline.getBounds());
    });
  }


  findClosestStation(firePosition: L.LatLng): Station  | null{
    let closestStation: Station | null = null;
    let shortestDistance = Number.MAX_VALUE;

    this.stations.forEach(station => {
      const distance = firePosition.distanceTo(station.position);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestStation = station;
      }
    });

    return closestStation;
  }


  generateRandomCoordinate(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  generateRandomIntensity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}
