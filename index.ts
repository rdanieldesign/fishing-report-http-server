import 'dotenv/config';
import { app } from './app';

// Logging
var fs = require("fs");
var util = require("util");
var logFile = fs.createWriteStream("log.txt", { flags: "a" });
var logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + "\n");
  logStdout.write(util.format.apply(null, arguments) + "\n");
};
console.error = console.log;
// end Logging

const host = "localhost";
const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
