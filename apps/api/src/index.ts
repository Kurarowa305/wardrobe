import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("API starting...");
console.log({
  region: process.env.AWS_REGION,
  ddb: process.env.DDB_ENDPOINT,
  bucket: process.env.S3_BUCKET,
});

// 仮：起動確認用にプロセスを止めない
setInterval(() => {}, 1000);
