export interface INewReport {
    locationId: number;
    catchCount: number;
    date: string;
    notes: string;
    authorId: number;
}

export interface IReport extends INewReport {
    id: number;
}

export interface IReportDetails extends IReport {
    locationName: string;
    locationLink: string;
}