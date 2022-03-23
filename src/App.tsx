import React from "react";
import "./App.css";
import { Monitor } from "./Monitor";

export class App extends React.Component {
  render() {
    let host = window.location.hostname;
    if (
      host.includes("pistream") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1")
    ) {
      host = "pi.local";
    }
    return (
      <div className="App">
        <Monitor host={host}></Monitor>
      </div>
    );
  }
}

export default App;
