import { SECRET } from '../secret';
import * as jwt from 'jsonwebtoken';
import { ICredentials, IDecodedAuthToken, IVerifiedTokenResponse } from '../interfaces/auth-interface';
import { addUser, getUserWithPasswordByEmail } from './user-service';
import * as bcrypt from 'bcrypt';
import { INewUser, IUser } from '../interfaces/user-interface';
import { IError } from '../interfaces/error-interface';

export function verifyToken(token: string): Promise<IVerifiedTokenResponse> {
    return new Promise((resolve, reject) => {
        if (!token) {
            // No token provided
            reject({ decodedToken: null, status: 401, message: 'No Auth Token' });
        }
        jwt.verify(token as string, SECRET, (err, decodedToken) => {
            if (err) {
                // Unauthorized
                reject({ decodedToken: null, status: 401, message: 'Unauthorized' });
            }
            // Success
            resolve({ decodedToken: decodedToken as IDecodedAuthToken, status: 200, message: null });
        });
    });
}

export async function login(credentials: ICredentials): Promise<string | IError> {
    if (!(credentials && credentials.email && credentials.password)) {
        return Promise.reject({
            message: 'Something went wrong.',
            status: 500,
        });
    }
    const user = await getUserWithPasswordByEmail(credentials.email);
    if (!user) {
        return Promise.reject({
            message: 'Could not log in.',
            status: 400,
        });
    }
    if (bcrypt.compareSync(
        credentials.password,
        user.password
    )) {
        const tokenBody = getTokenBody(user.id);
        return Promise.resolve(jwt.sign(tokenBody, SECRET, {
            expiresIn: 86400 // 24 hours
        }));
    }
    return Promise.reject({
        message: 'Something went wrong.',
        status: 500,
    });
}

export async function signUp(newUser: INewUser): Promise<string | null> {
    const userId = await addUser({
        ...newUser,
        password: bcrypt.hashSync(newUser.password, 8)
    });
    const tokenBody = getTokenBody(userId);
    return Promise.resolve(jwt.sign(tokenBody, SECRET, {
        expiresIn: 86400 // 24 hours
    }));
}

function getTokenBody(userId: number): IDecodedAuthToken {
    return { userId };
}