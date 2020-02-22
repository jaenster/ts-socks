/**
 * @description The class that gets init once a new socket comes
 * @author Jaenster
 */
import * as net from "net";
import {Auth, AuthType, Commands, HostType, Statuses} from "./Enums";
import Server from ".";


const preferredAuthMethods = [AuthType.Auth, AuthType.NoAuth];

export class ServerClient {
    private socket: net.Socket;
    private server: Server;

    private static getString(buffer: Buffer, size: number, offset: number = 0, encoding: string = 'utf8') {
        const tmpbuff = Buffer.alloc(size);
        for (let i = 0; i < size; i++) tmpbuff.writeUInt8(buffer.readUInt8(i + offset), i);

        return tmpbuff.toString(encoding);
    };

    constructor(socket, server: Server) {
        this.socket = socket;
        this.server = server;
        socket.once('data', (data: Buffer) => this.handshakeInit(data));
        socket.on('error', e => e);
        ServerClient.instances.push(this);
    }

    private connect(ipAddr: string, port: number, connectBuffer: Buffer) {
        const remote = net.connect(port, ipAddr, () => {
            connectBuffer.writeUInt8(0x00, 1); // Success code
            this.socket.write(connectBuffer);
            this.destroy(false); // Dont close socket ;)

            this.server.emit('connection', {orgin: this.socket, remote});
        }).on('error', err => {
            connectBuffer.writeUInt8(!!err as unknown as number | 0, 1); // Success code
            this.socket.write(connectBuffer);
            this.destroy();

            // Remove this client from our instance list
            ServerClient.instances.splice(ServerClient.instances.indexOf(this), 1);
        });
    }

    private handshakeInit(data: Buffer) {
        let offset = 0;
        const version = data.readUInt8(0);
        //unsupported version
        if (version !== 5) return this.destroy(); // simply close the socket

        const typesSupported = data.readUInt8(1);

        // build supported types
        let auths = [];
        for (let i = 0; i < typesSupported; i++) auths.push(data.readUInt8(i + 2));

        // Filter out those we dont support.
        auths = auths.filter(type => type === AuthType.Auth || (type === AuthType.NoAuth && this.server.settings.options.allowNoAuth));

        // unsupported auth
        if (!auths.length) return this.destroy();

        // The lowest of preferredAuthMethod's come first
        auths.sort((a, b) => preferredAuthMethods.indexOf(a) - preferredAuthMethods.indexOf(b));

        // What we want to auth with, comes first
        const auth = auths[0];

        const buffer = Buffer.alloc(2);
        buffer.writeUInt8(0x05, offset++); // version
        buffer.writeUInt8(auth, offset++); // Auth type

        // Send response
        // Reset is zero'd out
        this.socket.write(buffer);

        // once handshake part 1 is done, wait for part 2.
        this.socket.once('data', (data: Buffer) => auth === AuthType.Auth ? this.handshakeAuth(data) : this.handshakeConnect(data));
    }

    private handshakeAuth(data: Buffer) { // Waiting for username/password
        let offset = 0;
        let status = Auth.success;
        const type = data.readUInt8(offset++);

        if (type === 0x01) {
            const usernameLength = data.readUInt8(offset++);
            offset += usernameLength;

            const passwordLength = data.readUInt8(offset++);
            const uname = ServerClient.getString(data, usernameLength, 2);
            const pass = ServerClient.getString(data, passwordLength, offset);

            if (!this.server.settings.users.some(({username, password}) => username === uname && password === pass)) {
                status = Auth.failure; // We failed to find any user with that username/password
            }
        } else {
            status = Auth.failure; // unsupported auth
        }
        const buffer = Buffer.alloc(2);
        buffer.writeUInt8(type, 0); // username/password response
        buffer.writeUInt8(status, 1);

        this.socket.write(buffer);
        if (status) return this.destroy();

        this.socket.once('data', (data: Buffer) => this.handshakeConnect(data));
    }

    private handshakeConnect(data: Buffer) {
        let offset = 0;
        const command = data.readUInt8(++offset);
        offset += 2; // reserved byte, who cares
        const hostType = data.readUInt8(offset++);

        let ipAddr;
        switch (hostType) {
            case HostType.IPv4:
                ipAddr = [offset++, offset++, offset++, offset++].map(offset => data.readUInt8(offset).toString()).join('.');
                break;
            case HostType.Domain:
                const sizeDomain = data.readUInt8(offset++);
                ipAddr = ServerClient.getString(data, sizeDomain, offset);
                offset += sizeDomain;
                break;
            case HostType.IPv6:
                ipAddr = [];
                for (let i = 0; i < 16; i++) ipAddr.push(offset++);
                ipAddr = ipAddr.map(offset => data.readUInt8(offset).toString(16).padStart(2, '0')).reduce((a, c, i) => a + ((i && (i + 1) % 2) ? ':' + c : c), '');
                break;
        }

        // Right now, dont support port binding / UDP
        if (command !== Commands.TCP) {
            data.writeUInt8(Statuses.CommandNotSupported, 1); // Success code. Response buffer is nearly the same, so reuse buffer
            this.socket.write(data); // Write error data
        }

        const port = data.readUInt16BE(offset);
        if (!port || !ipAddr) {
            data.writeUInt8(Statuses.HostUnreachable, 1);
            this.socket.write(data);

            return this.destroy();
        }


        this.connect(ipAddr, port, data);
    }

    public static readonly instances = [];

    private destroy(socketDestroy = true) {
        // Remove this client from our instance list
        const index = ServerClient.instances.indexOf(this);
        index > -1 && ServerClient.instances.splice(index, 1);

        socketDestroy && this.socket.destroy();
    }


}