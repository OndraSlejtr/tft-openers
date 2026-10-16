import { useSyncExternalStore } from "react";
import { bundle } from "../data/bundle.ts";
import { type StoreState, createStore } from "./store.ts";

export const store = createStore(bundle);

export const useStoreState = (): StoreState => useSyncExternalStore(store.subscribe, store.getState);
