export interface INewReport {
    locationId: number;
    catchCount: number;
    date: string;
    notes: string;
}

export interface IReport extends INewReport {
    id: number;
}

export interface IReportDetails extends IReport {
    locationName: string;
    locationLink: string;
}