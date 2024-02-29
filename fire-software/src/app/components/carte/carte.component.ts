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
  FRANCE_LAT_MIN = 43.0;
  FRANCE_LAT_MAX = 49.0;
  FRANCE_LNG_MIN = 0.0;
  FRANCE_LNG_MAX = 5.0;
  simulationInterval: any;
  taille_feu: number = 16;
  TAILLE_FEU_MAX = 50;
  private camionMarkers: Map<CamionPompierBase, L.Marker> = new Map();
  constructor(private zone: NgZone, private passService: PassService) {}
  private extinguishingFires: Set<number> = new Set();

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
    this.createRoute();
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
      if (!fire.isBeingExtinguished) {
        fire.intensity += 2;
        fire.size = Math.min(fire.size + 2, this.TAILLE_FEU_MAX);

        const fireMarker = this.fireMarkers.get(fire.id);
        if (fireMarker) {
          fireMarker.setIcon(L.icon({
            iconUrl: 'assets/fire.gif',
            iconSize: [fire.size, fire.size]
          }));

          // Mettez à jour le contenu du popup pour refléter la nouvelle intensité
          fireMarker.setPopupContent(`Incendie #${fire.id}: Intensité ${fire.intensity}`);
        }
      }
    });
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

  private fireMarkers: Map<number, L.Marker> = new Map();
  private routePolylines: Map<number, L.Polyline> = new Map();

  drawRouteToFire(camionPosition: L.LatLng, firePosition: L.LatLng) {
    this.passService.getRoute(camionPosition, firePosition).subscribe(
      (routeData: any) => {
        const coordinates = routeData.features[0].geometry.coordinates;
        // Définition de latLngs à l'intérieur de cette fonction
        const latLngs = coordinates.map((coord: [number, number]) => L.latLng(coord[1], coord[0]));
        const routePolyline = L.polyline(latLngs, { color: 'red', weight: 5 }).addTo(this.map);
        this.map.fitBounds(routePolyline.getBounds());

        const fire = this.fires.find(f => f.position.equals(firePosition));
        if (fire) {
          this.routePolylines.set(fire.id, routePolyline);
        }

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
            // Appel à extinguishFireAt ici après que le camion atteint le feu
            if (fire) {
              this.extinguishFireAt(firePosition);
            } else {
              // Pas de feu à destination, supprime simplement la ligne
              routePolyline.remove();
            }

          }
        }, 20);
      },
      error => {
        console.error('Erreur lors de la récupération de l\'itinéraire:', error);
      }
    );
  }

  private extinguishFireAt(firePosition: L.LatLng) {
    const fireIndex = this.fires.findIndex(f => f.position.equals(firePosition));
    if (fireIndex === -1) {
      console.error('Feu non trouvé à cette position');
      return;
    }
    const fire = this.fires[fireIndex];
    const camion = this.camions[0];
    const extinguishInterval = setInterval(() => {
      this.extinguishingFires.add(fire.id);
      console.log(`Tentative d'extinction, intensité actuelle : ${fire.intensity}`);
      if (fire.intensity > 0) {
        fire.intensity -= 20;
        fire.size = Math.max(fire.size - 4, 0);
      } else {
        fire.isBeingExtinguished = true;
        clearInterval(extinguishInterval);
        console.log(`Feu éteint à la position : [${firePosition.lat}, ${firePosition.lng}]`);
        this.extinguishingFires.delete(fire.id);

        // Suppression du marqueur du feu
        const fireMarker = this.fireMarkers.get(fire.id);

        if (fireMarker) {
          fireMarker.remove();
          this.fireMarkers.delete(fire.id);
        } else {
          console.error('Marqueur non trouvé pour l\'ID:', fire.id);
        }

        // Suppression de la route de la carte
        const routePolyline = this.routePolylines.get(fire.id);
        if (routePolyline) {
          routePolyline.remove();
          this.routePolylines.delete(fire.id);
        }
        // Supprimez le feu de la liste des feux actifs
        this.fires.splice(fireIndex, 1);

        // Dessiner l'itinéraire de retour vers le point de départ
        this.drawRouteToFire(firePosition, camion.position);
      }
    }, 1000);
  }

  private addFire(position: L.LatLng, intensity: number): void {
    // Lors de l'ajout d'un nouveau feu, stockez également le marqueur dans `fireMarkers`
    const newFire: Fire = {
      id: this.fires.length + 1,
      position: position,
      intensity: intensity,
      size: this.taille_feu,
      hp: 10,
      isBeingExtinguished: false
    };
    this.fires.push(newFire);
    const fireMarker = L.marker([position.lat, position.lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [newFire.size, newFire.size]
      })
    }).addTo(this.map).bindPopup(`Incendie #${newFire.id}: Intensité ${intensity}`);
    this.fireMarkers.set(newFire.id, fireMarker);
  }

  createRoute() {
    if (this.camions.length > 0) {
      const camion = this.camions[0];
      const camionMarker = this.camionMarkers.get(camion);

      if (camionMarker) {
        const camionPosition = camionMarker.getLatLng();

        this.fires.forEach(fire => {
          this.drawRouteToFire(camionPosition, fire.position);
        });
      } else {
        console.error('Marqueur du camion non trouvé');
      }
    } else {
      console.error('Aucun camion disponible pour tracer une route');
    }
  }
}
