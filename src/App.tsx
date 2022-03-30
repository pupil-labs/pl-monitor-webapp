import React from "react";
import "./App.css";
import { Monitor } from "./Monitor";

export function isDevelopmentServer() {
  let host = window.location.host;
  return (
    host.includes("pistream") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  );
}
export class App extends React.Component {
  render() {
    let host = window.location.host;
    if (isDevelopmentServer()) {
      host = "pi.local:8080";
    }

    const currentUrl = new URL(window.location.href);
    const customHost = currentUrl.searchParams.get("host");
    if (customHost) {
      host = customHost;
    }

    return (
      <div className="App">
        <Monitor host={host}></Monitor>
      </div>
    );
  }
}

export default App;
