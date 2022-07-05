import { faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert, Button, Card, Divider, Form, Input, InputNumber, Select, Skeleton } from "antd";
import React, { useState } from "react";
import { RootContractEvents, Unit } from "../@types/types";
import { IApp } from "../contract-interfaces/IApp";
import { App } from "../contracts-impl/App";
import { useAppContext } from "../providers/Provider";
import { APP_DESCRIPTION, APP_IMG, APP_NAME, APP_PRICE, DURATION_PER_TOKEN, UNIT } from "../utils/Utils";

type Props = {};

type AlertType = {
    type: "error" | "info" | "success" | "warning" | "none";
    message: string;
    title?: string;
};

type CreateAppLicenseFormField = {
    appName: string;
    appImageUrl: string;
    description: string;
    price: number;
    duration: number;
    unit: string | number;
    secret: string;
};

const required = false;
const FORM_INITIAL_VALUES: CreateAppLicenseFormField = {
    appName: APP_NAME,
    appImageUrl: APP_IMG,
    description: APP_DESCRIPTION,
    price: APP_PRICE,
    duration: DURATION_PER_TOKEN,
    unit: UNIT + "",
    secret: "HEllo world",
};

interface RootContractState {
    address: string;
    isOwner: boolean;
    apps: IApp[];
    balance: number;
}

