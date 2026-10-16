import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router";
import { MainScreen } from "./MainScreen.tsx";
import "./index.css";

const router = createHashRouter([{ path: "/", element: <MainScreen /> }]);

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Missing #root element in index.html");

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
