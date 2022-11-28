import { FriendStatus } from "../enums/friend-enum";
import { IError } from "../interfaces/error-interface";
import {
  IFriendship,
  IFriendshipDetails,
} from "../interfaces/friend-interface";
import { IUser } from "../interfaces/user-interface";
import {
  createFriendship as createFriendshipModel,
  getFriendship as getFriendshipModel,
  updateFriendStatus as updateFriendStatusModel,
  getFriendRequests as getFriendRequestsModel,
  getFriends as getFriendsModel,
  getFriendOptions as getFriendOptionsModel,
  getFriendPendingRequests as getFriendPendingRequestsModel,
} from "../models/friend-model";

export async function createFriendRequest(
  requesterId: number | undefined,
  friendId: string
): Promise<number | IError> {
  if (!requesterId) {
    return sendUnauthorizedMessage();
  }
  const friendship = await getFriendship(requesterId, parseInt(friendId));
  if (friendship) {
    return updateFriendStatus(
      requesterId,
      friendId,
      FriendStatus.Requested
    ).then(() => FriendStatus.Requested);
  } else {
    return createFriendshipModel(
      requesterId,
      parseInt(friendId),
      FriendStatus.Requested,
      parseInt(friendId)
    );
  }
}

export async function updateFriendStatus(
  requesterId: number | undefined,
  friendId: string,
  status: FriendStatus
): Promise<IFriendship | IError> {
  if (!requesterId) {
    return sendUnauthorizedMessage();
  }
  const friendIdNum = parseInt(friendId);
  const friendship = await getFriendship(requesterId, friendIdNum);
  const canUpdateFriendship = await getCanUpdateFriendship(
    requesterId,
    friendship
  );
  if (!canUpdateFriendship) {
    return sendUnauthorizedMessage();
  }
  const { actionUserId, otherUserId } = getActionUserByStatusUpdate(
    requesterId,
    friendIdNum,
    status
  );
  return updateFriendStatusModel(actionUserId, otherUserId, status);
}

export function getFriendRequests(
  currentUserId: number | undefined
): Promise<IFriendshipDetails[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  return getFriendRequestsModel(currentUserId);
}

export function getPendingFriendRequests(
  currentUserId: number | undefined
): Promise<IFriendshipDetails[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  return getFriendPendingRequestsModel(currentUserId);
}

export function getFriendOptions(
  currentUserId: number | undefined
): Promise<IUser[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  return getFriendOptionsModel(currentUserId);
}

export function getFriends(
  currentUserId: number | undefined
): Promise<IFriendshipDetails[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  return getFriendsModel(currentUserId);
}

async function getFriendship(
  requesterId: number,
  friendId: number
): Promise<IFriendship | null> {
  return getFriendshipModel(requesterId, friendId).then(
    getFriendshipFromQueryResult
  );
}

async function getCanUpdateFriendship(
  requesterId: number,
  friendship: IFriendship | null
): Promise<boolean> {
  if (!friendship) {
    return false;
  }
  if (!getStatusRequiresActionUser(friendship.status)) {
    return true;
  }
  return friendship?.actionUserId === requesterId;
}

function sendUnauthorizedMessage(): Promise<IError> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to update this friendship.",
  };
  return Promise.reject(error);
}

function getStatusRequiresActionUser(status: FriendStatus): boolean {
  return status !== FriendStatus.Confirmed;
}

function getActionUserByStatusUpdate(
  requestorId: number,
  friendId: number,
  status: FriendStatus
): { actionUserId: number; otherUserId: number } {
  switch (status) {
    case FriendStatus.Requested:
      return { actionUserId: friendId, otherUserId: requestorId };
    default:
      return { actionUserId: requestorId, otherUserId: friendId };
  }
}

function getFriendshipFromQueryResult(
  friendships: IFriendship[]
): IFriendship | null {
  if (!(friendships && friendships.length)) {
    return null;
  }
  return friendships[0];
}
