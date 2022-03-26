import React from "react";
import "./Tables.css";

function Table({ table }) {
  return (
    <table>
      <tbody>
        {table.map((rows, i) => (
          <tr key={i}>
            {rows.map((row, j) =>
              i ? <td key={j}>{row}</td> : <th key={j}>{row}</th>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Tables({ tables }) {
  return (
    <div className="tables">
      {tables.map((row) => (
        <div className="tableRow">
          {row.map((table) => (
            <Table table={table} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Tables;
