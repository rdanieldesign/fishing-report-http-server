import { and, eq, isNull, ne, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import { friends, users } from "../../db/schema";
import { FriendStatus } from "../../enums/friend-enum";

export type Friendship = InferSelectModel<typeof friends>;

export type FriendshipDetails = Friendship & {
  friendName: string;
  friendId: number;
};

export type FriendOption = Pick<
  InferSelectModel<typeof users>,
  "id" | "name" | "email"
>;

const friendshipDetailsColumns = {
  userOneId: friends.userOneId,
  userTwoId: friends.userTwoId,
  status: friends.status,
  actionUserId: friends.actionUserId,
  friendName: users.name,
  friendId: users.id,
};

function friendJoinCondition(currentUserId: number) {
  return or(
    and(eq(friends.userOneId, users.id), ne(friends.userOneId, currentUserId)),
    and(eq(friends.userTwoId, users.id), ne(friends.userTwoId, currentUserId)),
  );
}

function involvesMeCondition(currentUserId: number) {
  return or(
    eq(friends.userOneId, currentUserId),
    eq(friends.userTwoId, currentUserId),
  );
}

function friendshipMatchCondition(userOneId: number, userTwoId: number) {
  return and(
    or(eq(friends.userOneId, userOneId), eq(friends.userOneId, userTwoId)),
    or(eq(friends.userTwoId, userOneId), eq(friends.userTwoId, userTwoId)),
  );
}

export function createFriendship(
  userOneId: number,
  userTwoId: number,
  status: FriendStatus,
  actionUserId: number,
): Promise<void> {
  return db
    .insert(friends)
    .values({ userOneId, userTwoId, status, actionUserId })
    .then(() => undefined);
}

export function getFriendship(
  userOneId: number,
  userTwoId: number,
): Promise<Friendship | undefined> {
  return db
    .select()
    .from(friends)
    .where(friendshipMatchCondition(userOneId, userTwoId))
    .then((rows) => rows[0]);
}

export function updateFriendStatus(
  actionUserId: number,
  otherUserId: number,
  status: FriendStatus,
): Promise<void> {
  return db
    .update(friends)
    .set({ status, actionUserId })
    .where(friendshipMatchCondition(actionUserId, otherUserId))
    .then(() => undefined);
}

export function getFriendRequests(
  currentUserId: number,
): Promise<FriendshipDetails[]> {
  return db
    .selectDistinct(friendshipDetailsColumns)
    .from(friends)
    .innerJoin(users, friendJoinCondition(currentUserId))
    .where(
      and(
        involvesMeCondition(currentUserId),
        and(
          eq(friends.status, FriendStatus.Requested),
          eq(friends.actionUserId, currentUserId),
        ),
      ),
    );
}

export function getFriendPendingRequests(
  currentUserId: number,
): Promise<FriendshipDetails[]> {
  return db
    .selectDistinct(friendshipDetailsColumns)
    .from(friends)
    .innerJoin(users, friendJoinCondition(currentUserId))
    .where(
      and(
        involvesMeCondition(currentUserId),
        and(
          eq(friends.status, FriendStatus.Requested),
          ne(friends.actionUserId, currentUserId),
        ),
      ),
    );
}

export function getFriendOptions(
  currentUserId: number,
): Promise<FriendOption[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .leftJoin(
      friends,
      and(
        or(eq(friends.userOneId, users.id), eq(friends.userTwoId, users.id)),
        or(
          eq(friends.userOneId, currentUserId),
          eq(friends.userTwoId, currentUserId),
        ),
      ),
    )
    .where(
      and(
        ne(users.id, currentUserId),
        or(
          isNull(friends.userOneId),
          and(
            eq(friends.status, FriendStatus.Rejected),
            eq(friends.actionUserId, currentUserId),
          ),
        ),
      ),
    );
}

export function getFriends(
  currentUserId: number,
): Promise<FriendshipDetails[]> {
  return db
    .selectDistinct(friendshipDetailsColumns)
    .from(friends)
    .innerJoin(users, friendJoinCondition(currentUserId))
    .where(
      and(
        involvesMeCondition(currentUserId),
        eq(friends.status, FriendStatus.Confirmed),
      ),
    );
}
