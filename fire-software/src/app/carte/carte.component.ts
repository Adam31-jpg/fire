import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import {RobotBase} from "../models/robot-base.model";
import {RobotExtinguisher} from "../models/robot-extinguisher.model";
import {Fire} from "../models/fire.model";

@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.scss']
})
export class CarteComponent implements OnInit {
  private map: any;
  robots: RobotBase[] = [];
  private fires: Fire[] = [];

  private initMap(): void {
    this.map = L.map('map', {
      center: [46.2276, 2.2137],
      zoom: 6
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    tiles.addTo(this.map);
  }

  private initRobots(): void {
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
      }).addTo(this.map).bindPopup(`Réservoir d'eau: ${robot.waterCapacity}L`);
    });
  }

  private addFire(position: L.LatLng, intensity: number): void {
    const fireId = this.fires.length + 1;
    const fire = new Fire(fireId, position, intensity);
    this.fires.push(fire);

    const fireMarker = L.marker([position.lat, position.lng], {
      icon: L.icon({
        iconUrl: 'assets/fire.gif',
        iconSize: [32, 32]
      })
    }).addTo(this.map);
  }

  ngOnInit(): void {
    this.initMap();
    this.addFire(new L.LatLng(48.8566, 2.3522), 5);
    this.initRobots();
  }

}
