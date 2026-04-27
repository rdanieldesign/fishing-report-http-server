import multer from "multer";
import sharp from "sharp";
import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";
import { AWS_BUCKET } from "../config";
import { IUploadedImage } from "../interfaces/uploaded-image";

const s3 = new S3Client({ region: "us-east-1" });

const memoryUpload = multer({
  limits: { files: 5 },
  fileFilter: (_req, file, next) => {
    if (file.mimetype.startsWith("image/")) next(null, true);
  },
  storage: multer.memoryStorage(),
});

async function transformAndUpload(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const files = req.files
    ? (req.files as Express.Multer.File[])
    : req.file
      ? [req.file]
      : [];

  if (!files.length) {
    req.uploadedImages = [];
    return next();
  }

  req.uploadedImages = await Promise.all(
    files.map(async (file): Promise<IUploadedImage> => {
      const key = uuidv4();
      const resized = await sharp(file.buffer)
        .resize({ width: 800 })
        .withMetadata()
        .toBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: key,
          Body: resized,
          ContentType: file.mimetype,
          Metadata: { fieldName: file.fieldname },
        }),
      );

      return {
        originalname: file.originalname,
        key,
        mimetype: file.mimetype,
        size: resized.length,
      };
    }),
  );

  next();
}

export function uploadSingleImage(propertyKey: string) {
  return [memoryUpload.single(propertyKey), transformAndUpload];
}

export function uploadMultipleImages(propertyKey: string) {
  return [memoryUpload.array(propertyKey), transformAndUpload];
}

export async function getSignedImageUrl(imageKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: imageKey });
  return getSignedUrl(s3 as any, command as any, { expiresIn: 5 * 60 });
}

export async function deleteSingleImage(imageId: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: AWS_BUCKET, Key: imageId }));
}

export async function deleteMultipleImages(imageIds: string[]): Promise<void> {
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: AWS_BUCKET,
      Delete: { Objects: imageIds.map((Key) => ({ Key })) },
    }),
  );
}
