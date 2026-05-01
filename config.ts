function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const SECRET = requireEnv("JWT_SECRET");
export const MYSQL_HOST = requireEnv("MYSQL_HOST");
export const MYSQL_USERNAME = requireEnv("MYSQL_USERNAME");
export const MYSQL_PASSWORD = requireEnv("MYSQL_PASSWORD");
export const AWS_BUCKET = requireEnv("AWS_BUCKET");
export const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
