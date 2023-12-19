import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.css']
})
export class CarteComponent implements OnInit {

  private map: any;

  private initMap(): void {
    this.map = L.map('map', {
      center: [46.2276, 2.2137], // Coordonnées de la France
      zoom: 6
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    tiles.addTo(this.map);
  }

  ngOnInit(): void {
    this.initMap();
  }

}
