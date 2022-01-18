import React from "react";
import {
  Battery20,
  Battery30,
  Battery50,
  Battery60,
  Battery80,
  Battery90,
  BatteryFull,
} from "@mui/icons-material";
import { red, orange, common } from "@mui/material/colors";

export type BatteryProps = {
  percent: number;
};

export class BatteryIconA extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    const sx = {
      fontSize: 40,
      verticalAlign: "middle",
    };

    if (percent > 95) {
      return <BatteryFull sx={{ ...sx, color: common.white }} />;
    } else if (percent >= 90) {
      return <Battery90 sx={{ ...sx, color: common.white }} />;
    } else if (percent >= 80) {
      return <Battery80 sx={{ ...sx, color: common.white }} />;
    } else if (percent >= 60) {
      return <Battery60 sx={{ ...sx, color: common.white }} />;
    } else if (percent >= 50) {
      return <Battery50 sx={{ ...sx, color: common.white }} />;
    } else if (percent >= 30) {
      return <Battery30 sx={{ ...sx, color: orange[200] }} />;
    } else {
      return <Battery20 sx={{ ...sx, color: red[200] }} />;
    }
  }
}

export const BatteryIcon: React.FC<BatteryProps> = ({ percent }) => {
  if (percent > 95) {
    return <BatteryFull />;
  } else if (percent >= 90) {
    return <Battery90 />;
  } else if (percent >= 80) {
    return <Battery80 />;
  } else if (percent >= 60) {
    return <Battery60 />;
  } else if (percent >= 50) {
    return <Battery50 />;
  } else if (percent >= 30) {
    return <Battery30 />;
  } else {
    return <Battery20 />;
  }
};

export class BatteryIndicator extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    return (
      <div>
        <BatteryIcon percent={percent} />
        <span style={{ color: "white", verticalAlign: "middle" }}>
          {percent} %
        </span>
      </div>
    );
  }
}
