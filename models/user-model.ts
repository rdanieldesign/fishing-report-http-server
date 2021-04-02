import { INewUser, IUser } from '../interfaces/user-interface';
import { queryToPromise } from './mysql-util';

export function addUser(newUser: INewUser): Promise<IUser> {
    return queryToPromise<IUser>(`INSERT INTO users(name, email, password) VALUES
        (
            "${newUser.name}",
            "${newUser.email}",
            "${newUser.password}"
        );`
    );
}

export function getUser(userId: number): Promise<IUser[]> {
    return queryToPromise<IUser[]>(`
        SELECT name, email, id
        FROM users
        WHERE ID = ${userId}
        LIMIT 1;`
    );
}

export function getUserWithPasswordByEmail(email: string): Promise<IUser[]> {
    return queryToPromise<IUser[]>(`
        SELECT *
        FROM users
        WHERE email = "${email}"
        LIMIT 1;`
    );
}