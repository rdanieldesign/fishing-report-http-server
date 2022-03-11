import { OkPacket } from 'mysql';
import { FriendStatus } from '../enums/friend-enum';
import {
  IFriendship,
  IFriendshipDetails,
} from '../interfaces/friend-interface';
import { IUser } from '../interfaces/user-interface';
import { queryToPromise } from './mysql-util';

export const FRIENDS_JOIN = `LEFT JOIN friends F ON F.userOneId = @current_user OR F.userTwoId = @current_user`;
export const FRIENDS_FILTER = `(R.authorId = F.userOneId OR R.authorId = F.userTwoId) AND F.status = ${FriendStatus.Confirmed}`;
export const FRIENDS_AND_ME_FILTER = `R.authorId = @current_user OR (${FRIENDS_FILTER})`;

function setCurrentUser(currentUserId: number) {
  return `SET @current_user:=${currentUserId};`;
}

export function createFriendship(
  userOneId: number,
  userTwoId: number,
  status: FriendStatus,
  actionUserId: number
): Promise<number> {
  return queryToPromise<OkPacket>(`
        INSERT INTO friends(userOneId, userTwoId, status, actionUserId) VALUES
        (
            ${userOneId},
            ${userTwoId},
            ${status},
            ${actionUserId}
        );
    `).then(() => {
    return FriendStatus.Requested;
  });
}

export function getFriendship(
  userOneId: number,
  userTwoId: number
): Promise<IFriendship[]> {
  return queryToPromise<IFriendship[]>(`
    SELECT * FROM friends
      WHERE ${getFriendshipCondition(userOneId, userTwoId)};
`);
}

export function updateFriendStatus(
  actionUserId: number,
  otherUserId: number,
  status: FriendStatus
): Promise<IFriendship> {
  return queryToPromise<IFriendship>(`
    UPDATE friends
      SET
          status = ${status},
          actionUserId = ${actionUserId}
      WHERE ${getFriendshipCondition(actionUserId, otherUserId)};`);
}

export function getFriendRequests(
  currentUserId: number
): Promise<IFriendshipDetails[]> {
  return queryToPromise<IFriendshipDetails[]>(`
    SELECT DISTINCT
         ${getFriendshipDetailsQuery()}
      FROM friends F
      INNER JOIN users U ON (${getUserIsFriendCondition(currentUserId)})
      WHERE (${getFriendsOfCurrentUserCondition(
        currentUserId
      )}) AND (${getAwaitingUserToConfirmCondition(currentUserId)});
  `);
}

export function getFriendPendingRequests(
  currentUserId: number
): Promise<IFriendshipDetails[]> {
  return queryToPromise<IFriendshipDetails[]>(`
    SELECT DISTINCT
         ${getFriendshipDetailsQuery()}
      FROM friends F
      INNER JOIN users U ON (${getUserIsFriendCondition(currentUserId)})
      WHERE (${getFriendsOfCurrentUserCondition(
        currentUserId
      )}) AND (F.status = ${
    FriendStatus.Requested
  } AND F.actionUserId != ${currentUserId});
  `);
}

export function getFriendOptions(currentUserId: number): Promise<IUser[]> {
  const query = `
    SELECT U.name, U.email, U.id
        FROM users U
        LEFT JOIN friends F
          ON (F.userOneId = U.id OR F.userTwoId = U.id) AND (F.userOneId = ${currentUserId} OR F.userTwoId = ${currentUserId})
        WHERE (
          U.id != ${currentUserId}
          AND
          (
            (F.userOneId IS NULL OR F.userTwoId IS NULL)
            OR
            (F.status = ${FriendStatus.Rejected} AND F.actionUserId = ${currentUserId} ) 
          )
        );
  `;
  return queryToPromise<IUser[]>(query);
}

export function getFriends(
  currentUserId: number
): Promise<IFriendshipDetails[]> {
  return queryToPromise<IFriendshipDetails[]>(`
    SELECT DISTINCT
        ${getFriendshipDetailsQuery()}
      FROM friends F
      INNER JOIN users U ON (${getUserIsFriendCondition(currentUserId)})
      WHERE (${getFriendsOfCurrentUserCondition(
        currentUserId
      )}) AND (${getIsConfirmedFriendCondition()});
  `);
}

function getFriendshipCondition(userOneId: number, userTwoId: number): string {
  return `(userOneId = ${userOneId} OR userOneId = ${userTwoId}) AND (userTwoId = ${userOneId} OR userTwoId = ${userTwoId})`;
}

function getFriendsOfCurrentUserCondition(
  currentUserId: number,
  friendsVariable: string = 'F'
): string {
  return `${friendsVariable}.userOneId = ${currentUserId} OR ${friendsVariable}.userTwoId = ${currentUserId}`;
}

function getUserIsFriendCondition(
  currentUserId: number,
  userVariable: string = 'U',
  friendsVariable: string = 'F'
): string {
  return `(${friendsVariable}.userOneId = ${userVariable}.id AND ${friendsVariable}.userOneId != ${currentUserId}) OR (${friendsVariable}.userTwoId = ${userVariable}.id AND ${friendsVariable}.userTwoId != ${currentUserId})`;
}

function getAwaitingUserToConfirmCondition(
  currentUserId: number,
  friendsVariable: string = 'F'
): string {
  return `${friendsVariable}.status = ${FriendStatus.Requested} AND ${friendsVariable}.actionUserId = ${currentUserId}`;
}

function getIsConfirmedFriendCondition(friendsVariable: string = 'F'): string {
  return `${friendsVariable}.status = ${FriendStatus.Confirmed}`;
}

function getFriendshipDetailsQuery(
  userVariable: string = 'U',
  friendsVariable: string = 'F'
): string {
  return `${friendsVariable}.*,
        ${userVariable}.name friendName,
        ${userVariable}.id friendId`;
}
