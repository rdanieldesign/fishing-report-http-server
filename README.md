## Setup

Copy `.env.example` to `.env` at the root of the project and fill in the values:

```
JWT_SECRET=         # Secret used to sign JWT tokens
MYSQL_HOST=         # MySQL server hostname (e.g. localhost)
MYSQL_USERNAME=     # MySQL user
MYSQL_PASSWORD=     # MySQL password
AWS_BUCKET=         # S3 bucket name for image uploads
AWS_ACCESS_KEY_ID=  # AWS IAM access key ID
AWS_SECRET_ACCESS_KEY= # AWS IAM secret access key
```

AWS credentials can be found in `~/.aws/credentials` on your local machine, or retrieved from the AWS IAM console. The IAM user needs `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` permissions on the configured bucket.

## Available Scripts

- `npm run start` — Build and run the server
- `npm run dev` — Run in development mode with TypeScript watch and hot-reload
- `npm run build` — Compile TypeScript to JavaScript
- `npm test` — Run Jest tests

## Deployment

This project uses GitHub Actions for automated testing and deployment:

- **Tests** run on all pushes and pull requests to verify code quality
- **Deploy** runs automatically on successful test completion to the `master` branch
- Deployment is handled via SSH to the production server, where pm2 manages the application process

Ensure the following secrets are configured in your GitHub repository settings:

- `SSH_HOST` — Production server hostname
- `SSH_USER` — SSH username for deployment
- `SSH_PRIVATE_KEY` — SSH private key for authentication
- `JWT_SECRET` — JWT signing secret
- `MYSQL_HOST`, `MYSQL_USERNAME`, `MYSQL_PASSWORD` — Database credentials
- `AWS_BUCKET` — S3 bucket name for image uploads
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — AWS IAM credentials with S3 access
