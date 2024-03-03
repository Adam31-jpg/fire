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
  private fireMarkers: Map<number, L.Marker> = new Map();
  private routePolylines: Map<number, L.Polyline> = new Map();



  constructor(private passService: PassService, private stationService: StationService) {}

  ngOnInit(): void {
    this.initMap();
    this.stations = this.stationService.getStations();
    this.initStationsAndTrucks();
  }

  private initStationsAndTrucks(): void {
    this.stations.forEach(station => {
      station.trucks.forEach(truck => {
        const marker = L.marker([truck.position.lat, truck.position.lng], {
          icon: L.icon({
            iconUrl: 'assets/camion.gif',
            iconSize: [50, 50]
          })
        }).addTo(this.map);
        this.truckMarkers.set(truck.id, marker);
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

    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [50, 50]
      })
    }).addTo(this.map).bindPopup(`Incendie: Intensité ${intensity}`);

    this.fireMarkers.set(newFire.id, marker);

    this.dispatchTruckFromClosestStation(position, newFire);
  }

  dispatchTruckFromClosestStation(firePosition: L.LatLng, fire: Fire): void {
    const closestStation = this.findClosestStation(firePosition);
    if (!closestStation || closestStation.trucks.length === 0) {
      console.log("Aucun camion disponible ou station trouvée.");
      return;
    }

    if (closestStation.trucks.find(t => t.isAvailable) === undefined) {
      console.log("Aucun camion disponible dans la station la plus proche.");
      return;
    }

    const truckToSend = closestStation.trucks.find(t => t.isAvailable);
    truckToSend!.isAvailable = false;
    console.log("Camion envoyé depuis la station: ", closestStation.name);

    const truckMarker = this.truckMarkers.get(truckToSend!.id);
    if (truckMarker) {
      this.passService.getRoute(truckToSend!.position, firePosition).subscribe(routePoints => {
        // Dessiner la route
        this.drawRoute(truckToSend!.position, firePosition, truckToSend!.id);

        // Animer le camion le long de la route plus lentement et gérer l'extinction de l'incendie
        this.animateTruckMovement(truckMarker, routePoints, truckToSend!, fire, closestStation);
      });
    }
  }

  animateTruckMovement(truckMarker: L.Marker, routePoints: L.LatLng[], truck: Truck, fire: Fire, station: Station): void {
    let currentStep = 0;
    const move = () => {
      if (currentStep < routePoints.length) {
        truckMarker.setLatLng(routePoints[currentStep]);
        currentStep++;
        setTimeout(move, 10);
      } else {
        console.log('Camion arrivé à l\'incendie');
        this.extinguishFire(fire);
        this.passService.getRoute(routePoints[routePoints.length - 1], station.position).subscribe(returnRoute => {
          this.drawRoute(routePoints[routePoints.length - 1], station.position, truck.id);
          const polyline = this.routePolylines.get(truck.id);
          if (polyline) {
            polyline.remove(); // Enlevez la polyligne de la carte
            this.routePolylines.delete(truck.id); // Supprimez la référence
          }
          this.animateTruckReturn(truckMarker, returnRoute, truck, station);
        });
      }
    };
    move();
  }

  animateTruckReturn(truckMarker: L.Marker, returnRoute: L.LatLng[], truck: Truck, station: Station): void {
    let currentStep = 0;
    const moveBack = () => {
      if (currentStep < returnRoute.length) {
        truckMarker.setLatLng(returnRoute[currentStep]);
        currentStep++;
        setTimeout(moveBack, 10);
      } else {
        console.log('Camion retourné à la station');

        const polyline = this.routePolylines.get(truck.id);
        if (polyline) {
          polyline.remove(); // Enlevez la polyligne de la carte
          this.routePolylines.delete(truck.id); // Supprimez la référence
        }
        truck.isAvailable = true;
      }
    };
    moveBack();
  }


  extinguishFire(fire: Fire): void {
    console.log(`Extinction de l'incendie ${fire.id}`);
    const fireMarker = this.fireMarkers.get(fire.id);
    if (fireMarker) {
      let size = 50; // Taille initiale, ajustez selon votre configuration actuelle
      const shrink = () => {
        if (size > 0) {
          size -= 5; // Réduction progressive
          fireMarker.setIcon(L.icon({
            iconUrl: 'assets/fire.gif',
            iconSize: [size, size]
          }));
          setTimeout(shrink, 100); // Répétez jusqu'à disparition
        } else {
          fireMarker.remove(); // Enlevez le marqueur de la carte
          this.fireMarkers.delete(fire.id); // Retirez le marqueur de la collection
        }
      };
      shrink();

      // Supprimez l'incendie de la liste des incendies actifs
      const fireIndex = this.fires.findIndex(f => f.id === fire.id);
      if (fireIndex !== -1) {
        this.fires.splice(fireIndex, 1);
      }
    }
  }


  drawRoute(from: L.LatLng, to: L.LatLng, truckId: number): void {
    this.passService.getRoute(from, to).subscribe(routePoints => {
      const polyline = L.polyline(routePoints, { color: 'blue' }).addTo(this.map);
      this.map.fitBounds(polyline.getBounds());
      this.routePolylines.set(truckId, polyline); // Stockez la référence à la polyligne
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
