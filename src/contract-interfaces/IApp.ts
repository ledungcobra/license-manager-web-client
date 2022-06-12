import {IEventListener} from "./IEventListener";
import {Unit} from "../@types/types";

export interface IApp extends IEventListener {
    address: string;
    price: number;
    appDescription: string;
    active: boolean;
    owner: string;
    durationPerToken: number;
    balance: number;
    unit: Unit;
    name: string;
    imageUrl: string;

    purchaseLicense(purchaserAddress: string, macAddress: string, nTokens: number): Promise<any>

    setLicensePrice(newPrice: number): Promise<any>

    withdraw(): Promise<any>

    setActive(status: boolean): Promise<any>

    fetchData(): Promise<void>

    purchaseLicenseInternal(address: string, macAddress: string, nTokens: number): Promise<void>;

    getExpiredTimestamp(): Promise<number>;

    getMyMacAddress(): Promise<string>

    restoreLicense(newMacAddress:string): Promise<any>
}