import { OkPacket } from 'mysql';
import { FriendStatus } from '../enums/friend-enum';
import {
  IFriendship,
  IFriendshipDetails,
} from '../interfaces/friend-interface';
import { queryToPromise } from './mysql-util';

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
  userOneId: number,
  userTwoId: number,
  status: FriendStatus
): Promise<IFriendship> {
  return queryToPromise<IFriendship>(`
    UPDATE friends
      SET
          status = ${status}
      WHERE ${getFriendshipCondition(userOneId, userTwoId)};`);
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
