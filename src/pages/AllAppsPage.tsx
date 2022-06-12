import React, {useEffect} from 'react';
import {useAppContext} from "../providers/Provider";
import {IApp} from "../contract-interfaces/IApp";
import AppDisplay from "../components/AppDisplay";

const AllAppsPage = () => {

    const {rootContract} = useAppContext() ?? {}
    const [apps, setApps] = React.useState<IApp[]>([])

    useEffect(() => {
        if (!rootContract || Object.keys(rootContract).length === 0) {
            return;
        }

        (async function () {
                const apps = await rootContract?.getApps()
                console.log(apps)
                setApps(apps)
            }
        )();

    }, [rootContract])


    return (
        <div className='w-full'>
            <AppDisplay apps={apps}/>
        </div>
    );
};

export default AllAppsPage;
