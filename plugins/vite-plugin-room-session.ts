import type { Connect, Plugin } from "vite";
import {
  handleRoomSessionGet,
  handleRoomSessionPost,
} from "../server/handleRoomSession";

function readJsonBody(
  req: Connect.IncomingMessage,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function extractRoomId(url: string): string {
  const match = url.match(/^\/api\/rooms\/([^/?]+)/);
  return match?.[1] ?? "";
}

function createRoomSessionHandler(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith("/api/rooms/")) {
      next();
      return;
    }

    void (async () => {
      try {
        const roomId = extractRoomId(req.url ?? "");

        if (req.method === "GET") {
          const result = await handleRoomSessionGet(roomId);
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.body));
          return;
        }

        if (req.method === "POST") {
          const body = await readJsonBody(req);
          const result = await handleRoomSessionPost(roomId, {
            action: typeof body.action === "string" ? body.action : undefined,
            participantId:
              typeof body.participantId === "string"
                ? body.participantId
                : undefined,
          });
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.body));
          return;
        }

        res.statusCode = 405;
        res.setHeader("Allow", "GET, POST");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed." }));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Room session failed",
          }),
        );
      }
    })();
  };
}

export function roomSessionPlugin(): Plugin {
  return {
    name: "room-session-api",
    configureServer(server) {
      server.middlewares.use(createRoomSessionHandler());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createRoomSessionHandler());
    },
  };
}
