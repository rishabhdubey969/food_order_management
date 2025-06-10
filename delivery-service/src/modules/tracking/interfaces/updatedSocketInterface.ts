import { Socket } from "socket.io";

export interface UpdatedSocket extends Socket{
    payload: any;
}