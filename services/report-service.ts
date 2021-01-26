import { ParsedQs } from 'qs';
import { INewReport, IReport } from '../interfaces/report-interface';
import {
    getAllReports as getAllReportsModel,
    getReportsByLocation,
    addReport as addReportModel,
    updateReport as updateReportModel,
    deleteReport as deleteReportModel,
    getReportById,
} from '../models/report-model';

export function getReports(queryParams: ParsedQs): Promise<IReport[]> {
    if (queryParams && queryParams.locationId) {
        return getReportsByLocation(parseInt(queryParams.locationId as string));
    }
    return getAllReportsModel();
}

export function getReport(reportId: string): Promise<IReport | null> {
    return getReportById(parseInt(reportId))
        .then((res: IReport[]): IReport | null => {
            if (res && res[0]) {
                return res[0];
            } else {
                return null;
            }
        });
}

export function addReport(newReport: INewReport): Promise<IReport> {
    return addReportModel(newReport);
}

export function updateReport(reportId: string, newReport: INewReport): Promise<IReport> {
    return updateReportModel(parseInt(reportId), newReport);
}

export function deleteReport(reportId: string): Promise<void> {
    return deleteReportModel(parseInt(reportId));
}