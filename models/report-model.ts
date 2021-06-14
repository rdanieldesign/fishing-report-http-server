import {
  INewReport,
  IReport,
  IReportDetails,
} from '../interfaces/report-interface';
import { multiQueryToPromise, queryToPromise } from './mysql-util';

const reportDetailsQuery = `
    SELECT DISTINCT
        R.locationId,
        L.name locationName,
        R.catchCount,
        R.date,
        R.notes,
        R.authorId,
        U.name authorName,
        R.id
    FROM reports R
    INNER JOIN locations L ON R.locationId = L.id
    INNER JOIN users U ON R.authorId = U.id
`;

const friendsJoin = `JOIN friends F ON (F.userOneId = @current_user OR F.userTwoId = @current_user)`;
const friendsFilter = `R.authorId != @current_user AND (R.authorId = F.userOneId OR R.authorId = F.userTwoId)`;
const friendsAndMeFilter = `(${friendsFilter}) OR R.authorId = @current_user`;

const reportQuery = 'SELECT * FROM reports';
const setCurrentUser = (currentUserId: number) =>
  `SET @current_user:=${currentUserId};`;

export function getReports(
  params: Partial<IReport>,
  showDetails: boolean,
  currentUserId: number
): Promise<IReport[] | IReportDetails[]> {
  let queryCriteria = Object.keys(params).reduce((criteria, key) => {
    if (criteria) {
      criteria += ' AND ';
    }
    return (criteria += `${key} = ${params[key as keyof IReport]}`);
  }, '');
  if (queryCriteria) {
    queryCriteria = `(${queryCriteria}) AND`;
  }
  const query = `
      ${setCurrentUser(currentUserId)}
      ${showDetails ? reportDetailsQuery : reportQuery}
      ${friendsJoin}
      WHERE
        ${queryCriteria}
        (${friendsAndMeFilter})
      ORDER BY date DESC
      ;
  `;
  return multiQueryToPromise<IReport[] | IReportDetails[]>(query);
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

export function updateReport(
  reportId: number,
  newReport: INewReport
): Promise<IReport> {
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
