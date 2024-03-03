import { Truck } from './truck.model';

describe('Truck', () => {
  it('should create an instance', () => {
    expect(new Truck(1, "T1", 1050)).toBeTruthy();
  });
});
