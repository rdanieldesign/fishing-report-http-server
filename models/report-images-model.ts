import { IReportImage } from '../interfaces/report-interface';
import { queryToPromise } from './mysql-util';

export function addReportImages(
  reportId: number,
  imageIds: string[]
): Promise<void> {
  const reportImageRows = imageIds.map(
    (imageId) => `('${reportId}', '${imageId}')`
  );
  return queryToPromise<void>(
    `
    INSERT INTO report_images(reportId, imageId) VALUES
      ${reportImageRows.join(',')}
      ;
    `
  );
}

export function getReportImages(reportId: number): Promise<IReportImage[]> {
  return queryToPromise<IReportImage[]>(
    `
    SELECT * FROM report_images WHERE reportId = ${reportId}
      ;
    `
  );
}
