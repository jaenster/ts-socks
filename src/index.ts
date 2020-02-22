import {EventEmitter} from "events";
import * as net from "net";
import {ServerClient} from "./ServerClient";


interface IUsers {
    username: string,
    password: string,
}

export type optionsType = { allowNoAuth: boolean, listen: number}
export type settingsType = { users: IUsers[], options: optionsType }
export type Proxy = { orgin: net.Socket, remote: net.Socket };

declare interface Server {
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "connection", listener: (socket: Proxy) => void): this;

    emit(event: string | symbol | number, ...args: any[]): boolean;
    emit(event: "connection", socket: Proxy): boolean;
}

class Server extends EventEmitter {
    public readonly settings: settingsType;
    constructor(settings: settingsType) {
        super();
        this.settings = settings;
        net.createServer(socket => new ServerClient(socket,this)).listen(settings.options.listen);
    }
}

// Just visually
export default Server;


// @ts-ignore Overrides the default method, as this is more useable for native javascript users
Server.default = Server;
module.exports = Server;