import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { AWS_BUCKET, AWS_ORIGINAL_BUCKET } from "../config";

export interface IUploadedImage {
  originalname: string;
  key: string;
  mimetype: string;
  size: number;
}

export interface ISignedImageURL {
  uploadUrl: string;
  key: string;
  filename: string;
}

export type ImageMetadata = { filename: string; mimetype: string };

const s3 = new S3Client({ region: "us-east-1" });

export async function getSignedImageUrl(imageKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: imageKey });
  return getSignedUrl(s3, command, { expiresIn: 5 * 60 });
}

export async function deleteMultipleImages(imageIds: string[]): Promise<void> {
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: AWS_BUCKET,
      Delete: { Objects: imageIds.map((Key) => ({ Key })) },
    }),
  );
}

export async function getSignedPutURLs(
  imageMetadata: ImageMetadata[],
  reportImageIds: number[],
): Promise<ISignedImageURL[]> {
  return Promise.all(
    imageMetadata.map(async ({ filename, mimetype }, i) => {
      const key = uuidv4();
      const command = new PutObjectCommand({
        Bucket: AWS_ORIGINAL_BUCKET,
        Key: key,
        ContentType: mimetype,
        Metadata: { reportimageid: reportImageIds[i].toString() },
      });
      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 5 * 60,
      });
      return { uploadUrl, key, filename };
    }),
  );
}
