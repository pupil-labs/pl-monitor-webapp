import { useEffect } from "react";
import { Format } from "./components/formats";
import { Player } from "./components/Player";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import * as monitorSlice from "./slices/monitorSlice";
import * as piapi from "./pi-api";

const makeApiClient = (apiUrl: string) => {
  const apiClient = new piapi.PIClient({
    BASE: apiUrl,
    // TOKEN: '1234',
  });
  return apiClient;
};
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
    dispatch(
      monitorSlice.actions.phoneConnectionStateChanged({
        hostId: device.hostId,
        state: monitorSlice.ConnectionState.CONNECTING,
      })
    );
    const parseUrl = new URL(device.apiUrl);
    let client = new ReconnectingWebSocket(
      `ws://${parseUrl.host}${parseUrl.pathname}/status`
    );
    let stopped = false;

    client.onerror = function () {
      console.log(`WebSocket Error`, client);
    };
    client.onopen = function () {
      console.log(`WebSocket Opened`, client);
      dispatch(
        monitorSlice.actions.phoneConnectionStateChanged({
          hostId: device.hostId,
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
            hostId: device.hostId,
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
            const ip = messageJSON.data.ip;
            const port = messageJSON.data.port || 8080;
            dispatch(
              monitorSlice.actions.deviceDetected({ ip: ip, port: port })
            );
            break;
          case "Recording":
            dispatch(
              monitorSlice.actions.recordingStatusReceived({
                hostId: device.hostId,
                recording: messageJSON.data,
              })
            );
            break;
          case "Hardware":
            dispatch(
              monitorSlice.actions.hardwareStatusReceived({
                hostId: device.hostId,
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

  // TODO(dan): we just want this to run once to kick off the websocket handler
  // but we also should hook up deps for if when props.device changes
  // ignoring elint warning for that reason
  // https://stackoverflow.com/questions/53120972/how-to-call-loading-function-with-react-useeffect-only-once/56767883#56767883
  useEffect(() => {
    startPIWebsocketHandler();
    // eslint-disable-next-line
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
    const client = makeApiClient(`http://${props.host}:8080/api`);
    client.status.getStatus().then((value) => {
      console.log(
        value.result.forEach((status) => {
          switch (status.model) {
            case "Phone":
              const phone = status.data as piapi.Phone;
              dispatch(monitorSlice.actions.phoneStateReceived(phone));
              break;
          }
        })
      );
    });
  }, [dispatch, props.host]);

  return (
    <div style={{ height: "100%" }}>
      <div style={{ height: "100%" }}>
        {Object.entries(devices).map(([deviceId, device]) => {
          return (
            <div
              style={{
                display: device.showPlayer ? "block" : "none",
                height: "100%",
              }}
              key={device.hostId}
            >
              {device.showPlayer ? (
                <Player
                  initialFormat={Format.RTP_H264}
                  autoPlay={true}
                  piHost={device}
                  showControls={true}
                />
              ) : null}
              <NetworkDevice device={device}></NetworkDevice>
            </div>
          );
        })}
      </div>
    </div>
  );
};
