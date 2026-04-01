import * as jwt from 'jsonwebtoken';

export function signTestToken(userId: number): string {
  return jwt.sign({ userId }, 'test-secret', { expiresIn: 3600 });
}
