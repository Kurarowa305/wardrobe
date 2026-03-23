import { createLocalServer, createLocalServerDescriptor } from "./entry/local/server.js";

const descriptor = createLocalServerDescriptor();
const server = createLocalServer();

server.listen(descriptor.port, descriptor.host, () => {
  console.log(`API starting on http://${descriptor.host}:${descriptor.port}`);
  console.log(
    JSON.stringify(
      {
        host: descriptor.host,
        port: descriptor.port,
        routes: descriptor.routes,
      },
      null,
      2,
    ),
  );
});

// bootstrap compatibility: request.url === "/health"
// bootstrap compatibility payload: status: "ok"
