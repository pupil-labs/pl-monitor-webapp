import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import counterReducer from "./features/counter/counterSlice";
import * as monitorSlice from "./slices/monitorSlice";
import monitorReducer from "./slices/monitorSlice";

export const store = configureStore({
  reducer: {
    monitor: monitorReducer,
    counter: counterReducer,
  },
});

store.subscribe(() => {
  const presetEvents = store.getState().monitor.presetEvents;
  localStorage.setItem("presetEvents", JSON.stringify(presetEvents));
});

const loadPresetEventsFromLocalStorage = () => {
  const presetEventsData = localStorage.getItem("presetEvents");
  if (!presetEventsData) {
    return;
  }
  let presetEvents = [];
  try {
    presetEvents = JSON.parse(presetEventsData);
  } catch (error) {
    console.log("error loading presetEvents", error);
    localStorage.removeItem("presetEvents");
    return;
  }
  store.dispatch(monitorSlice.actions.setPresetEvents(presetEvents));
};

window.addEventListener("storage", (event) => {
  loadPresetEventsFromLocalStorage();
});
loadPresetEventsFromLocalStorage();

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
