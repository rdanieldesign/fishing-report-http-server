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
  requesterId: string,
  friendId: string
): Promise<number | IError> {
  const friendship = await getFriendship(
    parseInt(requesterId),
    parseInt(friendId)
  );
  if (friendship) {
    return updateFriendStatus(
      requesterId,
      friendId,
      FriendStatus.Requested
    ).then(() => FriendStatus.Requested);
  } else {
    return createFriendshipModel(
      parseInt(requesterId),
      parseInt(friendId),
      FriendStatus.Requested,
      parseInt(friendId)
    );
  }
}

export async function updateFriendStatus(
  requesterId: string,
  friendId: string,
  status: FriendStatus
): Promise<IFriendship | IError> {
  const requesterIdNum = parseInt(requesterId);
  const friendIdNum = parseInt(friendId);
  const friendship = await getFriendship(requesterIdNum, friendIdNum);
  const canUpdateFriendship = await getCanUpdateFriendship(
    requesterIdNum,
    friendship
  );
  if (!canUpdateFriendship) {
    return sendUnauthorizedMessage();
  }
  const { actionUserId, otherUserId } = getActionUserByStatusUpdate(
    requesterIdNum,
    friendIdNum,
    status
  );
  return updateFriendStatusModel(actionUserId, otherUserId, status);
}

export function getFriendRequests(
  currentUserId: string
): Promise<IFriendshipDetails[]> {
  return getFriendRequestsModel(parseInt(currentUserId));
}

export function getPendingFriendRequests(
  currentUserId: string
): Promise<IFriendshipDetails[]> {
  return getFriendPendingRequestsModel(parseInt(currentUserId));
}

export function getFriendOptions(currentUserId: string): Promise<IUser[]> {
  return getFriendOptionsModel(parseInt(currentUserId));
}

export function getFriends(
  currentUserId: string
): Promise<IFriendshipDetails[]> {
  return getFriendsModel(parseInt(currentUserId));
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
