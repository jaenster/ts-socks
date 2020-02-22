const Socks5 = require('../bin/index');

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