const HomePage = ({}: Props) => {
    const { setState, rootContract, web3, currentAccount } = useAppContext() ?? {};
    const [alertType, setAlertType] = useState<AlertType>({ type: "none" } as AlertType);

    const [showCreateAppDialog, setShowCreateAppDialog] = useState(true);
    const [onLoadingCreateNewApp, setOnLoadingCreateNewApp] = useState({} as { withdraw: boolean; createNewApp: boolean });
    const [unitTypeSet, setUnitTypeSet] = useState(UNIT + "");
    const [rootState, setRootState] = useState<RootContractState>({
        apps: [],
        isOwner: false,
        address: "",
        balance: 0,
    } as RootContractState);

    React.useEffect(() => {
        if (rootContract === null || rootContract === undefined || Object.keys(rootContract!!).length === 0 || !currentAccount) {
            return;
        }

        rootContract
            .getApps()
            .then((apps) => setRootState((prev) => ({ ...prev, apps: [...apps] })))
            .catch((e) => {
                console.log(e);
                setAlertType({
                    type: "error",
                    message: "Error when load apps",
                    title: "",
                });
            });

        rootContract
            .isOwner()
            .then((r) => {
                setRootState((prev) => ({ ...prev, isOwner: r }));
            })
            .catch(() => {
                setRootState({ ...rootState, isOwner: false });
            });
        setRootState((prev) => ({ ...prev, address: rootContract.address, balance: rootContract.balance }));

        rootContract
            .listen()
            .on(RootContractEvents.OnAddedNewApp, async ({ appAddress }) => {
                console.log("OnAddedNewApp", appAddress);
                const app = new App(web3!, appAddress, currentAccount);
                await app.fetchData();
                setRootState((prev) => ({ ...prev, apps: [...prev.apps, app] }));
            })
            .on(RootContractEvents.OnBalanceChanged, ({ contractAddress, amount }) => {
                console.log(`OnBalanceChanged: ${contractAddress} ${amount}`);
                if (contractAddress === rootContract.address) {
                    setRootState((prev) => ({ ...prev, balance: amount }));
                }
            });
        return () => {
            rootContract.removeListener();
        };
    }, [rootContract]);

    if (!setState || !rootContract) {
        return <Skeleton />;
    }

    const ownerElements = [
        <div className="flex justify-between">
            <strong>Balance: </strong>
            <span>{rootState.balance}</span>
        </div>,
        <div className="flex justify-between">
            <strong>Application contract counts: </strong>
            <span>{rootState.apps.length}</span>
        </div>,
        <div className="flex justify-between">
            <strong>Registration app fee: </strong>
            <span>{rootContract.licenseRegistrationFee}</span>
        </div>,
    ];

    const widthDraw = async () => {
        if (!rootState.isOwner) {
            setAlertType({ type: "error", message: "You are not owner of this contract", title: "Error occur" });
            return;
        }
        setOnLoadingCreateNewApp({ ...onLoadingCreateNewApp, withdraw: true });
        try {
            await rootContract.withdraw();
        } catch (e: any) {
            setAlertType({ type: "error", message: e.message, title: "Error occur" });
        } finally {
            setOnLoadingCreateNewApp({ ...onLoadingCreateNewApp, withdraw: false });
        }
    };

    const ownerActions = [
        <Button danger className="bg-red-200" onClick={() => widthDraw()}>
            Withdraw
        </Button>,
    ];

    const normalActions = [
        <Button type="primary" ghost onClick={() => setShowCreateAppDialog(true)}>
            Create New App
        </Button>,
    ];

    const onSubmitCreateAppLicense = async (values: CreateAppLicenseFormField) => {
        console.log(values);

        values.unit = +values.unit;
        setOnLoadingCreateNewApp({ ...onLoadingCreateNewApp, createNewApp: true });

        try {
            await rootContract.createNewLicenseToken(
                values.appName,
                values.appImageUrl,
                values.description,
                values.price,
                values.duration,
                values.unit as Unit,
                values.secret
            );
            setAlertType({
                type: "success",
                message: "Create new app success contact the owner of Root Contract to activate your app",
                title: "",
            });
        } catch (e: any) {
            setAlertType({ type: "error", message: e.message, title: "An error occurred" });
        } finally {
            setOnLoadingCreateNewApp({ ...onLoadingCreateNewApp, createNewApp: false });
            setTimeout(() => {
                setAlertType({ type: "none", message: "", title: "" });
            }, 5000);
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log("Failed:", errorInfo);
    };

    const createAppDialog = (
        <>
            <Card
                size="default"
                title={"Create new app"}
                extra={
                    <Button onClick={() => setShowCreateAppDialog(false)}>
                        <FontAwesomeIcon icon={faWindowClose} />
                    </Button>
                }
            >
                <Form
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={FORM_INITIAL_VALUES}
                    onFinish={onSubmitCreateAppLicense}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        label="App Name"
                        name="appName"
                        rules={[{ required, message: "Please input your your app name!" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="App Image Url"
                        name="appImageUrl"
                        rules={[
                            {
                                required,
                                message: "Please input your app image url!",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[
                            {
                                required,
                                message: "Please input your app description",
                            },
                        ]}
                    >
                        <Input placeholder={"Functionality of your app and your contact number or your company"} />
                    </Form.Item>
                    <Form.Item
                        label="Price"
                        name="price"
                        rules={[
                            {
                                required,
                                message: "Please input license price",
                                type: "number",
                            },
                        ]}
                    >
                        <InputNumber placeholder="License fee per one token" addonAfter="wei" />
                    </Form.Item>
                    {unitTypeSet !== Unit.FOREVER + "" && (
                        <Form.Item
                            label="Duration"
                            name="duration"
                            rules={[
                                {
                                    required,
                                    message: "Please input your duration per token",
                                    type: "number",
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="Duration on token will last"
                                addonAfter={Unit[+unitTypeSet].toLowerCase()}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Unit"
                        name="unit"
                        rules={[
                            {
                                required,
                                message: "Please select unit type of duration per token",
                            },
                        ]}
                    >
                        <Select
                            style={{ width: 120 }}
                            onChange={(value: string) => setUnitTypeSet(value)}
                            defaultValue={unitTypeSet}
                            placeholder="Unit of license"
                        >
                            <Select.Option value="0" key="0">
                                Second
                            </Select.Option>
                            <Select.Option value="1" key="1">
                                Day
                            </Select.Option>
                            <Select.Option value="2" key="2">
                                Month
                            </Select.Option>
                            <Select.Option value="3" key="3">
                                Year
                            </Select.Option>
                            <Select.Option value="4" key="4">
                                Forever
                            </Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="App Secret"
                        name="secret"
                        rules={[{ required: true, message: "App secret must be supply" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit" ghost loading={onLoadingCreateNewApp.createNewApp}>
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
            <div className="h-5"></div>
        </>
    );

    return (
        <>
            <div className="flex flex-wrap gap-2 font-bold w-full mx-auto flex justify-center flex-col items-center">
                <div className="w-1/2">
                    {alertType.type !== "none" && <Alert message={alertType.message} type={alertType.type} className="mb-3" />}
                    {showCreateAppDialog && createAppDialog}
                    <Card size="default" title={"Contract address: " + rootState.address} extra={<a href="#">More</a>}>
                        {ownerElements}
                        <Divider />
                        <div className="flex justify-around">
                            {rootState.isOwner && ownerActions}
                            {normalActions}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default HomePage;
