import React, {useEffect} from 'react';
import {useAppContext} from "../providers/Provider";
import {IApp} from "../contract-interfaces/IApp";
import AppDisplay from "../components/AppDisplay";

const MyAppsPage = () => {

    const {rootContract, accounts} = useAppContext() ?? {}
    const [apps, setApps] = React.useState<IApp[]>([])

    useEffect(() => {
        if (!rootContract || Object.keys(rootContract).length === 0) {
            return;
        }

        (async function () {
                const apps = await rootContract.getMyApps(accounts![0])
                setApps(apps)
            }
        )();

    }, [rootContract])


    return (
        <div>
            <AppDisplay apps={apps}/>
        </div>
    );
};

export default MyAppsPage;
