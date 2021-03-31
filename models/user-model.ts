import { INewUser, IUser } from '../interfaces/user-interface';
import { queryToPromise } from './mysql-util';

export function addUser(newUser: INewUser): Promise<IUser> {
    return queryToPromise<IUser>(`INSERT INTO users(name, email) VALUES
        (
            "${newUser.name}",
            "${newUser.email}"
        );`
    );
}