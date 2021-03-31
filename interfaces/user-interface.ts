export interface INewUser {
    name: string;
    email: string;
}

export interface IUser extends INewUser {
    id: number;
}