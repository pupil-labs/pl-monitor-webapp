import React, { useState } from "react";
import styled from "styled-components";
interface CustomEventProps {
  readonly defaultEventName?: string;
  readonly inputRef?: React.RefObject<HTMLInputElement>;
  readonly eventTriggerer: (eventName: string) => void;
}

export const CustomEvent: React.FC<CustomEventProps> = ({
  defaultEventName = "",
  inputRef,
  eventTriggerer,
}) => {
  const [eventName, setEventName] = useState(defaultEventName);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      eventTriggerer(eventName);
      setEventName("");
    }
    if (event.key === "Escape") {
      setEventName("");
    }
  };

  return (
    <EventCreationContainer>
      <input
        ref={inputRef}
        placeholder="Event Name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <CreateButton
        className=""
        aria-label="Send Event"
        onClick={() => {
          eventTriggerer(eventName);
          setEventName("");
        }}
      >
        Send
      </CreateButton>
    </EventCreationContainer>
  );
};

const EventCreationContainer = styled.div`
  display: grid;
  grid-template-columns: auto 100px;
  gap: 16px;
  padding: 32px 28px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #10181c;
`;

const CreateButton = styled.button`
  background-color: #1263cc;
  height: 48px;
`;
