import ReactDOM from "react-dom/client";
import React from "react";
import App from "./components/App.jsx";

import { AuthProvider } from "./contexts/auth.jsx";
import { BrowserRouter } from "react-router-dom";
import { HistoryProvider } from "./contexts/history.jsx";
import { NotificationProvider } from "./contexts/notification.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <NotificationProvider>
        <BrowserRouter>
            <AuthProvider>
                <HistoryProvider>
                    <React.StrictMode>
                        <App/>
                    </React.StrictMode>
                </HistoryProvider>
            </AuthProvider>
        </BrowserRouter>
    </NotificationProvider>
);