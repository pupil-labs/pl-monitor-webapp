import React, { useCallback } from "react";
import styled from "styled-components";
import * as monitorSlice from "../slices/monitorSlice";
import { useDispatch } from "react-redux";

interface CustomEventProps {
  readonly isOpen: boolean;
  readonly eventName?: string;
  readonly toggleCustomEvent: () => void;
}

export const CustomEvent: React.FC<CustomEventProps> = ({
  isOpen,
  eventName,
  toggleCustomEvent
}) => {

  const dispatch = useDispatch();
  const createEvent = useCallback(() => {
    if (isOpen) {
      if (eventName !== undefined) {
        dispatch(monitorSlice.actions.addCustomPresetEvent(eventName));
        toggleCustomEvent();
      } else {
        toggleCustomEvent();
      }
    }
  }, [isOpen, dispatch, eventName, toggleCustomEvent]);

  const onEventnameChange = useCallback((e) => {
    eventName = e.target.value
  }, []);

  return (
    <EventCreationContainer>
      <input
        placeholder="Event Name"
        defaultValue={eventName}
        onChange={(e) => onEventnameChange(e)}
      />
      <CreateButton
        className=""
        aria-label="Create Event"
        onClick={() => createEvent()}
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
`

const CreateButton = styled.button`
  background-color: #1263cc;
  height: 48px;
`