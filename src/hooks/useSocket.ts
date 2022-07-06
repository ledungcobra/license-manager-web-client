import React, {useEffect, useState} from "react";
import {io,Socket} from 'socket.io-client'
import sockclientjs from "sockjs-client";

const useSocketIO=(url:string) =>{
    const [socket, setSocket] = useState<Socket>();
    useEffect(() => {
        const socket = io(url);
        setSocket(socket);
        return () => {
            socket.close();
        }
    }, [url]);
    return socket;
}


const useSocketJSClient = (url: string) => {
    const [socket, setSocket] = React.useState<any>(null);
    useEffect(() => {
        const socket = sockclientjs(url);
        socket.onopen = () => {
            console.log("open");
        };
        socket.onmessage = (e: any) => {
            console.log("message", e);
        };
        socket.onclose = () => {
            console.log("close");
        };

        setSocket(socket);
        return () => {
            try {
                socket.send("close");
            } catch (e) {

            }
        };
    }, []);
    return socket;
};


export {
    useSocketIO,
    useSocketJSClient
}

