import React, {useEffect} from 'react';
import {Modal} from "antd";

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationContextProps = {
    show: (message: string | React.ReactNode, type: NotificationType, timeout?: number) => void;
    hide: () => void;
    setNewTimeOut: (timeOut: number) => void;
    setOkHandle: (handle: () => void) => void;
    setIsLoading: (isLoading: boolean) => void;
}
const NotificationContext = React.createContext<NotificationContextProps>({} as any);
export const useNotificationContext = () => React.useContext(NotificationContext);

type Props = {
    children: React.ReactNode;
}

const NotificationProvider = ({children}: Props) => {

        const [isShow, setIsShow] = React.useState(false);
        const [type, setType] = React.useState<NotificationType>('success');
        const [timeout, setNewTimeOut] = React.useState<number>(5000);
        const [message, setMessage] = React.useState<string | React.ReactNode>('');
        const [okHandle, setOkHandle] = React.useState<() => void | undefined>();
        const [isLoading, setIsLoading] = React.useState<boolean>(false);

        useEffect(() => {
                if (timeout === -1) return
                let timeOut: any;
                if (isShow) {
                    setTimeout(() => {
                        hide()
                    }, timeout)
                }
                return () => {
                    if (timeOut) clearTimeout(timeOut)
                }
            }, [isShow]
        )

        const show = (message: string | React.ReactNode, type: NotificationType, timeout?: number) => {
            if (isShow) {
                hide()
            }
            setIsShow(true);
            setType(type);
            setMessage(message);
            if (timeout) {
                setNewTimeOut(timeout)
            }
        }

        const hide = () => {
            setIsShow(false);
            setOkHandle(undefined);
            if (timeout !== -1) setNewTimeOut(5000);
        }


        const getStyle = (type: NotificationType) => {
            switch (type) {
                case 'success':
                    return {
                        color: '#52c41a',

                    }
                case 'error':
                    return {
                        color: '#f5222d',
                    }
                case 'warning':
                    return {
                        color: '#faad14',
                    }
                case 'info':
                    return {
                        color: '#1890ff',
                    }
            }
        }

        return (
            <NotificationContext.Provider

                value={{
                    show, hide, setNewTimeOut, setOkHandle, setIsLoading
                }}>
                {children}
                {
                    isShow &&
                    <Modal style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                           title={<div style={getStyle(type)}>{type.slice(0, 1).toUpperCase() + type.slice(1)}</div>}
                           okButtonProps={{type: 'ghost'}}
                           okText={'Hide'}
                           confirmLoading={isLoading}
                           visible={isShow} onOk={hide} onCancel={hide}>
                        <div style={getStyle(type)}>
                            {message}
                        </div>
                    </Modal>
                }
            </NotificationContext.Provider>
        );
    }
;

export default NotificationProvider;
