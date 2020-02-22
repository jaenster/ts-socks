export enum AuthType {
    NoAuth = 0x00,
    GSSAPI,
    Auth,
}

export enum Statuses {
    RequestGranted,
    GeneralFailure,
    ConnectionNotAllowedByRuleset,
    NetworkUnreachable,
    HostUnreachable,
    ConnectionRefusedByDestinationHost,
    TTLExpired,
    CommandNotSupported,
    AddressTypeNotSupported,
}

export enum Auth {
    success,
    failure,
}

export enum Commands {
    TCP = 1,
    TCPListen,
    UDP,
}

export enum HostType {
    IPv4 = 0x01,
    Domain = 0x03,
    IPv6,
}