

# Socks5
A simple socks5 server written in typescript.

No dependencies

# Usage js  
```javascript
const Socks5 = require('socks5-ts');

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