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
};

export class BatteryIconA extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    const sx = {
      fontSize: 24,
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
  const sty = {
    width: "20px",
    height: "20px",
  };
  if (percent > 95) {
    return <BatteryFull style={sty} />;
  } else if (percent >= 90) {
    return <Battery90 style={sty} />;
  } else if (percent >= 80) {
    return <Battery80 style={sty} />;
  } else if (percent >= 60) {
    return <Battery60 style={sty} />;
  } else if (percent >= 50) {
    return <Battery50 style={sty} />;
  } else if (percent >= 30) {
    return <Battery30 style={sty} />;
  } else {
    return <Battery20 style={sty} />;
  }
};

export class BatteryIndicator extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    return (
      <AlignCenter>
        <BatteryIcon percent={percent} />
        <span
          style={{ color: "white", verticalAlign: "middle", fontSize: "12px" }}
        >
          {percent} %
        </span>
      </AlignCenter>
    );
  }
}

const AlignCenter = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
`;
