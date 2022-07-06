import React, {useEffect} from "react";
import {useSearchParams} from "react-router-dom";
import sockclientjs from "sockjs-client";
import {useAppContext} from "../providers/Provider";
import {useNotificationContext} from "../providers/NotificationProvider";
import {IApp} from "../contract-interfaces/IApp";
import {App} from "../contracts-impl/App";
import AppItem from "../components/AppItem";
import {generateLicense, signData} from "../utils/Utils";
import {useSocketIO, useSocketJSClient} from "../hooks/useSocket";

export type ActivateProps = {
    address: string;
    socketPort: string;
    macAddress: string;
    appAddress: string;
}
const DESKTOP_PORT = process.env.REACT_APP_DESKTOP_PORT || "3005";

const PurchasePage = () => {

    const [params] = useSearchParams();
    const {web3, setState, currentAccount} = useAppContext() ?? {};
    const [activateProps, setActivateProps] = React.useState<ActivateProps | null>(null);
    const notCtx = useNotificationContext();
    const [requestApp, setRequestApp] = React.useState<IApp | null>(null);
    const socket = useSocketJSClient(`http://localhost:${DESKTOP_PORT}/activate`);
    const vendorSocket = useSocketIO(process.env.REACT_APP_VENDER_SOCKET_URL || 'ws://localhost:3005');
    useEffect(() => {
        if (!params || !setState || !web3 || !web3.utils || !notCtx) return
        const accountAddress = params.get("address") ?? '';
        if (!web3.utils.isAddress(accountAddress)) {
            notCtx.show("Invalid account address", "error");
            return;
        }

        const appAddress = params.get("appAddress") ?? '';
        if (!web3.utils.isAddress(appAddress)) {
            notCtx.show("Invalid app address", "error");
            return;
        }
        const macAddress = params.get("macAddress") ?? '';
        if (macAddress === '') {
            notCtx.show("Invalid mac address", "error");
            return;
        }

        setActivateProps((prev) => ({
            macAddress: params.get("macAddress") ?? "",
            address: params.get("address") ?? "",
            socketPort: params.get("socketPort") ?? "",
            appAddress: params.get("appAddress") ?? "",
        }))

        const app = new App(web3, appAddress, params.get('address') ?? '');
        app.fetchData().then(() => setRequestApp(app)).catch(e => notCtx.show(e.message, "error"));
        setState({
            currentAccount: params.get("address") ?? "",
        });

    }, [params, setState, web3, notCtx]);

    const onDoneBuy = async (buyer: string) => {
        if (buyer !== currentAccount) {
            notCtx.show("Invalid account", "error");
            return
        }
        if (!web3) {
            notCtx.show("Web3 is not initialized", "error");
            return;
        }

        if (!socket) {
            notCtx.show("WebSocket is not initialized", "error");
            return
        }

        if (!currentAccount) {
            notCtx.show("Current account is not initialized", "error");
            return
        }
        if (!vendorSocket) {
            notCtx.show("Cannot connect to socket of vender", "error");
            return
        }
        const appAddress = activateProps?.appAddress
        if (!appAddress) {
            notCtx.show("App address is not initialized", "error");
            return
        }

        try {
            const signature = await signData(web3, currentAccount, currentAccount);
            console.log("Sign address " + currentAccount)
            vendorSocket.emit('GetMySecret', {
                signature,
                account: currentAccount,
                appAddress,
            })
            vendorSocket?.once("ReceiveMySecret", async ({error, secret}) => {
                console.log("Receive secret")
                if (error) {
                    notCtx.show("Cannot generate license cause " + error, "error");
                    return
                }

                const license = await generateLicense(web3, currentAccount, secret, requestApp!, activateProps!.macAddress)
                socket.send(JSON.stringify({
                    channel: "OnDoneActive",
                    message: "Buy license completed completed",
                    data: license
                }));

            })
        } catch (e: any) {
            notCtx.show(e.message, "error");
        }

    }

    return <div className='w-full flex justify-center'>
        {requestApp && <AppItem app={requestApp} index={0} viewOnly onDoneBuy={onDoneBuy}
                                activateProps={activateProps}
                                showBuy={true}/>}
    </div>;

};

export default PurchasePage;
