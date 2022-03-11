import React from "react";
import styled from "styled-components";

interface EventButtonProps {
  readonly hotkey: string;
  readonly name: string;
  readonly onClick?: () => void
}

export const EventButton: React.FC<EventButtonProps> = ({
  hotkey,
  name,
  onClick
}) => {

  return (
    <EventButtonContainer onClick={onClick}>
      <EventButtonHotkey>{hotkey}</EventButtonHotkey>
      <EventButtonName>{name}</EventButtonName>
    </EventButtonContainer>
  );
};

const EventButtonContainer = styled.button`
  background: #10181c;
  color: white;
  text-align: center;
  display: grid;
  // grid-template-rows: 1fr auto;
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