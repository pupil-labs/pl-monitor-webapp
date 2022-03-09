import {
  useState,
  forwardRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from "react";
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
    },
    ref
  ) => {
    // const dispatch = useDispatch();
    const [play, setPlay] = useState(autoPlay);
    const [offset, setOffset] = useState(0);
    const [refresh, setRefresh] = useState(0);
    const [waiting, setWaiting] = useState(autoPlay);
    const [volume, setVolume] = useState<number>();
    const [format, setFormat] = useState<Format>(initialFormat);
    const [settings, setShowSettings] = useState(settingsIsOpen);

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
        : false
    );

    useEffect(() => {
      if (window?.localStorage !== undefined) {
        window.localStorage.setItem(
          "stats-overlay",
          showStatsOverlay ? "on" : "off"
        );
      }
    }, [showStatsOverlay]);

    /**
     * Controls
     */
    const [videoProperties, setVideoProperties] = useState<VideoProperties>();

    const onPlaying = useCallback(
      (props: VideoProperties) => {
        setVideoProperties(props);
        setWaiting(false);
        setVolume(props.volume);
        // set fast playback speed so playback returns to realtime after pauses
        // @ts-ignore
        props.el.playbackRate = 3;
      },
      [setWaiting]
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

    const onShowSettings = useCallback(() => {
      if (settings) {
        setShowSettings(false);
      } else {
        setShowSettings(true);
      }
    }, [settings]);

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
    let showWorldSensor = false;
    let worldHost = "";
    if (piHost.is_dummy) {
      worldHost = "dummy";
      showWorldSensor = true;
    } else if (worldSensor && worldSensor.connected) {
      worldHost = `${worldSensor.ip}:${worldSensor.port}`;
      showWorldSensor = true;
    }

    const gazeSensor = piHost.sensors["gaze-WEBSOCKET"];
    const showGazeSensor = gazeSensor && gazeSensor.connected;
    const eventMenu = useSelector((state: RootState) => {
      return state.monitor.presetEvents;
    });
    // const addCustomEvent = useCallback((device) => {}, []);

    return (
      <PlayerArea>
        <PhoneStatus>
          {piHost.phone ? (
            <>
              <DeviceName>{piHost.phone.device_name}</DeviceName>
              <PhoneStatusRight>
                <BatteryIndicator
                  percent={piHost.phone.battery_level}
                  size="20px"
                />
              </PhoneStatusRight>
            </>
          ) : (
            <span>connecting...</span>
          )}
        </PhoneStatus>
        <GridContainer>
          <MediaStreamPlayerContainer
            style={{
              background: "black",
              margin: "0 auto",
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
                {showControls && videoProperties !== undefined ? (
                  <Layer>
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
              </Container>
            </Limiter>
          </MediaStreamPlayerContainer>
          <div style={{ minWidth: "340px" }}>
            <Divider />
            <ContainerWidth>
              <ControlsContainer>
                <ControlButtons>
                  <SwapHorizIcon></SwapHorizIcon>
                </ControlButtons>
                <ControlButtons onClick={onPlayPause}>
                  {play === true ? <RecordStop /> : <RecordReady />}
                </ControlButtons>
                <ControlButtons onClick={onShowSettings}>
                  <SettingsIcon></SettingsIcon>
                </ControlButtons>
              </ControlsContainer>
            </ContainerWidth>
            <Divider />
            <ContainerWidth>
              <EventsContainer>
                {eventMenu.map((eventName, index) => (
                  <EventButton
                    name={eventName}
                    hotkey={(index + 1).toString()}
                    key={index}
                  />
                ))}
                <EventButton name="Custom Event" hotkey="+" />
              </EventsContainer>
            </ContainerWidth>
          </div>
        </GridContainer>
        {settings && piHost && (
          <Settings
            isOpen={settings}
            toggleSettings={onShowSettings}
            device={piHost}
          />
        )}
      </PlayerArea>
    );
  }
);

// TODO(dan): move to eventbutton component
export const EventButton = (props: { hotkey: string; name: string }) => {
  // const dispatch = useDispatch();
  // const [customName, setCustomName] = useState(name);

  // // Handles show/hide stats
  // const setCustomName = useCallback(
  //   (newName) => {
  //     setCustomName((prevState) => newName);
  //   },
  //   [setCustomName]
  // );

  // const toggleDevice = useCallback((device) => {
  //   dispatch(monitorSlice.actions.showDevicePlayer(device.ip));
  // }, []);

  return (
    <EventButtonContainer>
      <EventButtonHotkey>{props.hotkey}</EventButtonHotkey>
      <EventButtonName>{props.name}</EventButtonName>
    </EventButtonContainer>
  );
};

const EventButtonContainer = styled.button`
  background: #10181c;
  color: white;
  text-align: center;
  display: grid;
  grid-template-rows: 1fr 20px);
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 0;
  border: none;
  box-sizing: border-box;
  :focus {
    outline: none;
    filter: unset;
  }
`;

const EventButtonHotkey = styled.div`
  padding: 12px;
  border-radius: 50%;
  height: 32px;
  width: 32px;
  background-color: #455a64;
  margin: 0 auto;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const EventButtonName = styled.div`
  text-align: center;
  padding: 0px;
  font-size: 14px;
  @media (orientation: landscape) {
    min-height: 32px;
  }
`;

const PlayerArea = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 44px 1fr;
  height: 100%;
  background: #10181c;
  color: white;
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
`;

Player.displayName = "Player";
