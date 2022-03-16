import React from "react";
import "./App.css";
import { Monitor } from "./Monitor";

export class App extends React.Component {
  render() {
    let host = window.location.hostname;
    host = "pi.local";
    return (
      <div className="App">
        <Monitor host={host}></Monitor>
      </div>
    );
  }
}

export default App;
