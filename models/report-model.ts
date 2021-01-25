import { INewReport, IReport } from '../interfaces/report-interface';
import { queryToPromise } from './mysql-util';

export function getAllReports(): Promise<IReport[]> {
    return queryToPromise<IReport[]>('SELECT * FROM reports');
}

export function getReportsByLocation(locationId: number): Promise<IReport[]> {
    return queryToPromise<IReport[]>(`
            SELECT * FROM reports
                WHERE locationId = ${locationId};
        `);
}

export function addReport(newReport: INewReport): Promise<IReport> {
    return queryToPromise<IReport>(
        `INSERT INTO reports(locationId, date, catchCount, notes) VALUES
                (
                    ${newReport.locationId},
                    STR_TO_DATE("${newReport.date}",'%Y-%m-%d'),
                    ${newReport.catchCount},
                    "${newReport.notes}"
                );`
    );
}

export function updateReport(reportId: number, newReport: INewReport): Promise<IReport> {
    return queryToPromise<IReport>(
        `UPDATE reports
                SET
                    locationId = ${newReport.locationId},
                    date = STR_TO_DATE("${newReport.date}",'%Y-%m-%d'),
                    catchCount = ${newReport.catchCount},
                    notes = "${newReport.notes}"

                WHERE ID = ${reportId};`
    );
}

export function deleteReport(reportId: number): Promise<void> {
    return queryToPromise<void>(
        `DELETE FROM reports
                WHERE ID = ${reportId};`
    );
}