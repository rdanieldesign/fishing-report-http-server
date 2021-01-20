export interface INewLocation {
  name: string;
  googleMapsLink: string;
}

export interface ILocation extends INewLocation {
  id: number;
}