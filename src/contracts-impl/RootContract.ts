import {IRootContract} from "../contract-interfaces/IRootContract";
import {IApp} from "../contract-interfaces/IApp";
import Web3 from "web3";
import {Util} from "./Util";
import EventEmitter from "events";
import {RootContractEvents, Unit} from "../@types/types";

export class RootContract implements IRootContract {

    get licenseRegistrationFee(): number {
        return this._licenseRegistrationFee;
    }

    get balance(): number {
        return this._balance;
    }

    get address(): string {
        return this._address;
    }

    set balance(value: number) {
        this._balance = value;
    }


    private _contract: any;
    private readonly _emitter: EventEmitter;

    constructor(private rootContract: any, private userAddress: string, private _address: string, private web3: Web3) {
        this._contract = rootContract;
        this._emitter = new EventEmitter.EventEmitter();
    }

    async createNewLicenseToken(appName: string, appImageURL: string,
                                appDescription: string,
                                priceInWei: number,
                                durationPerToken: number,
                                unit: Unit): Promise<any> {
        if (priceInWei < 0) {
            return Promise.reject("Price must greater than or equal to zero wei");
        }

        return this._contract.methods.createNewLicenseToken(appName, appImageURL, appDescription, priceInWei, durationPerToken, unit).send({
            from: this.userAddress,
            value: this._licenseRegistrationFee
        })
    }


    async getApps(): Promise<Array<IApp>> {
        const appAddress = await this._contract.methods.getApps().call() as string[];
        return Util.addressesToApp(appAddress, this.web3, this.userAddress);
    }

    async withdraw(): Promise<any> {
        const owner = await this.owner()
        if (this.userAddress !== owner) {
            return Promise.reject("You are not the owner of this contract")
        }

        return this._contract.methods.withdraw().send({from: this.userAddress})
    }

    async activate(appAddress: string): Promise<any> {
        const owner = await this.owner()
        if (this.userAddress !== owner) {
            return Promise.reject("You are not the owner of this contract")
        }
        return this._contract.methods.activate(appAddress).send({from: this.userAddress});
    }

    async licensePrice(): Promise<any> {
        return await this._contract.method.licensePrice().call();
    }

    async setLicenseFee(amount: number): Promise<any> {
        const owner = await this.owner()
        if (this.userAddress !== owner) {
            return Promise.reject("You are not the owner of this contract")
        }
        return await this._contract.methods.setLicenseFee(amount).send({from: this.userAddress});
    }

    async owner(): Promise<string> {
        try {
            return await this._contract.methods.owner().call()
        } catch (e) {
            console.log(e)
            return Promise.reject("You are not the owner of this contract")
        }
    }

    async isOwner(): Promise<boolean> {
        let owner = null;
        try {
            owner = await this.owner();
        } catch (e) {
            console.log(e)
        }
        return owner?.toLowerCase() === this.userAddress.toLowerCase()
    }

    async getMyApps(account: string): Promise<IApp[]> {
        const addresses = await this._contract.methods.getMyApps().call({from: account}) as string[]
        return Util.addressesToApp(addresses, this.web3, this.userAddress)
    }

    static CONTRACT_EVENTS: RootContractEvents[] = [
        RootContractEvents.OnAddedNewApp,
        RootContractEvents.OnAppActivated,
        RootContractEvents.OnAppDeactivated,
        RootContractEvents.OnLicenseFeeChanged,
        RootContractEvents.OnBalanceChanged
    ];

    private events: EventEmitter[] = [];

    listen(): EventEmitter {
        this.events = RootContract.CONTRACT_EVENTS.map(e => {
            return this._contract.events[e]().on('data', (evt: any) => {
                this._emitter.emit(e, evt.returnValues);
            }) as EventEmitter
        })
        return this._emitter;
    }

    removeListener() {
        for (let i = 0; i < this.events.length; i++) {
            this.events[i].removeAllListeners('data');
        }
        RootContract.CONTRACT_EVENTS.forEach(e => this._emitter.removeAllListeners(e))
    }

    private _balance: number = 0;
    private _licenseRegistrationFee: number = 0;

    async fetchData(): Promise<void> {
        this._balance = +(await this._contract.methods.balance().call());
        this._licenseRegistrationFee = +(await this._contract.methods.licenseFee().call());
        return Promise.resolve();
    }

    deactivate(appAddress: string): Promise<any> {
        return this._contract.methods.deactivate(appAddress).send({from: this.userAddress});
    }
}