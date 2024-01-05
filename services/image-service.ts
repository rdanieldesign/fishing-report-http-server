import multer from "multer";
import multerS3Transform from "multer-s3-transform";
import aws from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { AWS_BUCKET } from "../secret";

const s3 = new aws.S3({ region: "us-east-1" });

const maxSize = 5 * 1000 * 1000;

function uploadImage() {
  return multer({
    limits: {
      // fileSize: maxSize,
      files: 5,
    },
    fileFilter: function (req, file, next) {
      const isPhoto = file.mimetype.startsWith("image/");
      if (isPhoto) {
        next(null, true); // null for error means it worked and it is fine to continue to next()
      }
    },
    storage: multerS3Transform({
      s3: s3,
      bucket: AWS_BUCKET,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      shouldTransform: function (req, file, cb) {
        cb(null, /^image/i.test(file.mimetype));
      },
      transforms: [
        {
          id: "original",
          key: function (req, file, cb) {
            cb(null, uuidv4());
          },
          transform: function (req, file, cb) {
            cb(null, sharp().resize({ width: 800 }).withMetadata());
          },
        },
      ],
    }),
  });
}

export function uploadSingleImage(propertyKey: string) {
  return uploadImage().single(propertyKey);
}

export function uploadMutlipleImages(propertyKey: string) {
  console.log("uploading images");
  return uploadImage().array(propertyKey);
}

export function getSignedImageUrl(imageKey: string): string {
  return s3.getSignedUrl("getObject", {
    Bucket: AWS_BUCKET,
    Key: imageKey,
    Expires: 5 * 60, // 5 minutes
  });
}

export function deleteSingleImage(imageId: string) {
  return s3.deleteObject({ Bucket: AWS_BUCKET, Key: imageId }, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

export function deleteMultipleImages(imageIds: string[]) {
  return s3.deleteObjects(
    {
      Bucket: AWS_BUCKET,
      Delete: { Objects: imageIds.map((imageId) => ({ Key: imageId })) },
    },
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
}
