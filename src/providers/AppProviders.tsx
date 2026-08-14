import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AgoraCallProvider } from "../context/AgoraCallContext";
import { HomePage } from "../routes/HomePage";
import { JoinPage } from "../routes/JoinPage";
import { theme } from "../theme";

export function AppProviders() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <AgoraCallProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AgoraCallProvider>
    </MantineProvider>
  );
}
