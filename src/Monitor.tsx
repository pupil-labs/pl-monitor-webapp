import { useEffect, useMemo } from "react";
import { Format } from "./components/formats";
import { Player } from "./components/Player";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import * as monitorSlice from "./slices/monitorSlice";
import { DeviceList } from "./components/DeviceList";
export type MonitorProps = {
  host: string;
};

export type NetworkDeviceProps = {
  device: monitorSlice.PiHost;
};

export const NetworkDevice = (props: NetworkDeviceProps) => {
  const device = props.device;
  const dispatch = useDispatch();

  const startPIWebsocketHandler = () => {
    dispatch(monitorSlice.actions.recordingMessageReceived("Test message"));
    dispatch(
      monitorSlice.actions.phoneConnectionStateChanged({
        ip: device.ip,
        state: monitorSlice.ConnectionState.CONNECTING,
      })
    );
    let client = new ReconnectingWebSocket(`ws://${device.ip}:8080/api/status`);
    let stopped = false;

    client.onerror = function () {
      console.log(`WebSocket Error`, client);
    };
    client.onopen = function () {
      console.log(`WebSocket Opened`, client);
      dispatch(
        monitorSlice.actions.phoneConnectionStateChanged({
          ip: device.ip,
          state: monitorSlice.ConnectionState.CONNECTED,
        })
      );
      // const heartbeat = () => {
      //   client.send("ping");
      //   setTimeout(heartbeat, 3000);
      // };
      // heartbeat();
    };
    client.onclose = function () {
      console.log(`WebSocket Closed`, client);
      if (!stopped) {
        dispatch(
          monitorSlice.actions.phoneConnectionStateChanged({
            ip: device.ip,
            state: monitorSlice.ConnectionState.DISCONNECTED,
          })
        );
      }
    };

    client.onmessage = function (message) {
      console.log("WebSocket Message Received", device, message.data);
      if (typeof message.data === "string") {
        let messageJSON;
        try {
          messageJSON = JSON.parse(message.data);
        } catch (error) {
          console.error("error parsing websocket message", message);
          return;
        }
        if (!messageJSON.data) {
          console.error("error parsing websocket message", message);
          return;
        }
        switch (messageJSON.model) {
          case "Phone":
            dispatch(monitorSlice.actions.phoneStateReceived(messageJSON.data));
            break;
          case "Sensor":
            dispatch(
              monitorSlice.actions.sensorStatusReceived(messageJSON.data)
            );
            break;
          case "NetworkDevice":
            dispatch(monitorSlice.actions.deviceDetected(messageJSON.data.ip));
            break;
          case "Recording":
            dispatch(
              monitorSlice.actions.recordingStatusReceived({
                ip: device.ip,
                recording: messageJSON.data,
              })
            );
            break;
          case "Hardware":
            dispatch(
              monitorSlice.actions.hardwareStatusReceived({
                ip: device.ip,
                hardware: messageJSON.data,
              })
            );
            break;
        }
      }
    };
    const stopClient = () => {
      stopped = true;
      client.close();
    };
    return stopClient;
  };

  useEffect(() => {
    startPIWebsocketHandler();
  }, []);

  return (
    <dl style={{ display: "none" }}>
      <dd>
        <pre>{JSON.stringify(device, null, 2)}</pre>
      </dd>
    </dl>
  );
};

export const Monitor = (props: MonitorProps) => {
  const dispatch = useDispatch();
  const devices = useSelector((state: RootState) => {
    return state.monitor.devices;
  });

  useEffect(() => {
    dispatch(monitorSlice.actions.deviceDetected(props.host));
  }, [dispatch, props.host]);

  return (
    <div style={{ height: "100%" }}>
      <DeviceList piHosts={devices} />
      <div style={{ height: "100%" }}>
        {Object.entries(devices).map(([deviceId, device]) => {
          return (
            <div style={{ height: "100%" }} key={device.ip}>
              {device.showPlayer ? (
                <Player
                  initialFormat={Format.RTP_H264}
                  autoPlay={true}
                  piHost={device}
                  showControls={true}
                />
              ) : null}
              <NetworkDevice key={device.ip} device={device}></NetworkDevice>
            </div>
          );
        })}
      </div>
    </div>
  );
};
