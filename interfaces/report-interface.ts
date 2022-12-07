export interface INewReport {
  locationId: number;
  catchCount: number;
  date: string;
  notes: string;
  authorId: number;
  imageIds: string[];
}

export interface INewReportModel extends Omit<INewReport, "imageIds"> {
  imageIds: string; // JSON string array
}

export interface IReportModel extends INewReportModel {
  id: number;
}

export interface IReport extends Omit<IReportModel, "imageIds"> {
  images?: IReportImage[];
}

export interface IReportImage {
  imageURL: string;
  imageId: string;
}

export interface IReportDetails extends IReport {
  locationName: string;
  locationLink: string;
}
