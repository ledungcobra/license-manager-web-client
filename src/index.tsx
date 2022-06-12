import "antd/dist/antd.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import "./index.scss";
import {AppRouter} from "./router/AppRouter";
import {Provider} from "./providers/Provider";
import NotificationProvider from "./providers/NotificationProvider";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <NotificationProvider >
                <Provider>
                    <AppRouter/>
                </Provider>
            </NotificationProvider>
        </BrowserRouter>
    </React.StrictMode>
);
