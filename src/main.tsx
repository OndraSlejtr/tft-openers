import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router";
import { DataPage } from "./DataPage.tsx";
import { MainScreen } from "./MainScreen.tsx";
import "./index.css";

const router = createHashRouter([
  { path: "/", element: <MainScreen /> },
  { path: "/data", element: <DataPage /> },
]);

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Missing #root element in index.html");

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
