import React, {
  useState,
  forwardRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { Sdp } from "media-stream-library";
import { GazeOverlay } from "./GazeOverlay";
import styled from "styled-components";

import { Container, Layer } from "./Container";
import {
  PlaybackArea,
  PiApiParameters,
  VideoProperties,
  PlayerNativeElement,
} from "./PlaybackArea";
import { Controls } from "./Controls";
import { Feedback } from "./Feedback";
import { Stats } from "./Stats";
import { useSwitch } from "./hooks/useSwitch";
import { getImageURL } from "./utils";
import { MetadataHandler } from "./metadata";
import { Limiter } from "./Limiter";
import { MediaStreamPlayerContainer } from "./MediaStreamPlayerContainer";
import { Format } from "./formats";
import { BatteryIndicator } from "./Battery";
import * as monitorSlice from "../slices/monitorSlice";
import * as constants from "./constants";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import { RecordReady, RecordStop } from "./img";
import { Settings } from "./Settings";
import { CustomEvent } from "./CustomEvent";
import { EventButton } from "./EventButton";
import * as piapi from "../pi-api";
import { StreamingDevices } from "./StreamingDevices";
import { Alert, AlertColor, Snackbar } from "@mui/material";
import { ElapsedTimer } from "./ElapsedTimer";
import { EyeCameraIcon } from "./Icon";
import { WorldCameraIcon } from "./Icon";
import { isFirefox, isIOS } from "react-device-detect";
const DEFAULT_FORMAT = Format.RTP_H264;

interface PlayerProps {
  readonly piApixParams?: PiApiParameters;
  readonly initialFormat?: Format;
  readonly autoPlay?: boolean;
  readonly piHost: monitorSlice.PiHost;
  readonly onSdp?: (msg: Sdp) => void;
  readonly metadataHandler?: MetadataHandler;
  readonly showControls?: boolean;
  /**
   * Set to true if the camera requires a secure
   * connection, "https" and "wss" protocols.
   */
  readonly secure?: boolean;
  readonly aspectRatio?: number;
  readonly className?: string;
  /**
   * When playing a recording, the time the video started
   * (used for labeling with an absolute time) formatted
   * as an ISO time, e.g.: 2021-02-03T12:21:57.465715Z
   */
  readonly startTime?: string;
  /**
   * When playing a recording, the total duration of the video
   * if known by the user (and not reported from backend) in
   * seconds.
   */
  readonly duration?: number;
  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean;
  readonly settingsIsOpen?: boolean;
  readonly customEventIsOpen?: boolean;
  readonly streamingDevicesIsOpen?: boolean;
}

export const Player = forwardRef<PlayerNativeElement, PlayerProps>(
  (
    {
      piApixParams = {},
      initialFormat = DEFAULT_FORMAT,
      autoPlay = false,
      showControls = false,
      onSdp,
      metadataHandler,
      piHost,
      secure,
      className,
      startTime,
      duration,
      autoRetry = false,
      settingsIsOpen = false,
      customEventIsOpen = false,
      streamingDevicesIsOpen = false,
    },
    ref,
  ) => {
    const dispatch = useDispatch();
    const [play, setPlay] = useState(autoPlay);
    const [offset, setOffset] = useState(0);
    const [refresh, setRefresh] = useState(0);
    const [waiting, setWaiting] = useState(autoPlay);
    const [volume, setVolume] = useState<number>();
    const [format, setFormat] = useState<Format>(initialFormat);
    const [showSettings, setShowSettings] = useState(settingsIsOpen);
    const [showCustomEvent, setShowCustomEvent] = useState(customEventIsOpen);
    const [showStreamingDevices, setShowStreamingDevices] = useState(
      streamingDevicesIsOpen,
    );
    const [worldHost, setWorldHost] = useState("");
    const [showWorldSensor, setShowWorldSensor] = useState(false);

    const isRecording =
      piHost.current_recording?.action === piapi.Recording.action.START;

    /**
     * piApix parameters
     */
    const [parameters, setParameters] = useState(piApixParams);

    useEffect(() => {
      /**
       * Check if localStorage actually exists, since if you
       * server side render, localStorage won't be available.
       */
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem("piapix", JSON.stringify(parameters));
      }
    }, [parameters]);

    /**
     * Stats overlay
     */
    const [showStatsOverlay, toggleStatsOverlay] = useSwitch(
      window?.localStorage !== undefined
        ? window.localStorage.getItem("stats-overlay") === "on"
        : false,
    );

    useEffect(() => {
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem(
          "stats-overlay",
          showStatsOverlay ? "on" : "off",
        );
      }
    }, [showStatsOverlay]);

    /**
     * Controls
     */
    const [videoProperties, setVideoProperties] = useState<VideoProperties>();

    const onPlaying = useCallback(
      (props: VideoProperties) => {
        const el = props.el as HTMLMediaElement;
        if (el && el.buffered !== undefined && el.buffered.length > 0) {
          const endTime = el.buffered.end(el.buffered.length - 1);
          el.currentTime = endTime;
        }
        setVideoProperties(props);
        setWaiting(false);
        setVolume(props.volume);
        // set fast playback speed so playback returns to realtime after pauses
        // @ts-ignore
        props.el.playbackRate = 3;
      },
      [setWaiting],
    );
    const onPlayPause = useCallback(() => {
      if (play) {
        setPlay(false);
        // setHost("");
      } else {
        setWaiting(true);
        // setHost(host);
        setPlay(true);
      }
    }, [play]);

    const onRefresh = useCallback(() => {
      setPlay(true);
      setRefresh((value) => value + 1);
      setWaiting(true);
    }, []);

    const onRecordButton = useCallback(() => {
      if (!isRecording) {
        console.log("starting recording");
        const res = dispatch(monitorSlice.startRecording(piHost));
        console.log("starting recording response", res);
      } else {
        console.log("stopping recording");
        const res = dispatch(monitorSlice.stopAndSaveRecording(piHost));
        console.log("stopping recording response", res);
      }
    }, [dispatch, isRecording, piHost]);

    const onScreenshot = useCallback(() => {
      if (videoProperties === undefined) {
        return undefined;
      }

      const { el, width, height } = videoProperties;
      const imageURL = getImageURL(el, { width, height });
      const link = document.createElement("a");
      const event = new window.MouseEvent("click");

      link.download = `snapshot_${Date.now()}.jpg`;
      link.href = imageURL;
      link.dispatchEvent(event);
    }, [videoProperties]);

    const onStop = useCallback(() => {
      setPlay(false);
      // setHost("");
      setWaiting(false);
    }, []);

    const onPiApix = useCallback((key: string, value: string) => {
      setParameters((p: typeof piApixParams) => {
        const newParams = { ...p, [key]: value };
        if (value === "") {
          delete newParams[key];
        }
        return newParams;
      });
      setRefresh((refreshCount) => refreshCount + 1);
    }, []);

    const toggleShowSettings = useCallback(() => {
      setShowSettings(!showSettings);
    }, [showSettings]);

    const toggleStreamingDevices = useCallback(() => {
      setShowStreamingDevices(!showStreamingDevices);
    }, [showStreamingDevices]);

    const toggleShowCustomEvent = useCallback(() => {
      setShowCustomEvent(!showCustomEvent);
    }, [showCustomEvent]);

    const inputRef = React.createRef<HTMLInputElement>();
    useEffect(() => {
      if (inputRef.current && showCustomEvent) {
        inputRef.current.focus();
      }
    });

    type SnackbarMessage = {
      message: string;
      severity: AlertColor;
    };
    const emptySnackbarMessage = {
      message: "",
      severity: "info",
    } as SnackbarMessage;
    const [snackMessage, setSnackbarMessage] =
      useState<SnackbarMessage>(emptySnackbarMessage);
    const [showSnackbar, setShowSnackbar] = useState(false);

    const clearSnackbar = () => {
      setShowSnackbar(false);
    };
    const displaySnackbarMessage = useCallback(
      (snackMessage: SnackbarMessage) => {
        setSnackbarMessage(snackMessage);
        setShowSnackbar(true);
      },
      [],
    );
    useEffect(() => {
      if (piHost.notifications.length) {
        const notification =
          piHost.notifications[piHost.notifications.length - 1];
        displaySnackbarMessage({
          message: notification.message,
          severity: notification.severity,
        });
      } else {
        clearSnackbar();
      }
    }, [piHost.notifications, displaySnackbarMessage]);

    const eventMenu = useSelector((state: RootState) => {
      return state.monitor.presetEvents;
    });

    const convertUnixTimestamp = (timestamp: number) => {
      const t = new Date(timestamp / 1000000);
      const h = t.getHours();
      const m = t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes();
      const s = t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds();
      return `${h}:${m}:${s}`;
    };

    useEffect(() => {
      const events = piHost.current_recording?.events;
      if (events && events.length && isRecording) {
        const event = events[events.length - 1];
        const humanTime = convertUnixTimestamp(event.timestamp);
        const message = `Event ${event.name} recorded @ ${humanTime}`;
        displaySnackbarMessage({
          message: message,
          severity: "info",
        });
      }
    }, [piHost.current_recording?.events, displaySnackbarMessage, isRecording]);

    const triggerEvent = useCallback(
      (eventName) => {
        if (!eventName) {
          displaySnackbarMessage({
            message: "The event needs a name",
            severity: "error",
          });
        } else if (
          piHost.current_recording?.action !== piapi.Recording.action.START
        ) {
          displaySnackbarMessage({
            message: "A recording must be in progress to send an event",
            severity: "error",
          });
        } else {
          const saveEventPayload = {
            name: eventName,
            piHost: piHost,
          };
          dispatch(monitorSlice.saveEvent(saveEventPayload));
        }
        if (showCustomEvent) {
          toggleShowCustomEvent();
        }
      },
      [
        dispatch,
        piHost,
        showCustomEvent,
        toggleShowCustomEvent,
        displaySnackbarMessage,
      ],
    );

    /**
     * Refresh when changing visibility (e.g. when you leave a tab the
     * video will halt, so when you return we need to play again).
     */

    useEffect(() => {
      const cb = () => {
        if (document.visibilityState === "visible") {
          setPlay(true);
          // setHost(hostname);
        } else if (document.visibilityState === "hidden") {
          setPlay(false);
          setWaiting(false);
          // setHost("");
        }
      };

      document.addEventListener("visibilitychange", cb);

      return () => document.removeEventListener("visibilitychange", cb);
    }, [piHost]);

    /**
     * Aspect ratio
     *
     * This needs to be set so make the Container (and Layers) match the size of
     * the visible image of the video or still image.
     */

    const naturalAspectRatio = useMemo(() => {
      if (videoProperties === undefined) {
        return constants.PI_WORLD_VIDEO_WIDTH / constants.PI_WORLD_VIDEO_HEIGHT;
      }

      const { width, height } = videoProperties;

      return width / height;
    }, [videoProperties]);

    /**
     * Limit video size.
     *
     * The video size should not expand outside the available container, and
     * should be recomputed on resize.
     */

    const limiterRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      if (naturalAspectRatio === undefined || limiterRef.current === null) {
        return;
      }

      const observer = new window.ResizeObserver(([entry]) => {
        const element = entry.target as HTMLElement;
        const maxWidth = element.clientHeight * naturalAspectRatio;
        element.style.maxWidth = `${maxWidth}px`;
      });
      observer.observe(limiterRef.current);

      return () => observer.disconnect();
    }, [naturalAspectRatio]);

    /**
     * Volume control on the VideoElement (h264 only)
     */
    useEffect(() => {
      if (videoProperties?.volume !== undefined && volume !== undefined) {
        const videoEl = videoProperties.el as HTMLVideoElement;
        videoEl.muted = volume === 0;
        videoEl.volume = volume;
      }
    }, [videoProperties, volume]);

    /**
     * Refresh on stream end
     */
    const onEnded = useCallback(() => {
      if (autoRetry) {
        onRefresh();
      }
    }, [autoRetry, onRefresh]);

    /**
     * Render
     *
     * Each layer is positioned exactly on top of the visible image, since the
     * aspect ratio is carried over to the container, and the layers match the
     * container size.
     *
     * There is a layer for the spinner (feedback), a statistics overlay, and a
     * control bar with play/pause/stop/refresh and a settings menu.
     */
    const worldSensor = piHost.sensors["world-WEBSOCKET"];
    useEffect(() => {
      if (!piHost.online) {
        setWorldHost("");
        setShowWorldSensor(false);
        return;
      }
      if (piHost.is_dummy) {
        setWorldHost("dummy");
        setShowWorldSensor(true);
      } else if (worldSensor && worldSensor.connected) {
        setWorldHost(`${worldSensor.ip}:${worldSensor.port}`);
        setShowWorldSensor(true);
      } else {
        setWorldHost("");
        setShowWorldSensor(false);
      }
    }, [worldSensor, piHost]);

    const gazeSensor = piHost.sensors["gaze-WEBSOCKET"];
    const showGazeSensor = gazeSensor && gazeSensor.connected;

    useEffect(() => {
      const keyDownHandler = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setShowCustomEvent(false);
          setShowSettings(false);
          setShowStreamingDevices(false);
        }
      };
      if (isFirefox) {
        displaySnackbarMessage({
          message:
            "Performance may be degraded in Firefox, use Google Chrome for best performance.",
          severity: "warning",
        });
      } else if (isIOS) {
        displaySnackbarMessage({
          message: "Video preview may not be available in iOS.",
          severity: "warning",
        });
      }
      document.addEventListener("keydown", keyDownHandler, false);
      return () => {
        document.removeEventListener("keydown", keyDownHandler, false);
      };
      // eslint-disable-next-line
    }, []);

    // event hotkeys
    useEffect(() => {
      const keyDownHandler = (event: KeyboardEvent) => {
        switch (event.key) {
          case "1":
            if (!showCustomEvent) {
              triggerEvent(eventMenu[0]);
            }
            break;
          case "2":
            if (!showCustomEvent) {
              triggerEvent(eventMenu[1]);
            }
            break;
          case "3":
            if (!showCustomEvent) {
              triggerEvent(eventMenu[2]);
            }
            break;
          case "4":
            if (!showCustomEvent) {
              triggerEvent(eventMenu[3]);
            }
            break;
          case "5":
            if (!showCustomEvent) {
              triggerEvent(eventMenu[4]);
            }
            break;
        }
      };
      document.addEventListener("keydown", keyDownHandler, false);
      return () => {
        document.removeEventListener("keydown", keyDownHandler, false);
      };
    }, [triggerEvent, eventMenu, showCustomEvent]);

    return (
      <PlayerArea>
        <PhoneStatus>
          {piHost.phone ? (
            <>
              <DeviceName>{piHost.phone.device_name}</DeviceName>
              <PhoneStatusRight>
                <span style={{ lineHeight: 1, verticalAlign: "middle" }}>
                  {/* <span
                    style={{
                      color:
                        piHost.current_recording?.action ===
                        piapi.Recording.action.START
                          ? "red"
                          : "",
                    }}
                  >
                    <FiberManualRecordIcon sx={{ fontSize: "1em" }} />
                  </span> */}
                  {piHost.phone ? (
                    <span>
                      <EyeCameraIcon device={piHost} />
                      <WorldCameraIcon device={piHost} />
                      <span>
                        <BatteryIndicator
                          size="1em"
                          percent={piHost.phone.battery_level}
                        />
                      </span>
                    </span>
                  ) : null}
                </span>
              </PhoneStatusRight>
            </>
          ) : (
            <span>connecting...</span>
          )}
        </PhoneStatus>
        <GridContainer style={{ display: !showSettings ? "flex" : "none" }}>
          <MediaStreamPlayerContainer
            style={{
              background: "black",
              margin: "0 auto",
              minHeight: "350px",
            }}
            className={className}
          >
            <Limiter ref={limiterRef}>
              <Container aspectRatio={naturalAspectRatio}>
                <Layer>
                  <div
                    style={{
                      zIndex: "-100",
                      width: "100%",
                      height: "100%",
                      background: "grey",
                    }}
                  ></div>
                </Layer>

                {showWorldSensor ? (
                  <Layer>
                    <PlaybackArea
                      forwardedRef={ref}
                      refresh={refresh}
                      play={play}
                      offset={offset}
                      host={worldHost}
                      format={format}
                      parameters={{ camera: "world" }}
                      onPlaying={onPlaying}
                      onEnded={onEnded}
                      onSdp={onSdp}
                      metadataHandler={metadataHandler}
                      secure={secure}
                      autoRetry={autoRetry}
                    />
                  </Layer>
                ) : null}
                {showGazeSensor ? (
                  <Layer style={{ pointerEvents: "none" }}>
                    <GazeOverlay sensor={gazeSensor} />
                  </Layer>
                ) : null}
                <Layer>
                  <Feedback waiting={waiting} />
                </Layer>
                {videoProperties !== undefined ? (
                  <Layer style={{ display: showControls ? "block" : "none" }}>
                    <Controls
                      play={play}
                      videoProperties={videoProperties}
                      src={"host"}
                      parameters={parameters}
                      onPlay={onPlayPause}
                      onStop={onStop}
                      onRefresh={onRefresh}
                      onScreenshot={onScreenshot}
                      onFormat={setFormat}
                      onPiApix={onPiApix}
                      onSeek={setOffset}
                      labels={{
                        play: "Play",
                        pause: "Pause",
                        stop: "Stop",
                        refresh: "Refresh",
                        settings: "Settings",
                        screenshot: "Take a snapshot",
                        volume: "Volume",
                      }}
                      showStatsOverlay={showStatsOverlay}
                      toggleStats={toggleStatsOverlay}
                      format={format}
                      volume={volume}
                      setVolume={setVolume}
                      startTime={startTime}
                      duration={duration}
                    />
                  </Layer>
                ) : null}
                {showControls &&
                showStatsOverlay &&
                videoProperties !== undefined ? (
                  <Stats
                    format={format}
                    videoProperties={videoProperties}
                    refresh={refresh}
                    volume={volume}
                  />
                ) : null}
                <Snackbar
                  anchorOrigin={{ vertical: "top", horizontal: "center" }}
                  open={showSnackbar}
                  autoHideDuration={2000}
                  onClose={clearSnackbar}
                >
                  <Alert
                    style={
                      {
                        info: { background: "rgba(38,50,56,0.8)" },
                        error: { background: "rgba(211,47,47,0.8)" },
                        warning: { background: "rgba(237,108,2,0.8)" },
                        success: { background: "rgba(46,125,50,0.8)" },
                      }[snackMessage.severity]
                    }
                    onClose={clearSnackbar}
                    severity={snackMessage.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                  >
                    {snackMessage.message}
                  </Alert>
                </Snackbar>
                {piHost.current_recording?.action === "START" ? (
                  <ElapsedTimer
                    startNanoseconds={
                      piHost.current_recording?.rec_duration_ns || 0
                    }
                  />
                ) : null}
              </Container>
            </Limiter>
          </MediaStreamPlayerContainer>
          <div style={{ minWidth: "340px" }}>
            <Divider />
            <ContainerWidth>
              <ControlsContainer>
                <ControlButtons onClick={toggleStreamingDevices}>
                  <SwapHorizIcon />
                </ControlButtons>
                <ControlButtons onClick={onRecordButton}>
                  {isRecording ? <RecordStop /> : <RecordReady />}
                </ControlButtons>
                <ControlButtons onClick={toggleShowSettings}>
                  <SettingsIcon></SettingsIcon>
                </ControlButtons>
              </ControlsContainer>
            </ContainerWidth>
            <Divider />
            <ContainerWidth>
              <EventsContainer>
                {eventMenu.map((eventName, index) => {
                  if (!eventName.length) {
                    return null;
                  }
                  return (
                    <EventButton
                      name={eventName}
                      hotkey={(index + 1).toString()}
                      key={index}
                      onClick={() => triggerEvent(eventName)}
                    />
                  );
                })}
                <EventButton
                  name="Custom Event"
                  hotkey="+"
                  onClick={toggleShowCustomEvent}
                />
              </EventsContainer>
            </ContainerWidth>
          </div>
        </GridContainer>
        {showSettings && piHost && (
          <Settings
            isOpen={showSettings}
            toggleSettings={toggleShowSettings}
            device={piHost}
          />
        )}
        <div style={{ display: showCustomEvent ? "block" : "none" }}>
          <CustomEvent
            inputRef={inputRef}
            eventTriggerer={(eventName) => {
              triggerEvent(eventName);
            }}
          />
        </div>
        <div style={{ display: showStreamingDevices ? "block" : "none" }}>
          <StreamingDevices toggleView={toggleStreamingDevices} />
        </div>
      </PlayerArea>
    );
  },
);

const PlayerArea = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 44px 1fr;
  height: 100%;
  background: #10181c;
  color: white;
  overflow: auto;
`;
const PhoneStatus = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 12px 24px;
`;
const DeviceName = styled.div`
  font-size: 12px;
`;
const PhoneStatusRight = styled.div`
  text-align: right;
`;

const ControlsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 32px 0;
  gap: 24px;
`;

const EventsContainer = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px;
  padding: 24px 0;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #263238;
`;

const ControlButtons = styled.button`
  border-radius: 50%;
  width: 60px;
  height: 60px;
  margin: 0 auto !important;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const ContainerWidth = styled.div`
  width: min(45rem, 90%);
  margin: 0 auto;
`;

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  @media screen and (orientation: landscape) {
    flex-direction: row;
  }
  @media screen and (orientation: landscape) and (max-width: 600px) {
    flex-direction: column;
  }
`;

Player.displayName = "Player";
