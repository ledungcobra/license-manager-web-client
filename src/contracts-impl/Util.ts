import {IApp} from "../contract-interfaces/IApp";
import {App} from "./App";
import Web3 from "web3";

export class Util {
    static async addressesToApp(addresses: string[], web3: Web3, userAddress: string): Promise<IApp[]> {
        if (!addresses) {
            addresses = [];
        }
        return Promise.all(addresses.map(async appAddress => {
            const app = new App(web3, appAddress, userAddress);
            await app.fetchData();
            return app as IApp
        }))
    }
}