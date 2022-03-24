import React, { useState, useEffect } from "react";
import { Snackbar, SnackbarContent } from "@mui/material";
import { Duration } from "luxon";

interface TimerProp {
  readonly startNanoseconds: number;
}

export const ElapsedTimer: React.FC<TimerProp> = ({ startNanoseconds = 0 }) => {
  const [elapsedNanoseconds, setElapsedNanoseconds] =
    useState<number>(startNanoseconds);

  const screenFPS = 60;
  const updateFrequencyMilliseconds = 1000 / screenFPS;
  useEffect(() => {
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      setElapsedNanoseconds((time) => time + updateFrequencyMilliseconds * 1e6);
    }, updateFrequencyMilliseconds);
    return () => {
      clearInterval(interval);
    };
  }, [startNanoseconds, updateFrequencyMilliseconds]);

  const formatTime = (seconds: number) => {
    return Duration.fromMillis(seconds * 1e3).toFormat("h:mm:ss");
  };
  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={true}
    >
      <SnackbarContent
        sx={{ minWidth: "unset !important", flexGrow: "initial" }}
        message={formatTime(elapsedNanoseconds / 1e9)}
      />
    </Snackbar>
  );
};
