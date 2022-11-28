import { IError } from "../interfaces/error-interface";
import { INewUser, IUser } from "../interfaces/user-interface";
import {
  addUser as addUserModel,
  getUser as getUserModel,
  getUserWithPasswordByEmail as getUserWithPasswordByEmailModel,
  getUsers as getUsersModel,
} from "../models/user-model";
import { sendUnauthorizedMessage } from "./auth-service";

export function addUser(newUser: INewUser): Promise<number> {
  return addUserModel(newUser);
}

export function getUser(
  userId: number | undefined
): Promise<IUser | null | IError> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  return getUserModel(userId).then((res: IUser[]): IUser | null => {
    return getFirstUser(res);
  });
}

export function getUserWithPasswordByEmail(
  email: string
): Promise<IUser | null> {
  return getUserWithPasswordByEmailModel(email).then(
    (res: IUser[]): IUser | null => {
      return getFirstUser(res);
    }
  );
}

export function getUsers(): Promise<IUser[]> {
  return getUsersModel();
}

function getFirstUser(users: IUser[]): IUser | null {
  if (users && users[0]) {
    return users[0];
  } else {
    return null;
  }
}
