import React from "react";
import {useAppContext} from "../providers/Provider";
import {Menu, MenuProps, PageHeader} from "antd";
import {useNavigate} from "react-router-dom";

type Props = {
    children?: React.ReactNode
};

const PageLayout = ({children}: Props) => {

    const {title, subTitle, items, currentKey, setState} = useAppContext() ?? {};
    const navigate = useNavigate();

    if (!setState) {
        return <div></div>
    }

    const onClick: MenuProps['onClick'] = e => {
        switch (e.key) {
            case 'home':
                navigate('/');
                break;
            case 'apps':
                navigate('/apps');
                break;
            case 'myapps':
                navigate('/myapps');
                break;
            case 'create-license':
                navigate('/create-license');
                break;

        }
        setState({currentKey: e.key});
    };


    return (<>
        <div className='w-full border-2'>
            <PageHeader
                className="site-page-header"
                onBack={() => null}
                title={title}
                subTitle={<div className='font-bold'>{subTitle}</div>}
            />
        </div>
        <Menu onClick={onClick} selectedKeys={[currentKey!!]} mode="horizontal" items={items}/>;
        <div className='w-full mx-auto' style={{minHeight: '80vh'}}>
            {children}
        </div>
        {/*Footer*/}
        <div className='w-full text-center p-4 bg-gray-500 border-2 text-white font-bold'>
            This is a demo app for the use of license management using blockchain technology
            <br/>
            2021 @
        </div>
    </>)
};

export default PageLayout;
