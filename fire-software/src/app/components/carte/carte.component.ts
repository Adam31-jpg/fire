import { Component, OnInit, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { CamionPompierBase } from "../../models/camion-pompier-base.model";
import { CamionPompierExtincteur } from "../../models/camion-pompier-extincteur.model";
import { Fire } from "../../models/fire.model";
import {PassService} from "../../services/pass.service";


@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.scss']
})
export class CarteComponent implements OnInit {
  private map: any;
  camions: CamionPompierBase[] = [];
  private fires: Fire[] = [];
  chance_incendie = 1;
  FRANCE_LAT_MIN = 47.0;
  FRANCE_LAT_MAX = 48.0;
  FRANCE_LNG_MIN = -4.0;
  FRANCE_LNG_MAX = 2.0;
  simulationInterval: any;
  taille_feu: number = 16;
  TAILLE_FEU_MAX = 50;
  private camionMarkers: Map<CamionPompierBase, L.Marker> = new Map();
  constructor(private zone: NgZone, private passService: PassService) {}

  ngOnInit(): void {
    this.initMap();
    this.initCamionsPompiers();
  }

  startSimulation(): void {
    let position;
    do {
      position = new L.LatLng(
        this.generateRandomCoordinate(this.FRANCE_LAT_MIN, this.FRANCE_LAT_MAX),
        this.generateRandomCoordinate(this.FRANCE_LNG_MIN, this.FRANCE_LNG_MAX)
      );
    } while (!this.isLand(position));

    this.addFire(position, this.generateRandomIntensity(1, 10));
    this.simulationInterval = setInterval(() => {
      this.increaseFireSize();
    }, 700);
  }

  stopSimulation(): void {
    clearInterval(this.simulationInterval);
    this.removeAllCamions();
    this.fires = [];
  }

  initMap(): void {
    this.map = L.map('map', {
      center: [46.2276, 2.2137],
      zoom: 6
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  initCamionsPompiers(): void {
    const initialPositions = [
      new L.LatLng(43.6045, 1.444),
    ];
    initialPositions.forEach((position, index) => {
      const camion = new CamionPompierExtincteur(index, position, 1000);
      this.camions.push(camion);

      const camionMarker = L.marker([position.lat, position.lng], {
        icon: L.icon({
          iconUrl: 'assets/camion.gif',
          iconSize: [50, 50]
        })
      }).addTo(this.map).bindPopup(`Capacité d'eau: ${camion.waterCapacity}L`);

      this.camionMarkers.set(camion, camionMarker);
    });
  }

  removeAllCamions(): void {
    this.camions = [];
  }

  increaseFireSize(): void {
    this.fires.forEach(fire => {
      fire.intensity += 1;
      fire.size = Math.min(fire.size + 2, this.TAILLE_FEU_MAX);
      L.marker([fire.position.lat, fire.position.lng], {
        icon: L.icon({
          iconUrl: 'assets/fire.gif',
          iconSize: [fire.size, fire.size]
        })
      }).addTo(this.map).bindPopup(`Incendie #${fire.id}: Intensité ${fire.intensity}`);
    });
  }

  private addFire(position: L.LatLng, intensity: number): void {
    const newFire: Fire = {
      id: this.fires.length + 1,
      position: position,
      intensity: intensity,
      size: this.taille_feu,
      hp: 10,
    };
    this.fires.push(newFire);
    L.marker([position.lat, position.lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [newFire.size, newFire.size]
      })
    }).addTo(this.map).bindPopup(`Incendie #${newFire.id}: Intensité ${intensity}`);
  }

  generateRandomCoordinate(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  generateRandomIntensity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private isLand(position: L.LatLng): boolean {
    return true; // Implémenter la logique de vérification de la terre
  }

  drawRouteToFire(camionPosition: L.LatLng, firePosition: L.LatLng) {
    this.passService.getRoute(camionPosition, firePosition).subscribe(
      (routeData: any) => {
        const coordinates = routeData.features[0].geometry.coordinates;
        const latLngs = coordinates.map((coord: [number, number]) => L.latLng(coord[1], coord[0]));

        const routePolyline = L.polyline(latLngs, {
          color: 'red',
          weight: 5
        }).addTo(this.map);

        this.map.fitBounds(routePolyline.getBounds());

        // Animation du camion
        const camion = this.camions[0];
        const camionMarker = this.camionMarkers.get(camion);

        if (!camionMarker) {
          console.error('Marqueur du camion non trouvé');
          return;
        }

        let i = 0;
        const interval = setInterval(() => {
          if (i < latLngs.length) {
            camionMarker.setLatLng(latLngs[i]);
            i++;
          } else {
            clearInterval(interval);
          }
        }, 20); // Si bug d'animation changer la durée ici
      },
      error => {
        console.error('Erreur lors de la récupération de l\'itinéraire:', error);
      }
    );
  }

  createRoute() {
    const toulouse = new L.LatLng(43.6045, 1.444);
    const paris = new L.LatLng(48.8566, 2.3522);
    //const london = new L.LatLng(51.5074, -0.1278);
    //const moscow = new L.LatLng(55.7558, 37.6173);
    //const dubai = new L.LatLng(25.276987, 55.296249);

    this.drawRouteToFire(toulouse, paris);
  }
}
