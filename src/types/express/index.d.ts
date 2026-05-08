import { IUploadedImage } from "../../interfaces/uploaded-image";

declare global {
  namespace Express {
    interface Request {
      uploadedImages: IUploadedImage[];
    }
  }
}
