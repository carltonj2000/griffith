import { useState, useEffect } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";

import "./App.css";
import Tables from "./Tables";

function App() {
  const [table, setTable] = useState([["hi", "there"]]);
  const [client, setClient] = useState(null);
  const [reFetch, setReFetch] = useState(false);
  const [wsReconnect, setWsReconnect] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timer = null;
    if (!client) {
      const c = new W3CWebSocket("ws://127.0.0.1:3000/api/v1/ws");
      c.onopen = () => {
        console.log("WebSocket Client Connected");
        setReFetch(true);
      };
      c.onclose = () => {
        console.log("WebSocket Client Disconnected");
        timer = setTimeout(() => {
          if (!mounted) return;
          setReFetch(false);
          setWsReconnect((v) => !v);
        }, 1500);
      };

      c.onmessage = (message) => {
        console.log(message);
        if (message.data === "update table") getTable();
      };
      setClient(client);
      return () => {
        c.close();
        if (timer) clearTimeout(timer);
        mounted = false;
      };
    }
  }, [wsReconnect]);

  const getTable = async () => {
    const text = await fetch("http://localhost:3000/api/v1/table");
    if (!text) return;
    let data = await text.json();
    if (!data) return;
    setTable(data);
  };

  useEffect(() => {
    if (!reFetch) return;
    setReFetch(false);
    getTable();
  }, [reFetch]);

  const kml2geojson = () => {
    fetch("http://localhost:3000/api/v1/kml2geojson");
  };

  const processgeojson = () => {
    fetch("http://localhost:3000/api/v1/processgeojson");
  };

  return (
    <div className="container">
      <h1 className="h1">Griffith GPS Summary</h1>
      <div className="buttons">
        <button onClick={getTable}>Get Table</button>
        <button onClick={kml2geojson}>Convert KML To GeoJson</button>
        <button onClick={processgeojson}>Process GeoJson</button>
      </div>
      <Tables tables={table} />
    </div>
  );
}

export default App;
