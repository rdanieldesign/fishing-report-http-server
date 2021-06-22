import { FriendStatus } from "../enums/friend-enum";

export interface IFriendship {
  userOneId: number;
  userTwoId: number;
  actionUserId: number;
  status: FriendStatus;
}

export interface IFriendshipDetails extends IFriendship {
  friendName: string;
  friendId: string;
}
