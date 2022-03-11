import React, { useState } from "react";
import styled from "styled-components";
interface CustomEventProps {
  readonly defaultEventName?: string;
  readonly eventTriggerer: (eventName: string) => void;
}

export const CustomEvent: React.FC<CustomEventProps> = ({
  defaultEventName = "",
  eventTriggerer,
}) => {
  const [eventName, setEventName] = useState(defaultEventName);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // TODO(dan): what behavior is wanted here?
    // if (event.key === "Enter") {
    //   eventTriggerer(eventName);
    // }
    // if (event.key === "Escape") {
    //   event.stopPropagation();
    // }
  };
  return (
    <EventCreationContainer>
      <input
        placeholder="Event Name"
        defaultValue={eventName}
        onChange={(e) => setEventName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <CreateButton
        className=""
        aria-label="Create Event"
        onClick={() => eventTriggerer(eventName)}
      >
        Create
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
