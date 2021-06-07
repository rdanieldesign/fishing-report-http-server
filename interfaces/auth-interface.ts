export interface IVerifiedTokenResponse {
  status: 403 | 401 | 200;
  decodedToken: IDecodedAuthToken | null;
  message: string | null;
}

export interface IDecodedAuthToken {
  userId: number;
}

export interface ICredentials {
  email: string;
  password: string;
}
