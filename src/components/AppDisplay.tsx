import React, {useEffect, useState} from 'react';
import {IApp} from "../contract-interfaces/IApp";
import AppItem from "./AppItem";
import {Button, Checkbox, Input} from "antd";
import _ from 'lodash';

type Props = {
    apps: IApp[]
}

function deepCopy(obj:any) :any{
   return Object.assign({}, obj);
}

const AppDisplay = ({apps}: Props) => {

    const [showAll, setShowAll] = useState(true);
    const [filterApps, setFilterApps] = useState<IApp[]>(apps);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        if (showAll) {
            setFilterApps(apps);
        } else {
            setFilterApps(apps.filter(app => app.active));
        }
    }, [showAll, apps])

    const onFilterClick = () => {
        setFilterApps(apps.filter(app => app.name.toLowerCase().includes(searchInput.toLowerCase())));
    }

    const updateItem = (index: number, app: IApp) => {
        const newApps = [...apps];
        newApps[index] = _.cloneDeep(app);
        setFilterApps(newApps);
    }

    return (
        <div className='w-full p-5 space-y-5'>
            <div className='flex w-3/4 space-x-2 items-center'>
                <Input placeholder={'Enter app name to filter'}
                       className='w-1/2' value={searchInput}
                       onKeyDown={(e) => {
                           if (e.key === 'Enter') onFilterClick()
                       }}
                       onChange={e => setSearchInput(e.target.value)}/>
                <Button type='primary' ghost onClick={onFilterClick}>Search</Button>
                <div>
                    {

                        !showAll ? 'Show activated apps' : 'Show all apps'
                    }

                    : <Checkbox defaultChecked={showAll}
                                onClick={v => {
                                    setShowAll(!showAll)
                                }}/>
                </div>
            </div>
            <div className='w-full mx-auto flex flex-wrap space-x-3'>
                {
                    filterApps.map((a, index) => {
                        return <AppItem key={index} app={a} index={index} updateItem={updateItem}/>
                    })
                }
            </div>
        </div>
    );
};

export default AppDisplay;
