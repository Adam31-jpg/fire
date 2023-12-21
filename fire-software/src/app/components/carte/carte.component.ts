import { Component, Inject, NgZone, OnInit } from '@angular/core';
import * as L from 'leaflet';
import {RobotBase} from "../../models/robot-base.model";
import {RobotExtinguisher} from "../../models/robot-extinguisher.model";
import {Fire} from "../../models/fire.model";

@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.scss']
})
export class CarteComponent implements OnInit {
  private map: any;
  robots: RobotBase[] = [];
  private fires: Fire[] = [];
  chance_incendie = 1;
  FRANCE_LAT_MIN = 47.0; // Latitude minimale de la France
  FRANCE_LAT_MAX = 48.0; // Latitude maximale de la France
  FRANCE_LNG_MIN = -4.0; // Longitude minimale de la France
  FRANCE_LNG_MAX = 2.0; // Longitude maximale de la France
  simulationInterval: any; // Variable pour stocker l'intervalle de la simulation
  taille_feu: number = 16;

  constructor(private zone: NgZone, 
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.initRobots();
  }

  startSimulation(): void {
    this.addFire(new L.LatLng(this.generateRandomCoordinate(this.FRANCE_LAT_MIN, this.FRANCE_LAT_MAX), 
                              this.generateRandomCoordinate(this.FRANCE_LNG_MIN, this.FRANCE_LNG_MAX)), 
                  this.generateRandomIntensity(1, 10));
    this.simulationInterval = setInterval(() => {
      this.increaseFireSize(); // Augmente la taille de la première flamme générée
    }, 700);
  }
  
  stopSimulation(): void {
    clearInterval(this.simulationInterval);
    this.removeAllRobots();
    this.fires = [];
  }

  removeAllRobots(): void {
    this.robots = []; // Vide le tableau des robots
  }
  
  initMap(): void {
    this.map = L.map('map', {
      center: [46.2276, 2.2137],
      zoom: 6
    });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });
    tiles.addTo(this.map);
  }

  initRobots(): void {
    const initialRobotPositions = [
      new L.LatLng(43.6045, 1.444),
    ];
    initialRobotPositions.forEach((position, index) => {
      const robot = new RobotExtinguisher(index, position, 1000);
      this.robots.push(robot);
      L.marker([position.lat, position.lng], {
        icon: L.icon({
          iconUrl: 'assets/camion-icon.png',
          iconSize: [24, 24]
        })
      }).addTo(this.map).bindPopup(`Robot pompier #${index}`);
    });
  }

  increaseFireSize(): void {
    this.taille_feu += 2; // Augmenter la taille des flammes
    this.fires.forEach(fire => {
      fire.intensity += 1; // Augmenter l'intensité de chaque flamme
      // Mise à jour de la taille de la flamme
      const fireMarker = L.marker([fire.position.lat, fire.position.lng], {
        icon: L.icon({
          iconUrl: 'assets/fire.gif',
          iconSize: [fire.size += 2, fire.size += 2] // Utiliser la taille spécifiée pour le marqueur
        })
      }).addTo(this.map);
      fireMarker.bindPopup(`Incendie #${fire.id}: Intensité ${fire.intensity}`);
    });
    console.log("Augmentation de la taille du feu");
  }
  
  private addFire(position: L.LatLng, intensity: number): void {
    const newFire: Fire = {
      id: this.fires.length + 1,
      position: position,
      intensity: intensity,
      size: 16,
      hp: 10,
    };
    console.log(newFire, this.fires, 'addFire');
    this.fires.push(newFire);
    const fireMarker = L.marker([position.lat, position.lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [newFire.size, newFire.size]
      })
    }).addTo(this.map);

    fireMarker.bindPopup(`Incendie #${newFire.id}: Intensité ${intensity}`);
  }

  // Fonction utilitaire pour générer aléatoirement une coordonnée
  generateRandomCoordinate(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  // // Fonction utilitaire pour générer aléatoirement une intensité
  generateRandomIntensity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
