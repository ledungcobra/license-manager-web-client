import * as React from 'react';
import Web3 from "web3";
import getWeb3 from "../web3";
import RootContractJSON from '../contracts/RootLicense.json';
import {IRootContract} from "../contract-interfaces/IRootContract";
import {RootContract} from '../contracts-impl/RootContract'
import {MenuProps} from "antd";
import {AppstoreOutlined, MailOutlined, SettingOutlined} from "@ant-design/icons";

type Props = {
    children: React.ReactNode;
};

export enum TypeMenu {Admin, Issuer, User}


type State = {
    web3?: Web3
    typeMenu: TypeMenu
    rootContract: IRootContract
    networkId: number;
    accounts: string[];
    title: string;
    subTitle: string;
    items: any[];
    currentKey: string;
    isOwner: boolean;
    currentAccount: string;
};


interface AppState {
    setState: (data: any) => void
}

// Create Context for AppState
export const AppStateContext = React.createContext<AppState & State | null>(null);
export const useAppContext = () => React.useContext(AppStateContext);

export class Provider extends React.Component<Props, State> {

    state = {
        web3: {} as Web3,
        typeMenu: TypeMenu.Admin,
        rootContract: {} as IRootContract,
        networkId: 0,
        accounts: [],
        title: 'Home',
        subTitle: 'This page is used to create a new app or view list of apps license you own',
        items: [],
        currentKey: 'home',
        isOwner: false,
        currentAccount: ''
    } as State

    async componentDidMount() {
        const web3 = await getWeb3() as Web3;
        const networkId = await web3.eth.net.getId();
        // @ts-ignore
        const address = RootContractJSON.networks[networkId] && RootContractJSON.networks[networkId].address as string
        const licenseRootContract = new web3.eth.Contract(
            // @ts-ignore
            RootContractJSON["abi"],
            address
        );
        const accounts = await web3.eth.getAccounts();
        const contract = new RootContract(licenseRootContract, accounts[0], address, web3)
        await contract.fetchData();

        this.setState({
            web3,
            networkId,
            rootContract: contract,
            accounts,
            currentAccount: accounts[0]
        });

        const _isOwner = await contract.isOwner();
        this.setState({isOwner: _isOwner});

        if (_isOwner) {
            this.setState({
                items: [
                    {
                        label: 'Root Contract',
                        key: 'home',
                        icon: <MailOutlined/>,
                    },
                    {
                        label: 'All Apps',
                        key: 'apps',
                        icon: <AppstoreOutlined/>,
                    },
                    {
                        label: 'My Apps',
                        key: 'myapps',
                        icon: <AppstoreOutlined/>,
                    },
                ]
            })
        } else {
            this.setState({items: []})
        }

    }

    update = (data: any) => {
        this.setState(data)
    }


    render() {
        return (
            <AppStateContext.Provider value={
                {
                    ...(this.state),
                    setState: this.update
                }
            }>
                {this.props.children}
            </AppStateContext.Provider>
        );
    }
}