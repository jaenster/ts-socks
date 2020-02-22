# Socks5
[![npm version](https://d25lcipzij17d.cloudfront.net/badge.svg?id=js&type=6&v=0.9.1&x2=0)](https://www.npmjs.com/package/ts-socks)

A simple socks5 server written in typescript.

No dependencies

# Javascript
```javascript
const Socks5 = require('ts-socks');

new Socks5({
	options: {
		listen: 12345,
		allowNoAuth: true,
	},
	users: [{username: 'test', password: 'test'}],
}).on('connection', (proxy) => {

	console.log(proxy.remote.remoteAddress + ':' + proxy.remote.remotePort);
	proxy.orgin.pipe(proxy.remote);
	proxy.remote.pipe(proxy.orgin);
});
```
# Typescript
```typescript
import Socks5 from 'ts-socks';

new Socks5({
    options: {
        listen: 12345,
        allowNoAuth: true,
    },
    users: [{username: 'test', password: 'test'}],
}).on('connection', (proxy) => {

    console.log(proxy.remote.remoteAddress + ':' + proxy.remote.remotePort);
    proxy.orgin.pipe(proxy.remote);
    proxy.remote.pipe(proxy.orgin);
});
```