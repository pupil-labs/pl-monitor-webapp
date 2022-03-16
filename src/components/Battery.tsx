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
  if (percent > 95) {
    return <BatteryFull style={{ color: common.white, fontSize: size }} />;
  } else if (percent >= 90) {
    return <Battery90 style={{ color: common.white, fontSize: size }} />;
  } else if (percent >= 80) {
    return <Battery80 style={{ color: common.white, fontSize: size }} />;
  } else if (percent >= 60) {
    return <Battery60 style={{ color: common.white, fontSize: size }} />;
  } else if (percent >= 50) {
    return <Battery50 style={{ color: common.white, fontSize: size }} />;
  } else if (percent >= 30) {
    return <Battery30 style={{ color: orange[300], fontSize: size }} />;
  } else {
    return <Battery20 style={{ color: red[200], fontSize: size }} />;
  }
};

export class BatteryIndicator extends React.Component<BatteryProps> {
  render() {
    const percent = this.props.percent;
    return (
      <BatteryIconContainer>
        <BatteryIcon percent={percent} size={"1em"} />
        <span
          style={{ color: "white", verticalAlign: "middle", fontSize: "12px" }}
        >
          {percent} %
        </span>
      </BatteryIconContainer>
    );
  }
}

const BatteryIconContainer = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
`;
