// start-fullstack.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Starting Fullstack Restaurant System...\n");

const backendEnv = path.join("backend", ".env");
if (!fs.existsSync(backendEnv)) {
  console.log("📋 Copying .env to backend folder...");
  fs.copyFileSync(".env", backendEnv);
  console.log("✅ .env copied successfully\n");
}

const commands = [
  "npx tsx --env-file=backend/.env backend/index.ts",
  "npx expo start"
];

const cmd = `npx concurrently -n BACKEND,EXPO -c green,magenta "${commands[0]}" "${commands[1]}"`;

console.log("🟢 Starting Backend on port 3000...");
console.log("🟣 Starting Expo on port 8081...\n");

const proc = exec(cmd);

proc.stdout.on("data", data => process.stdout.write(data));
proc.stderr.on("data", data => process.stderr.write(data));