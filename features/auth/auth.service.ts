import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { SECRET } from "../../config";
import type { IError } from "../../shared/errors";
import { addUser, getUserWithPasswordByEmail } from "../users/users.service";
import type {
  ICredentials,
  IDecodedAuthToken,
  IVerifiedTokenResponse,
} from "./auth.types";

export function verifyToken(token: string): Promise<IVerifiedTokenResponse> {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject({ decodedToken: null, status: 401, message: "No Auth Token" });
    }
    jwt.verify(token, SECRET, (err, decodedToken) => {
      if (err) {
        reject({ decodedToken: null, status: 401, message: "Unauthorized" });
      }
      resolve({
        decodedToken: decodedToken as IDecodedAuthToken,
        status: 200,
        message: null,
      });
    });
  });
}

export async function login(
  credentials: ICredentials,
): Promise<string | IError> {
  if (!(credentials && credentials.email && credentials.password)) {
    return Promise.reject({ message: "Something went wrong.", status: 500 });
  }
  const user = await getUserWithPasswordByEmail(credentials.email);
  if (!user) {
    return Promise.reject({ message: "Could not log in.", status: 400 });
  }
  if (bcrypt.compareSync(credentials.password, user.password)) {
    return Promise.resolve(
      jwt.sign(getTokenBody(user.id), SECRET, { expiresIn: 86400 }),
    );
  }
  return Promise.reject({ message: "Something went wrong.", status: 500 });
}

export async function signUp(newUser: {
  name: string;
  email: string;
  password: string;
}): Promise<string | null> {
  const existing = await getUserWithPasswordByEmail(newUser.email);
  if (existing) {
    return Promise.reject({
      message: "This email already exists in the system.",
      status: 400,
    });
  }
  const userId = await addUser({
    ...newUser,
    password: bcrypt.hashSync(newUser.password, 8),
  });
  return Promise.resolve(
    jwt.sign(getTokenBody(userId), SECRET, { expiresIn: 86400 }),
  );
}

function getTokenBody(userId: number): IDecodedAuthToken {
  return { userId };
}
