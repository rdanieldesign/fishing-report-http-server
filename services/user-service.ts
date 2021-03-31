import { INewUser, IUser } from '../interfaces/user-interface';
import {
    addUser as addUserModel
} from '../models/user-model';

export function addUser(newUser: INewUser): Promise<IUser> {
    return addUserModel(newUser);
}