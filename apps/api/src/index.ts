import { createServer } from "node:http";

import { env } from "./env.js";

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        status: "ok",
        service: "api",
        runtime: "node",
      }),
    );
    return;
  }

  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(
    JSON.stringify({
      status: "starting",
      message: "Wardrobe API bootstrap is ready.",
      config: {
        region: env.awsRegion,
        ddbEndpoint: env.ddbEndpoint,
        s3Bucket: env.s3Bucket,
      },
    }),
  );
});

server.listen(env.port, env.host, () => {
  console.log(`API starting on http://${env.host}:${env.port}`);
  console.log(
    JSON.stringify(
      {
        envFilePath: env.envFilePath,
        region: env.awsRegion,
        ddbEndpoint: env.ddbEndpoint,
        s3Bucket: env.s3Bucket,
      },
      null,
      2,
    ),
  );
});
