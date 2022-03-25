const ws = require("ws");
const client = new ws("ws://localhost:8000");
client.on("open", () => client.send("Hello"));
