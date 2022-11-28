import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const s3 = new aws.S3({ region: "us-east-1" });

function uploadImage() {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: "fishingreport",
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, uuidv4());
      },
    }),
  });
}

export function uploadSingleImage(propertyKey: string) {
  return uploadImage().single(propertyKey);
}

export function uploadMutlipleImages(propertyKey: string) {
  return uploadImage().array(propertyKey);
}

export function getSignedImageUrl(imageKey: string): string {
  return s3.getSignedUrl("getObject", {
    Bucket: "fishingreport",
    Key: imageKey,
    Expires: 5 * 60, // 5 minutes
  });
}

export function deleteSingleImage(imageId: string) {
  return s3.deleteObject({ Bucket: "fishingreport", Key: imageId }, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

export function deleteMultipleImages(imageIds: string[]) {
  return s3.deleteObjects(
    {
      Bucket: "fishingreport",
      Delete: { Objects: imageIds.map((imageId) => ({ Key: imageId })) },
    },
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
}
