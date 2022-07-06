import {IApp} from "./IApp";
import {IEventListener} from "./IEventListener";
import {Unit} from "../@types/types";

export interface IRootContract extends IEventListener {

    address: string;
    balance: number;
    licenseRegistrationFee: number;

    licensePrice(): Promise<any>

    owner(): Promise<string>

    createNewLicenseToken: (appName: string, appImageURL: string, appDescription: string, priceInWei: number, durationPerToken: number, unit: Unit) => Promise<any>
    withdraw: () => Promise<any>
    getApps: () => Promise<Array<IApp>>

    activate(appAddress: string): Promise<any>

    deactivate(appAddress: string): Promise<any>

    setLicenseFee(amount: number): Promise<any>

    isOwner(): Promise<boolean>

    getMyApps(account: string): Promise<IApp[]>;

    fetchData(): Promise<void>
}