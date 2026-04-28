export interface IError {
  status: number;
  message: string;
}

export function sendUnauthorizedMessage(): Promise<never> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to delete this record.",
  };
  return Promise.reject(error);
}
