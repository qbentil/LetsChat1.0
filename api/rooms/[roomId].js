import {
  handleRoomSessionGet,
  handleRoomSessionPost,
} from "../../server/handleRoomSession";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const roomId = String(req.query?.roomId ?? "");

    if (req.method === "GET") {
      const result = await handleRoomSessionGet(roomId);
      return res.status(result.status).json(result.body);
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await handleRoomSessionPost(roomId, body);
      return res.status(result.status).json(result.body);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Room session error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Room session failed",
    });
  }
}
