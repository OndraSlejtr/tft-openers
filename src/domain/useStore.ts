import { useSyncExternalStore } from "react";
import { bundle } from "../data/bundle.ts";
import { createLocalStorageAdapter } from "./storage.ts";
import { type StoreState, createStore } from "./store.ts";

export const store = createStore(bundle, createLocalStorageAdapter("tft-openers"));

export const useStoreState = (): StoreState => useSyncExternalStore(store.subscribe, store.getState);
