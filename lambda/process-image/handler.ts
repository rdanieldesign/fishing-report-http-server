import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import sharp from "sharp";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

const PROCESSED_BUCKET = process.env.AWS_BUCKET!;
const API_URL = process.env.API_URL!;
const SERVICE_SECRET = process.env.SERVICE_SECRET!;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function processRecord(
  record: S3Event["Records"][number],
): Promise<void> {
  const sourceBucket = record.s3.bucket.name;
  const sourceKey = decodeURIComponent(
    record.s3.object.key.replace(/\+/g, " "),
  );

  const getResult = await s3.send(
    new GetObjectCommand({ Bucket: sourceBucket, Key: sourceKey }),
  );

  const reportId = getResult.Metadata?.reportid;
  if (!reportId) {
    console.error(`No reportid metadata on object ${sourceKey} — skipping`);
    return;
  }

  const contentType = getResult.ContentType ?? "image/jpeg";
  const bodyBuffer = await streamToBuffer(getResult.Body as Readable);

  const resized = await sharp(bodyBuffer)
    .resize({ width: 800 })
    .withMetadata()
    .toBuffer();

  await s3.send(
    new PutObjectCommand({
      Bucket: PROCESSED_BUCKET,
      Key: sourceKey,
      Body: resized,
      ContentType: contentType,
    }),
  );

  const response = await fetch(`${API_URL}/api/reports/${reportId}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-secret": SERVICE_SECRET,
    },
    body: JSON.stringify({ imageKey: sourceKey }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update report ${reportId}: ${response.status} ${await response.text()}`,
    );
  }

  console.log(`Processed image for report ${reportId}: ${sourceKey}`);
}

export const handler = async (event: S3Event): Promise<void> => {
  await Promise.all(event.Records.map(processRecord));
};
