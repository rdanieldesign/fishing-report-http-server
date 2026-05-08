import { FriendStatus } from "../../enums/friend-enum";
import type { IError } from "../../shared/errors";
import {
  createFriendship,
  getFriendship,
  getFriendOptions as getFriendOptionsRepo,
  getFriendPendingRequests as getFriendPendingRequestsRepo,
  getFriendRequests as getFriendRequestsRepo,
  getFriends as getFriendsRepo,
  updateFriendStatus as updateFriendStatusRepo,
  type FriendOption,
  type Friendship,
  type FriendshipDetails,
} from "./friends.repository";

function sendUnauthorizedMessage(): Promise<never> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to update this friendship.",
  };
  return Promise.reject(error);
}

export async function createFriendRequest(
  requesterId: number | undefined,
  friendId: string,
): Promise<number> {
  if (!requesterId) return sendUnauthorizedMessage();

  const friendIdNum = parseInt(friendId);
  const existing = await getFriendship(requesterId, friendIdNum);

  if (existing) {
    await updateFriendStatus(requesterId, friendId, FriendStatus.Requested);
    return FriendStatus.Requested;
  }

  await createFriendship(
    requesterId,
    friendIdNum,
    FriendStatus.Requested,
    friendIdNum,
  );
  return FriendStatus.Requested;
}

export async function updateFriendStatus(
  requesterId: number | undefined,
  friendId: string,
  status: FriendStatus,
): Promise<void | IError> {
  if (!requesterId) return sendUnauthorizedMessage();

  const friendIdNum = parseInt(friendId);
  const friendship = await getFriendship(requesterId, friendIdNum);
  if (!canUpdate(requesterId, friendship)) return sendUnauthorizedMessage();

  const { actionUserId, otherUserId } = resolveActionUser(
    requesterId,
    friendIdNum,
    status,
  );
  return updateFriendStatusRepo(actionUserId, otherUserId, status);
}

export function getFriendRequests(
  currentUserId: number | undefined,
): Promise<FriendshipDetails[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getFriendRequestsRepo(currentUserId);
}

export function getPendingFriendRequests(
  currentUserId: number | undefined,
): Promise<FriendshipDetails[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getFriendPendingRequestsRepo(currentUserId);
}

export function getFriendOptions(
  currentUserId: number | undefined,
): Promise<FriendOption[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getFriendOptionsRepo(currentUserId);
}

export function getFriends(
  currentUserId: number | undefined,
): Promise<FriendshipDetails[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getFriendsRepo(currentUserId);
}

function canUpdate(
  requesterId: number,
  friendship: Friendship | undefined,
): boolean {
  if (!friendship) return false;
  if (friendship.status === FriendStatus.Confirmed) return true;
  return friendship.actionUserId === requesterId;
}

function resolveActionUser(
  requestorId: number,
  friendId: number,
  status: FriendStatus,
): { actionUserId: number; otherUserId: number } {
  if (status === FriendStatus.Requested) {
    return { actionUserId: friendId, otherUserId: requestorId };
  }
  return { actionUserId: requestorId, otherUserId: friendId };
}
