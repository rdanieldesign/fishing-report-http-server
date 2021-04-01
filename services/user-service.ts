import { INewUser, IUser } from '../interfaces/user-interface';
import {
    addUser as addUserModel,
    getUser as getUserModel,
    getUserByEmail as getUserByEmailModel,
} from '../models/user-model';

export function addUser(newUser: INewUser): Promise<IUser> {
    return addUserModel(newUser);
}

export function getUser(userId: string): Promise<IUser | null> {
    return getUserModel(parseInt(userId))
        .then((res: IUser[]): IUser | null => {
            return getFirstUser(res);
        });
}

export function getUserByEmail(email: string): Promise<IUser | null> {
    return getUserByEmailModel(email)
        .then((res: IUser[]): IUser | null => {
            return getFirstUser(res);
        });
}

function getFirstUser(users: IUser[]): IUser | null {
    if (users && users[0]) {
        return users[0];
    } else {
        return null;
    }
}

