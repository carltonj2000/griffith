const fs = require("fs").promises;
const path = require("path");
const { createServer } = require("http");
const express = require("express");
const chokidar = require("chokidar");

const WebSocket = require("ws");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const klm2geojson = require("./klm2geojson");
const geojson = require("./geojson");

const clients = {};
const baseDir = "./data";
const fnIn = path.join(baseDir, "Griffith_Pk.json");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "/public")));

app.get("/api/v1/table", async (req, res) => {
  console.log("GET /api/v1/table");
  const data = await fs.readFile(fnIn, "utf8");
  const geojson = await JSON.parse(data);
  res.json(geojson);
});

app.get("/api/v1/update", (req, res) => {
  console.log("GET /api/v1/update");
  Object.keys(clients).forEach((id) => {
    clients[id].send("update table");
  });
  res.send("update complete");
});

app.get("/api/v1/kml2geojson", async (req, res) => {
  console.log("GET /api/v1/kml2geojson");
  await klm2geojson.convert();
  res.send("kml2geojson complete");
});

app.get("/api/v1/processgeojson", async (req, res) => {
  console.log("GET /api/v1/processgeojson");
  await geojson.process();
  res.send("processgeojson complete");
});

const server = createServer(app);
const wss = new WebSocket.Server({ server, path: "/api/v1/ws" });

wss.on("connection", function (ws) {
  console.log("client connected");
  const uuid = uuidv4();
  clients[uuid] = ws;
  ws.send("hi");
  ws.on("close", () => {
    delete clients[uuid];
    console.log("client disconnected");
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, function () {
  console.log("Listening on http://localhost:" + PORT);
});

const watcher = chokidar.watch(path.join(__dirname, "./data"));
watcher.on("change", (fn) => {
  console.log(`${path.parse(fn).base} changed`);
  fetch("http://localhost:8000/api/v1/update");
});

const processOnStartUp = true;

const processOnStartup = async () => {
  console.log("processOnStartUp");
  //await fetch("http://localhost:8000/api/v1/kml2geojson");
  await fetch("http://localhost:8000/api/v1/processgeojson");
};

if (processOnStartUp) {
  processOnStartup();
}
