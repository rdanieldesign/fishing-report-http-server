## Setup

Create a `.env` file at the root of the project with the following variables (see `.env.example` for reference):

```
JWT_SECRET=<your-jwt-secret>
MYSQL_HOST=<your-mysql-host>
MYSQL_USERNAME=<your-mysql-username>
MYSQL_PASSWORD=<your-mysql-password>
AWS_BUCKET=<your-aws-s3-bucket>
```

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
- `AWS_BUCKET` — S3 bucket for file uploads
