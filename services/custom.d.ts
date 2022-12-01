declare namespace Express {
  export interface Request {
    authenticatedUserId?: number;
  }

  export namespace MulterS3 {
    interface Transform {
      id: string;
      size: number;
      bucket: string;
      key: string;
      acl: string;
      contentType: string;
      metadata: null;
      location: string;
      etag: string;
      metadata: any;
      storageClass: string;
      contentDisposition: string;
      serverSideEncryption: boolean;
    }
    export interface File {
      transforms: Transform[];
    }
  }
}

declare module "multer-s3-transform" {
  interface Callback<T> {
    (error: Error): void;
    (error: null, value: T): void;
  }

  interface Transform {
    id: string;
    key: (
      req: Request,
      file: Express.Multer.File,
      cb: Callback<string>
    ) => void;
    transform: (req: Request, file: Express.Multer.File, cb: Callback) => void;
  }

  interface Options {
    s3: s3;
    bucket: string;
    metadata: (req: Request, file: Express.Multer.File, cb: Callback) => void;
    // key: (
    //   req: Request,
    //   file: Express.Multer.File,
    //   cb: Callback<string>
    // ) => void;
    shouldTransform: (
      req: Request,
      file: Express.Multer.File,
      cb: Callback
    ) => void;
    transforms: Transform[];
  }

  interface MulterS3Transform {
    (options: Options): any;
  }

  declare const multerS3: MulterS3Transform;
  export = multerS3;
}
