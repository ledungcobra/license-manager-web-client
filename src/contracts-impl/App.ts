import {IApp} from "../contract-interfaces/IApp";
import Web3 from "web3";
import LicenseToken from '../contracts/LicenseToken.json';
import EventEmitter from "events";
import {AppContractEvents, Unit} from "../@types/types";

export class App implements IApp {

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get imageUrl(): string {
        return this._imageUrl;
    }

    set imageUrl(value: string) {
        this._imageUrl = value;
    }

    get balance(): number {
        return this._balance;
    }

    set balance(value: number) {
        this._balance = value;
    }

    get unit(): Unit {
        return this._unit;
    }

    set unit(value: Unit) {
        this._unit = value;
    }

    get durationPerToken(): number {
        return this._durationPerToken;
    }

    set durationPerToken(value: number) {
        this._durationPerToken = value;
    }

    get price(): number {
        return this._price;
    }

    set price(value: number) {
        this._price = value;
    }

    get owner(): string {
        return this._owner;
    }

    set owner(value: string) {
        this._owner = value;
    }

    get appDescription(): string {
        return this._appDescription;
    }

    set appDescription(value: string) {
        this._appDescription = value;
    }

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
    }

    get address(): string {
        return this._address;
    }

    private _active: boolean;
    private _appDescription: string;
    private _owner: string;
    private _price: number;
    private _contract: any;
    private _balance: number = 0;
    private readonly _eventEmitter: EventEmitter;
    private _durationPerToken: number = 0;
    private _unit: Unit = Unit.SECOND;
    private readonly _address: string = '';

    constructor(private web3: Web3, private contractAddress: string, private _userAddress: string) {
        this._active = false;
        this._appDescription = "";
        this._owner = "";
        this._price = 0;
        this._address = contractAddress;
        this._contract = new web3.eth.Contract(LicenseToken['abi'] as any, contractAddress)
        this._eventEmitter = new EventEmitter();
    }

    private _imageUrl: string = '';
    private _name: string = '';

    async fetchData() {
        this._active = await this._contract.methods.active().call();
        this._appDescription = await this._contract.methods.appDescription().call();
        this._owner = await this._contract.methods.owner().call();
        this._price = await this._contract.methods.price().call();
        this._unit = +(await this._contract.methods.unit().call()) as Unit;
        this._durationPerToken = +(await this._contract.methods.durationPerToken().call()) as number;
        this._balance = +(await this._contract.methods.balance().call()) as number;
        this._name = await this._contract.methods.name().call();
        this._imageUrl = await this._contract.methods.symbol().call();
    }

    async purchaseLicense(purchaserAddress: string, macAddress: string, nTokens: number): Promise<any> {
        if (!this.active) {
            throw new Error("App is not active")
        }
        if (nTokens <= 0) {
            throw new Error("Number of tokens must be greater than 0")
        }

        return this._contract.methods.purchaseLicense(purchaserAddress, macAddress, nTokens).send({
            from: purchaserAddress,
            value: this._price * nTokens
        })
    }

    async purchaseLicenseInternal(purchaserAddress: string, macAddress: string, nTokens: number): Promise<any> {
        if (!this.active) {
            throw new Error("App is not active")
        }
        if (nTokens <= 0) {
            throw new Error("Number of tokens must be greater than 0")
        }

        return this._contract.methods.purchaseLicenseInternal(purchaserAddress, macAddress, nTokens).send({
            from: this._userAddress,
            value: 0
        })
    }

    async setActive(status: boolean): Promise<any> {
        return await this._contract.methods.setActive(status).send({
            from: this._userAddress
        })
    }

    async setLicensePrice(newPrice: number): Promise<any> {
        return await this._contract.methods.setLicensePrice(newPrice).send({
            from: this._userAddress
        })
    }

    async withdraw(): Promise<any> {
        return await this._contract.methods.withdraw().send({from: this._userAddress})
    }

    static readonly AppEvents: string[] = [
        AppContractEvents.LicensePurchased,
        AppContractEvents.LicenseTokenPriceChange,
        AppContractEvents.LicenseTokenActivated,
        AppContractEvents.LicenseTokenDeActivated,
        AppContractEvents.RestoreLicense
    ]

    private events: EventEmitter[] = []

    listen(): EventEmitter {
        this.events = App.AppEvents.map(e => {
            return this._contract?.events[e]().on('data', (evt: any) => {
                this._eventEmitter.emit(e, evt.returnValues);
            }) as EventEmitter

        })
        return this._eventEmitter;
    }

    removeListener(): void {
        this.events.forEach(e => e.removeAllListeners('data'))
        App.AppEvents.forEach(e => this._eventEmitter.removeAllListeners(e))
    }

    getExpiredTimestamp(): Promise<number> {
        return this._contract.methods.getExpiredTimestamp().call({from: this._userAddress})
    }

    async getMyMacAddress(): Promise<string> {
        return (await this._contract.methods.addressToMacAddress(this._userAddress).call({from: this._userAddress})).toLowerCase();
    }

    async restoreLicense(newMacAddress: string): Promise<any> {
        return await this._contract.methods.restoreLicense(newMacAddress).send({
            from: this._userAddress,
            value: this.price / 2
        });
    }

}