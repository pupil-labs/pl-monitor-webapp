import React, { useState, useEffect, useCallback } from "react";
import * as monitorSlice from "../slices/monitorSlice";
import { Snackbar, SnackbarContent } from "@mui/material";

interface TimerProp {
  readonly recording: monitorSlice.PiHost["current_recording"];
  readonly rec_status: boolean;
}

export const ElapsedTimer: React.FC<TimerProp> = ({
  recording,
  rec_status,
}) => {
  const start_time = () => {
    if (recording) {
      return recording.rec_duration_ns / 1000000000;
    } else {
      return 0;
    }
  };

  const [totalSec, setTotalSec] = useState<number>(start_time);
  const [recTime, setrecTime] = useState<string | undefined>("00:00:00");
  const [showRecTimeSnackbar, setShowRecTimeSnackbar] = useState(false);
  const clearRecTimeSnackbar = (
    event: React.SyntheticEvent<any> | Event,
    reason: string
  ) => {
    if (reason === "clickaway") {
      return;
    } else {
      setShowRecTimeSnackbar(false);
    }
  };

  const formatTime = (elapsed_time: number) => {
    const hour = Math.floor(elapsed_time / 3600);
    const min = Math.floor((elapsed_time - hour * 3600) / 60);
    const sec = Math.floor(elapsed_time - (hour * 3600 + min * 60));
    const h = hour < 10 ? "0" + hour : hour;
    const m = min < 10 ? "0" + min : min;
    const s = sec < 10 ? "0" + sec : sec;
    return `${h}:${m}:${s}`;
  };

  const timer = useCallback(() => {
    if (recording) {
      setTotalSec(totalSec + 1);
      const formattedTime = formatTime(totalSec);
      setrecTime(formattedTime);
    } else {
      setTotalSec(totalSec + 1);
      const formattedTime = formatTime(totalSec);
      setrecTime(formattedTime);
    }
  }, [recording, totalSec]);

  useEffect(() => {
    if (rec_status) {
      setShowRecTimeSnackbar(true);
      const intervalTimer = setInterval(timer, 1000);
      return () => clearInterval(intervalTimer);
    } else {
      setTotalSec(0);
      setrecTime("00:00:00");
      setShowRecTimeSnackbar(false);
    }
  }, [rec_status, recording, timer, totalSec]);

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={showRecTimeSnackbar}
      onClose={(e, reason) => clearRecTimeSnackbar(e, reason)}
    >
      <SnackbarContent
        sx={{ minWidth: "unset !important", flexGrow: "initial" }}
        message={recTime}
      />
    </Snackbar>
  );
};
