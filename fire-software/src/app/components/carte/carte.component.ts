import { Component, OnInit, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { CamionPompierBase } from "../../models/camion-pompier-base.model";
import { CamionPompierExtincteur } from "../../models/camion-pompier-extincteur.model";
import { Fire } from "../../models/fire.model";

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

  constructor(private zone: NgZone) {}

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

  removeAllCamions(): void {
    this.camions = [];
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
      L.marker([position.lat, position.lng], {
        icon: L.icon({
          iconUrl: 'assets/camion.gif',
          iconSize: [50, 50]
        })
      }).addTo(this.map).bindPopup(`Capacité d'eau: ${camion.waterCapacity}L`);
    });
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
}
