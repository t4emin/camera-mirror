import { existsSync, readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import next from "next";
import { WebSocketServer } from "ws";
import {
  handleSignalingMessage,
  registerSignalingSocket,
  unregisterSignalingSocket
} from "./src/lib/signaling/hub";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const httpsEnabled = process.env.HTTPS === "true";
const certPath = ".cert/local-cert.pem";
const keyPath = ".cert/local-key.pem";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const requestHandler = (request: Parameters<typeof handle>[0], response: Parameters<typeof handle>[1]) => {
    void handle(request, response);
  };

  const server =
    httpsEnabled && existsSync(certPath) && existsSync(keyPath)
      ? createHttpsServer(
          {
            cert: readFileSync(certPath),
            key: readFileSync(keyPath)
          },
          requestHandler
        )
      : createHttpServer(requestHandler);

  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws" && request.url !== "/api/ws") {
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  });

  webSocketServer.on("connection", (webSocket) => {
    registerSignalingSocket(webSocket);

    webSocket.on("message", (data) => {
      handleSignalingMessage(webSocket, data.toString());
    });

    webSocket.on("close", () => {
      unregisterSignalingSocket(webSocket);
    });
  });

  server.listen(port, hostname, () => {
    const protocol = httpsEnabled && existsSync(certPath) && existsSync(keyPath) ? "https" : "http";
    console.log(`Ready on ${protocol}://${hostname}:${port}`);
  });
});
