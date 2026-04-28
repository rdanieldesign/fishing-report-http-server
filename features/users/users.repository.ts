import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";

export type User = InferSelectModel<typeof users>;
export type NewUser = Omit<InferInsertModel<typeof users>, "id">;
export type UserPublic = Pick<User, "id" | "name" | "email">;

export function addUser(newUser: NewUser): Promise<number> {
  return db
    .insert(users)
    .values(newUser)
    .then((result) => result[0].insertId);
}

export function getUser(userId: number): Promise<UserPublic | undefined> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);
}

export function getUsers(): Promise<UserPublic[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);
}

export function getUserWithPasswordByEmail(
  email: string,
): Promise<User | undefined> {
  return db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);
}
