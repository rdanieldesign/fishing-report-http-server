import { SECRET } from '../secret';
import * as jwt from 'jsonwebtoken';
import { ICredentials, IDecodedAuthToken, IVerifiedTokenResponse } from '../interfaces/auth-interface';
import { addUser, getUserWithPasswordByEmail } from './user-service';
import * as bcrypt from 'bcrypt';
import { INewUser, IUser } from '../interfaces/user-interface';

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

export async function login(credentials: ICredentials): Promise<string | null> {
    if (!(credentials && credentials.email && credentials.password)) {
        return Promise.reject(null);
    }
    const user = await getUserWithPasswordByEmail(credentials.email);
    if (!user) {
        return Promise.reject(null);
    }
    if (bcrypt.compareSync(
        credentials.password,
        user.password
    )) {
        const tokenBody: IDecodedAuthToken = {
            userId: user.id,
        };
        return Promise.resolve(jwt.sign(tokenBody, SECRET, {
            expiresIn: 86400 // 24 hours
        }));
    }
    return Promise.reject(null);
}

export async function signUp(newUser: INewUser): Promise<IUser | null> {
    return addUser({
        ...newUser,
        password: bcrypt.hashSync(newUser.password, 8)
    });
}