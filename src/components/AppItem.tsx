import React, {useEffect, useMemo, useState} from 'react';
import {IApp} from "../contract-interfaces/IApp";
import {Button, Card, Form, Input, InputNumber} from "antd";
import {AppContractEvents, Unit} from "../@types/types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faClose} from "@fortawesome/free-solid-svg-icons";
import {useAppContext} from "../providers/Provider";
import {useNotificationContext} from "../providers/NotificationProvider";
import {convertHexToMacAddress} from "../utils/Utils";
import {useLocation, useSearchParams} from "react-router-dom";
import {ActivateProps} from "../pages/ActivatePage";

type Props = {
    app: IApp;
    className?: string;
    index: number;
    updateItem?: (index: number, app: IApp) => void;
    viewOnly?: boolean;
    onDoneBuy?: (secret: string) => void;
    activateProps?: ActivateProps | null
    showBuy?: boolean;
    onDoneRestore?: (secret: string) => void
}

export const Line = () => {
    return (
        <hr className='w-full h-1 mb-2'/>
    );
};

interface PurchaseLicenseForm {
    address: string;
    macAddress: string;
    nTokens: number;
}

const INITIAL_DATA_PURCHASE = {nTokens: 1, address: '', macAddress: ''} as PurchaseLicenseForm
const AppItem = ({
                     className,
                     app,
                     updateItem,
                     index,
                     viewOnly,
                     onDoneBuy,
                     activateProps,
                     showBuy,
                     onDoneRestore
                 }: Props) => {

        const {isOwner, rootContract, currentAccount} = useAppContext() ?? {};
        const [params] = useSearchParams();

        const notiCtx = useNotificationContext();
        const [purchaseForm, setPurchaseForm] = useState<PurchaseLicenseForm>(INITIAL_DATA_PURCHASE);
        const location = useLocation();

        useEffect(() => {

                if (!app || !params) {
                    return;
                }
                let macAddress: string = ''
                let address: string = ''

                if (purchaseForm.macAddress === '') {
                    macAddress = params.get("macAddress") ?? '';
                    if (!macAddress.includes(':') && macAddress.startsWith('0x')) {
                        macAddress = convertHexToMacAddress(macAddress);
                    }
                }
                if (purchaseForm.address === '') {
                    address = params.get("address") ?? '';
                }

                setPurchaseForm({
                    address,
                    macAddress,
                    nTokens: 1
                })


                app.removeListener();
                app.listen()
                    .on(AppContractEvents.LicensePurchased, ({buyer, secret}) => {
                        console.log("Purchased app complete, secret: ", secret, " buyer: ", buyer);
                        if (buyer?.toLowerCase() === address?.toLowerCase()) {
                            console.log("Secret " + secret)
                            onDoneBuy?.(secret)
                            notiCtx.show("You with address " + buyer + " has purchased license", 'success');
                        } else {
                            console.log("On done buy with another address")
                            notiCtx.show("User with address " + buyer + " has purchased license", 'success');
                        }
                    })
                    .on(AppContractEvents.LicenseTokenPriceChange, ({newPrice, licenseAddress}) => {
                        if (licenseAddress === app.address) {
                            app.price = newPrice;
                            updateItem?.(index, app);
                        }
                    })
                    .on(AppContractEvents.LicenseTokenActivated, ({licenseAddress}) => {
                        if (licenseAddress === app.address) {
                            app.active = true;
                            updateItem?.(index, app);
                        }
                    })
                    .on(AppContractEvents.LicenseTokenDeActivated, ({licenseAddress}) => {
                        if (licenseAddress === app.address) {
                            app.active = false;
                            updateItem?.(index, app);
                        }
                    })
                    .on(AppContractEvents.RestoreLicense, ({owner, secret}) => {
                        if (currentAccount?.toLowerCase() === owner?.toLowerCase()) {
                            onDoneRestore?.(secret)
                        }
                    })

                return () => {
                    app.removeListener();
                }

            }, [app, params]
        )

        useEffect(() => {
            if (showBuy && params && purchaseForm.address !== '' && purchaseForm.macAddress !== '') {
                handleShowBuyLicense()
            }

            if (location &&
                location.pathname.includes('/restore') &&
                purchaseForm.address !== '' &&
                purchaseForm.macAddress !== '' &&
                params) {
                handleRestoreLicense().then(() => {
                    console.log("License restored")
                }).catch((e) => notiCtx.show(e.message, 'error'))
            }
        }, [showBuy, params, location]);


        const activateApp = async () => {
            if (!rootContract || !isOwner) {
                notiCtx.show('You are not the owner of the root contract', 'error');
                return;
            }
            try {
                notiCtx.show('Waiting to complete the transaction', 'info', 10000);
                await rootContract.activate(app.address)
                notiCtx.hide();
            } catch (e: any) {
                notiCtx.hide();
                notiCtx.show(e.message, 'error');
            }
        };

        const deActivateApp = async () => {
            if (!rootContract || !isOwner) {
                notiCtx.show('You are not the owner of the root contract', 'error');
                return;
            }
            try {
                notiCtx.show('Waiting to complete the transaction', 'info', 10000);
                await rootContract.deactivate(app.address);
                notiCtx.hide();
            } catch (e: any) {
                notiCtx.hide();
                notiCtx.show(e.message, 'error');
            }
        };

        const handleBuyLicense = async (values: PurchaseLicenseForm) => {
            if (!app.active) {
                notiCtx.show('The contract is not activated to purchase a new license token', 'error');
                return;
            }
            const macAddressParam = params.get('macAddress') ?? '';
            values.macAddress = values.macAddress || macAddressParam;

            if (!values.macAddress.includes(":") && values.macAddress.startsWith("0x")) {
                values.macAddress = convertHexToMacAddress(values.macAddress);
            }

            const address = params.get('address') ?? '';
            values.address = values.address || address;
            if (!values.nTokens) {
                values.nTokens = 1;
            }

            try {
                notiCtx.setIsLoading(true)
                if (currentAccount !== app.owner) {
                    await app.purchaseLicense(values.address, values.macAddress, values.nTokens);
                } else {
                    await app.purchaseLicenseInternal(values.address, values.macAddress, values.nTokens)
                }
            } catch (e: any) {
                notiCtx.show(e.message, 'error', 10000);
                console.log(e)
            } finally {
                notiCtx.setIsLoading(false)
            }
        }

        const handleRestoreLicense = async () => {
            try {
                if (!activateProps?.address || !activateProps?.macAddress) {
                    notiCtx.show('Please enter the address and mac address', 'error');
                    return;
                }

                if (!activateProps?.macAddress.includes(":") && activateProps?.macAddress.startsWith("0x")) {
                    activateProps.macAddress = convertHexToMacAddress(activateProps.macAddress);
                }

                await app.restoreLicense(activateProps.macAddress);

            } catch (e: any) {
                notiCtx.show(e.message, 'error', 10000);
            }
        }

        const byeLicenseModal = useMemo(() => {

            return <Card size='small' title='Buy license'>
                <Form initialValues={{
                    macAddress: activateProps?.macAddress ?? '',
                    address: activateProps?.address ?? '',
                    nTokens: 5
                } as PurchaseLicenseForm} onFinish={handleBuyLicense}>
                    <Form.Item
                        label='Address'
                        name='address'
                        rules={[{
                            required: true,
                            message: 'The ether address of the user will use that token!'
                        }]}>
                        <Input placeholder='Address of user will use token of the license'/>
                    </Form.Item>
                    <Form.Item label='Mac address' name='macAddress' rules={[{
                        required: true,
                        message: 'Please enter mac address of the computer of user',
                    }]}>
                        <Input placeholder='Mac address of the computer of  the user'/>
                    </Form.Item>
                    <Form.Item label='Token count' name='nTokens'>
                        <InputNumber placeholder='Number of licence token'/>
                    </Form.Item>
                    <Form.Item className='flex w-full justify-end'>
                        <Button type='ghost' danger htmlType='submit'>Buy license</Button>
                    </Form.Item>
                </Form>
                <Line/>
                <div><strong>Price of token: </strong>{app.price} wei</div>
            </Card>
        }, [activateProps]);

        const handleShowBuyLicense = () => {
            notiCtx.show(byeLicenseModal, 'info', -1);
        }

        className += ' border-2 shadow-md rounded-sm p-5'

        async function withDraw() {
            try {
                await app.withdraw();
                notiCtx.show("Withdraw success", "success")
            } catch (e: any) {
                notiCtx.show(e.message, "error")
            }
        }

        return <div className={`${app.owner === currentAccount ? 'w-1/3' : 'w-1/4'} border-2`}>
            <div
                className={className}
            >
                <div className='flex flex-row justify-around'>
                    <h5>{app.name}</h5>
                    <img src={app.imageUrl} alt="" width={30}/>
                </div>
                <Line/>
                <div className='flex justify-between w-full overflow-ellipsis flex-wrap'><strong>Owner
                    address: </strong>
                    <span className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                    {app.owner}
                    </span>
                </div>
                <Line/>
                <div className='flex justify-between w-full overflow-ellipsis flex-wrap'><strong>App
                    address: </strong>
                    <span className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                    {app.address}
                    </span>
                </div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Description: </strong>{app.appDescription}
                </div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Token License Price: </strong>{app.price}
                </div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Status: </strong>
                    {<FontAwesomeIcon size='2x' color={app.active ? 'green' : 'red'}
                                      icon={app.active ? faCheck : faClose}/>
                    }
                </div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Balance: </strong>{app.balance}</div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Duration per
                    token: </strong>{app.durationPerToken}
                </div>
                <Line/>
                <div className='flex justify-between w-full'><strong>Duration
                    unit: </strong>{Unit[app.unit]?.toLowerCase()}
                </div>
                <Line/>

                {/*App action */}
                <div className='flex justify-between w-full'>
                    {
                        !viewOnly ? (!app.active && isOwner ? <Button onClick={activateApp}>Active</Button> :
                            <Button onClick={deActivateApp}>DeActive</Button>) : (!app.active &&
                            <span
                                className='text-red-400 font-bold'>App is not active yet so you cannot buy the license
                            </span>)
                    }
                    {
                        app.active && <>
                            <Button onClick={handleShowBuyLicense}>Buy license</Button>
                            <Button onClick={handleRestoreLicense}>Restore license</Button>
                            {
                                app.owner === currentAccount && <Button danger onClick={withDraw}>Withdraw</Button>
                            }

                        </>
                    }
                </div>
            </div>
        </div>;
    }
;

export default AppItem;
