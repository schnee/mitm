import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { LocationRepository } from "./modules/location/repository";
import { GoogleMapsAdapter } from "./modules/ranking/provider/googleMapsAdapter";
import { RankingRepository } from "./modules/ranking/repository";
import { RankingService } from "./modules/ranking/service";
import { SessionRepository } from "./modules/session/repository";
import { getSessionFunnelHandler } from "./routes/analytics/getSessionFunnel";
import { confirmVenueHandler } from "./routes/decision/confirmVenue";
import { upsertShortlistVenueHandler } from "./routes/decision/upsertShortlistVenue";
import { upsertVenueReactionHandler } from "./routes/decision/upsertVenueReaction";
import { confirmLocationHandler } from "./routes/location/confirmLocation";
import { upsertLocationDraftHandler } from "./routes/location/upsertLocationDraft";
import { getRankedResultsHandler } from "./routes/ranking/getRankedResults";
import { upsertRankingInputsHandler } from "./routes/ranking/upsertRankingInputs";
import { createSessionHandler } from "./routes/sessions/createSession";
import { getSessionSnapshotHandler } from "./routes/sessions/getSessionSnapshot";
import { joinSessionHandler } from "./routes/sessions/joinSession";
import { sessionEventsHandler } from "./routes/sessions/sessionEvents";

const repository = new SessionRepository();
const locationRepository = new LocationRepository(repository);
const rankingRepository = new RankingRepository(repository);
const rankingService = new RankingService(repository, rankingRepository, new GoogleMapsAdapter());

const apiPort = Number(process.env.API_PORT ?? 8080);
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", corsOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  setCorsHeaders(response);
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as unknown) : {};
}

function streamSessionEvents(
  request: IncomingMessage,
  response: ServerResponse,
  sessionId: string,
  since?: string
): void {
  const snapshot = repository.getSessionSnapshot(sessionId);
  if (!snapshot) {
    sendJson(response, 404, { error: "SESSION_NOT_FOUND" });
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  setCorsHeaders(response);
  response.flushHeaders();

  let cursor = since;
  const pushEvents = () => {
    const events = repository.listSessionEvents(sessionId, cursor);
    for (const event of events) {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
      cursor = event.updatedAt;
    }
  };

  pushEvents();

  const interval = setInterval(() => {
    pushEvents();
    response.write(": ping\n\n");
  }, 1000);

  request.on("close", () => {
    clearInterval(interval);
  });
}

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (method === "OPTIONS") {
    response.statusCode = 204;
    setCorsHeaders(response);
    response.end();
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (method === "POST" && url.pathname === "/v1/sessions") {
    const payload = await readJsonBody(request);
    const result = await createSessionHandler(payload, { repository, appUrl });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/sessions/join") {
    const payload = await readJsonBody(request);
    const result = await joinSessionHandler(payload, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  const snapshotMatch = url.pathname.match(/^\/v1\/sessions\/([^/]+)$/);
  if (method === "GET" && snapshotMatch) {
    const sessionId = decodeURIComponent(snapshotMatch[1]);
    const result = await getSessionSnapshotHandler(sessionId, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  const eventsMatch = url.pathname.match(/^\/v1\/sessions\/([^/]+)\/events$/);
  if (method === "GET" && eventsMatch) {
    const sessionId = decodeURIComponent(eventsMatch[1]);
    const since = url.searchParams.get("since") ?? undefined;
    const wantsSse = (request.headers.accept ?? "").includes("text/event-stream");

    if (wantsSse) {
      streamSessionEvents(request, response, sessionId, since);
      return;
    }

    const result = await sessionEventsHandler(sessionId, { repository }, { since });
    sendJson(response, result.status, result.body);
    return;
  }

  const funnelMatch = url.pathname.match(/^\/v1\/analytics\/funnel\/([^/]+)$/);
  if (method === "GET" && funnelMatch) {
    const sessionId = decodeURIComponent(funnelMatch[1]);
    const result = await getSessionFunnelHandler(sessionId, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/location/draft") {
    const payload = await readJsonBody(request);
    const result = await upsertLocationDraftHandler(payload, { repository: locationRepository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/location/confirm") {
    const payload = await readJsonBody(request);
    const result = await confirmLocationHandler(payload, { repository: locationRepository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/ranking/inputs") {
    const payload = await readJsonBody(request);
    const result = await upsertRankingInputsHandler(payload, { repository: rankingRepository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/ranking/results") {
    const payload = await readJsonBody(request);
    const result = await getRankedResultsHandler(payload, { service: rankingService });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/decision/shortlist") {
    const payload = await readJsonBody(request);
    const result = await upsertShortlistVenueHandler(payload, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/decision/reaction") {
    const payload = await readJsonBody(request);
    const result = await upsertVenueReactionHandler(payload, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  if (method === "POST" && url.pathname === "/v1/decision/confirm") {
    const payload = await readJsonBody(request);
    const result = await confirmVenueHandler(payload, { repository });
    sendJson(response, result.status, result.body);
    return;
  }

  sendJson(response, 404, { error: "NOT_FOUND" });
});

server.listen(apiPort, () => {
  process.stdout.write(`API dev server listening on http://localhost:${apiPort}\n`);
});
