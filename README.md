To run this app, use the command `npm run start '{mySQLPassword}'.

To deploy this app, use the command `npm run deploy '{mySQLPassword}'. You may need to remove any running pm2 processes before doing this.

In order to handle authentication you'll need to add a file called "secret.ts" at the root, which exports a variable "SECRET";