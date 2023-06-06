import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import monitorReducer, * as monitorSlice from "./slices/monitorSlice";

export const store = configureStore({
  reducer: {
    monitor: monitorReducer,
  },
});

store.subscribe(() => {
  const state = store.getState().monitor;
  localStorage.setItem("presetEvents", JSON.stringify(state.presetEvents));
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
