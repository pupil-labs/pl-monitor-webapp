import React from "react";
import styled from "styled-components";
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
  size?: string;
};

export const BatteryIcon: React.FC<BatteryProps> = ({ percent, size }) => {
  const style = {
    verticalAlign: "middle",
    fontSize: size,
    color: common.white,
  };
  if (percent > 95) {
    return <BatteryFull style={{ ...style }} />;
  } else if (percent >= 90) {
    return <Battery90 style={{ ...style }} />;
  } else if (percent >= 80) {
    return <Battery80 style={{ ...style }} />;
  } else if (percent >= 60) {
    return <Battery60 style={{ ...style }} />;
  } else if (percent >= 50) {
    return <Battery50 style={{ ...style }} />;
  } else if (percent >= 30) {
    return <Battery30 style={{ ...style, color: orange[300] }} />;
  } else {
    return <Battery20 style={{ ...style, color: red[200] }} />;
  }
};

export class BatteryIndicator extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    return (
      <span>
        <BatteryIcon percent={percent} size={"1em"} />
        <span style={{ color: "white", lineHeight: 1, fontSize: "12px" }}>
          {percent} %
        </span>
      </span>
    );
  }
}
