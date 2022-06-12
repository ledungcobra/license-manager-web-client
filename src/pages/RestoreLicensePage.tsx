import React, {useEffect} from "react";
import {useSearchParams} from "react-router-dom";
import sockclientjs from "sockjs-client";
import {useAppContext} from "../providers/Provider";
import {useNotificationContext} from "../providers/NotificationProvider";
import {IApp} from "../contract-interfaces/IApp";
import {App} from "../contracts-impl/App";
import AppItem from "../components/AppItem";
import {generateLicense} from "../utils/Utils";

type Props = {};
const useSocketClient = (url: string) => {
    const [socket, setSocket] = React.useState<any>(null);
    useEffect(() => {
        const socket = sockclientjs(url);
        socket.onopen = () => {
            console.log("open");
        };
        socket.onmessage = (e: any) => {
            console.log("message", e);
        };
        socket.onclose = () => {
            console.log("close");
        };

        setSocket(socket);
        return () => {
            try {
                socket.send("close");
            } catch (e) {

            }
        };
    }, []);
    return socket;
};

export type ActivateProps = {
    address: string;
    socketPort: string;
    macAddress: string;
    appAddress: string;
}

const RestoreLicenseScreen = (props: Props) => {

    const [params] = useSearchParams();
    const {web3, setState, currentAccount} = useAppContext() ?? {};
    const [activateProps, setActivateProps] = React.useState<ActivateProps | null>(null);
    const [socketPort, setSocketPort] = React.useState<string | undefined>("3005");
    const notCtx = useNotificationContext();
    const [requestApp, setRequestApp] = React.useState<IApp | null>(null);

    const socket = useSocketClient(`http://localhost:${socketPort}/activate`);

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

    const restoreLicense = () =>{

    }
    const onDoneRestore = async (secret: string) => {
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
        const license = await generateLicense(web3, currentAccount, secret, requestApp!, activateProps!.macAddress);
        console.log(license)
        socket.send(JSON.stringify({
            channel: "OnDoneRestore",
            message: "Restore license completed",
            data: license
        }));
    }

    return <div className='w-full flex justify-center'>
        {requestApp && <AppItem app={requestApp} index={0} viewOnly
                                onDoneRestore={onDoneRestore}
                                activateProps={activateProps}
                                showBuy={true}/>}
    </div>;

};

export default RestoreLicenseScreen;
