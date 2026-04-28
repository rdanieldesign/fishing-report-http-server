import { sendUnauthorizedMessage } from "../../shared/errors";
import {
  addUser as addUserRepo,
  getUserWithPasswordByEmail as getUserWithPasswordByEmailRepo,
  getUser as getUserRepo,
  getUsers as getUsersRepo,
  type NewUser,
  type User,
  type UserPublic,
} from "./users.repository";

export function addUser(newUser: NewUser): Promise<number> {
  return addUserRepo(newUser);
}

export function getUser(
  userId: number | undefined,
): Promise<UserPublic | null> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  return getUserRepo(userId).then((row) => row ?? null);
}

export function getUserWithPasswordByEmail(
  email: string,
): Promise<User | null> {
  return getUserWithPasswordByEmailRepo(email).then((row) => row ?? null);
}

export function getUsers(): Promise<UserPublic[]> {
  return getUsersRepo();
}
