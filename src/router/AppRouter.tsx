import React from "react";
import {Route, Routes} from "react-router-dom";
import PageLayout from "../layouts/PageLayout";
import HomePage from "../pages/HomePage";
import ActivatePage from "../pages/PurchasePage";
import AllAppsPage from "../pages/AllAppsPage";
import MyAppsPage from "../pages/MyAppsPage";
import RestoreLicensePage from "../pages/RestoreLicensePage";


export const AppRouter = () => {
    return (
        <Routes>
            <Route key={0} path={'/'} element={<PageLayout><HomePage/> </PageLayout>}/>
            <Route key={1} path={'/apps'} element={<PageLayout><AllAppsPage/> </PageLayout>}/>
            <Route key={2} path={'/myapps'} element={<PageLayout><MyAppsPage/> </PageLayout>}/>
            <Route key={4} path={'/activate'} element={<PageLayout><ActivatePage/></PageLayout>}/>
            <Route key={5} path={'/restore'} element={<PageLayout><RestoreLicensePage/></PageLayout>}/>
        </Routes>
    );
};
