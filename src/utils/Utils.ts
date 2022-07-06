import AES from "crypto-js/aes";
import Web3 from "web3";
import { Unit } from "../@types/types";
import { IApp } from "../contract-interfaces/IApp";

export const APP_NAME = process.env.REACT_APP_APP_NAME!!;
export const APP_IMG = process.env.REACT_APP_APP_IMG!!;
export const APP_DESCRIPTION = process.env.REACT_APP_APP_DESCRIPTION!!;
export const UNIT = Unit.SECOND;

export const convertHexToMacAddress = (hex: string): string => {
    return hex
        .match(/.{1,2}/g)!
        .map((x) => parseInt(x, 16).toString(16))
        .join(":");
};

export const generateLicense = async (
    web3: Web3,
    currentAccount: string,
    secret: string,
    app: IApp,
    macAddress: string
): Promise<{
    address: string;
    signature: string;
    plain: string;
}> => {
    if (!secret) {
        throw new Error("Secret must be defined");
    }

    if (!macAddress.includes(":") && macAddress.startsWith("0x")) {
        macAddress = convertHexToMacAddress(macAddress);
    }
    const timestampPurchased = +new Date();
    const userMacAddress = await app.getMyMacAddress();

    if (userMacAddress.toLowerCase() !== macAddress.toLowerCase()) {
        throw new Error("Mac address is not match");
    }

    const expiredTimestamp = +(await app.getExpiredTimestamp());
    const plainData = `${timestampPurchased}|${expiredTimestamp}|${macAddress.toLowerCase()}`;
    const signature = await signData(web3,plainData, currentAccount, );
    return Promise.resolve({
        address: currentAccount,
        signature: AES.encrypt(signature, secret).toString(),
        plain: AES.encrypt(plainData, secret).toString(),
    });
};


export const signData = (web3:Web3,plainData:string, currentAccount:string): Promise<string>  =>{
    return  web3.eth.personal.sign(plainData, currentAccount, "");
}