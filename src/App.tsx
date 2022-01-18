import React from "react";
import "./App.css";
import { Monitor } from "./Monitor";

export class App extends React.Component {
  render() {
    let host = window.location.hostname;
    host = "192.168.1.23";
    return (
      <div className="App">
        <Monitor host={host}></Monitor>
      </div>
    );
  }
}

export default App;
