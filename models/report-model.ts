import { INewReport, IReport, IReportDetails } from '../interfaces/report-interface';
import { queryToPromise } from './mysql-util';

const reportDetailsQuery = `
    SELECT
        r.locationId,
        l.name locationName,
        r.catchCount,
        r.date,
        r.notes,
        r.authorId,
        r.id
    FROM
        reports r
    INNER JOIN
        locations l
    ON
        r.locationId = l.id
`;

const reportQuery = 'SELECT * FROM reports';

export function getReports(params: Partial<IReport>, showDetails: boolean): Promise<IReport[] | IReportDetails[]> {
    const queryCriteria = Object.keys(params).reduce((criteria, key) => {
        if (criteria) {
            criteria += ' AND ';
        }
        return criteria += `${key} = ${params[key as keyof IReport]}`;

    }, '');
    return queryToPromise<IReport[] | IReportDetails[]>(`
        ${showDetails ? reportDetailsQuery : reportQuery}
        ${queryCriteria ? 'WHERE' : ''}
        ${queryCriteria}
        ORDER BY date DESC
        ;
    `);
}

export function getReportById(reportId: number): Promise<IReport[]> {
    return queryToPromise<IReport[]>(`
        ${reportDetailsQuery}
        WHERE r.id = ${reportId}
        LIMIT 1
            ; 
    `);
}

export function addReport(newReport: INewReport): Promise<IReport> {
    return queryToPromise<IReport>(
        `INSERT INTO reports(locationId, date, catchCount, notes, authorId) VALUES
                (
                    ${newReport.locationId},
                    "${newReport.date}",
                    ${newReport.catchCount},
                    "${newReport.notes}",
                    "${newReport.authorId}"
                );`
    );
}

export function updateReport(reportId: number, newReport: INewReport): Promise<IReport> {
    return queryToPromise<IReport>(
        `UPDATE reports
                SET
                    locationId = ${newReport.locationId},
                    date = "${newReport.date}",
                    catchCount = ${newReport.catchCount},
                    notes = "${newReport.notes}",
                    authorId = "${newReport.authorId}"

                WHERE ID = ${reportId};`
    );
}

export function deleteReport(reportId: number): Promise<void> {
    return queryToPromise<void>(
        `DELETE FROM reports
                WHERE ID = ${reportId};`
    );
}