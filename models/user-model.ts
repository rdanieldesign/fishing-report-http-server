import { OkPacket, Query } from 'mysql';
import { INewUser, IUser } from '../interfaces/user-interface';
import { queryToPromise } from './mysql-util';

export function addUser(newUser: INewUser): Promise<number> {
    return queryToPromise<OkPacket>(`
        INSERT INTO users(name, email, password) VALUES
        (
            "${newUser.name}",
            "${newUser.email}",
            "${newUser.password}"
        );
    `).then((results) => {
        return results.insertId;
    });
}

export function getUser(userId: number): Promise<IUser[]> {
    return queryToPromise(`
        SELECT name, email, id
        FROM users
        WHERE ID = ${userId}
        LIMIT 1;`
    );
}

export function getUserWithPasswordByEmail(email: string): Promise<IUser[]> {
    return queryToPromise(`
        SELECT *
        FROM users
        WHERE email = "${email}"
        LIMIT 1;`
    );
}