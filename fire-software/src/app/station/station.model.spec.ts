import * as L from 'leaflet';
import { Station } from './station.model';

describe('Station', () => {
  it('should create an instance', () => {
    expect(new Station(1, "Toulouse", L.latLng(0,0), [])).toBeTruthy();
  });
});
