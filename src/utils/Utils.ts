import {Unit} from "../@types/types";
import Web3 from "web3";
import AES from "crypto-js/aes"
import {IApp} from "../contract-interfaces/IApp";

export const APP_NAME = "appName";
export const APP_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg/69px-Microsoft_Office_Word_%282019%E2%80%93present%29.svg.png'
export const APP_DESCRIPTION = "appDescription";
export const APP_PRICE = 100;
export const DURATION_PER_TOKEN = 10;
export const UNIT = Unit.SECOND;

export const convertHexToMacAddress = (hex: string): string => {
    return hex.match(/.{1,2}/g)!.map(x => parseInt(x, 16).toString(16)).join(":");
}

export const generateLicense = async (web3: Web3, currentAccount: string, secret: string, app: IApp, macAddress: string): Promise<{
    address: string,
    signature: string,
    plain: string
}> => {
    if (!secret) {
        throw new Error("Secret must be defined")
    }

    if (!macAddress.includes(":") && macAddress.startsWith("0x")) {
        macAddress = convertHexToMacAddress(macAddress);
    }
    const timestampPurchased = +new Date();
    const userMacAddress = (await app.getMyMacAddress())

    if (userMacAddress.toLowerCase() !== macAddress.toLowerCase()) {
        throw new Error("Mac address is not match");
    }

    const expiredTimestamp = +(await app.getExpiredTimestamp());
    const plainData = `${timestampPurchased}|${expiredTimestamp}|${macAddress.toLowerCase()}`
    const signature = await web3.eth.personal.sign(plainData, currentAccount, "")
    return Promise.resolve({
        address: currentAccount,
        signature: AES.encrypt(signature, secret).toString(),
        plain: AES.encrypt(plainData, secret).toString()
    });
}