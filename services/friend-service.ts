import { FriendStatus } from "../enums/friend-enum";
import { IError } from "../interfaces/error-interface";
import {
  IFriendship,
  IFriendshipDetails,
} from "../interfaces/friend-interface";
import {
  createFriendship as createFriendshipModel,
  getFriendship as getFriendshipModel,
  updateFriendStatus as updateFriendStatusModel,
  getFriendRequests as getFriendRequestsModel,
  getFriends as getFriendsModel,
} from "../models/friend-model";

export function createFriendRequest(
  requesterId: string,
  friendId: string
): Promise<FriendStatus> {
  return createFriendshipModel(
    parseInt(requesterId),
    parseInt(friendId),
    FriendStatus.Requested,
    parseInt(friendId)
  );
}

export async function updateFriendStatus(
  requesterId: string,
  friendId: string,
  status: FriendStatus
): Promise<IFriendship | IError> {
  const canUpdateFriendship = await getCanUpdateFriendship(
    parseInt(requesterId),
    parseInt(friendId)
  );
  if (!canUpdateFriendship) {
    return sendUnauthorizedMessage();
  }
  return updateFriendStatusModel(
    parseInt(requesterId),
    parseInt(friendId),
    status
  );
}

export function getFriendRequests(
  currentUserId: string
): Promise<IFriendshipDetails[]> {
  return getFriendRequestsModel(parseInt(currentUserId));
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
  friendId: number
): Promise<boolean> {
  const friendship = await getFriendship(requesterId, friendId);
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

function getFriendshipFromQueryResult(
  friendships: IFriendship[]
): IFriendship | null {
  if (!(friendships && friendships.length)) {
    return null;
  }
  return friendships[0];
}
