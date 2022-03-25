import { useState, useEffect } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";

import "./App.css";

function App() {
  const [table, setTable] = useState([["hi", "there"]]);
  const [client, setClient] = useState(null);
  const [reFetch, setReFetch] = useState(false);

  useEffect(() => {
    if (!client) {
      const c = new W3CWebSocket("ws://127.0.0.1:8000");
      c.onopen = () => {
        console.log("WebSocket Client Connected");
      };
      c.onmessage = (message) => {
        console.log(message);
        if (message.data === "update table") getTable();
      };
      setClient(client);
    }
  }, []);

  const getTable = async () => {
    const text = await fetch("http://localhost:8000/api/v1/table");
    if (!text) return;
    const data = await text.json();
    if (!data) return;
    setTable(data);
  };

  useEffect(() => {
    if (!reFetch) return;

    getTable();
  }, [reFetch]);

  const kml2geojson = () => {
    fetch("http://localhost:8000/api/v1/kml2geojson");
  };

  const processgeojson = () => {
    fetch("http://localhost:8000/api/v1/processgeojson");
  };

  return (
    <div>
      <p>WebSockets</p>
      <button onClick={getTable}>Get Table</button>
      <button onClick={kml2geojson}>Convert KML To GeoJson</button>
      <button onClick={processgeojson}>Process GeoJson</button>
      <table>
        <tbody>
          {table.map((row, i) => (
            <tr key={i}>
              <td>{row[0]}</td>
              <td>{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
