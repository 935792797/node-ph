const URL = require('url');
const HTTP = require('http');
const HTTPS = require('https');

const getPornhubPage = exports.getPornhubPage = async (ref, cookie = 'lang=en') => {
	const p = await getWebpage(ref, { headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36', 'Cookie': cookie} });

	if(!p.body.toString().includes('<body onload="go()">\nLoading ...\n</body>')) return p.body.toString();

	const document = {location: {reload: () => {}}};
	const leastFactor = (n) => {
		if (n==0) return 0;
		if (n%1 || n*n<2) return 1;
		if (n%2==0) return 2;
		if (n%3==0) return 3;
		if (n%5==0) return 5;
		const m=Math.sqrt(n);
		for (var i=7;i<=m;i+=30) {
			if (n%i==0)      return i;
			if (n%(i+4)==0)  return i+4;
			if (n%(i+6)==0)  return i+6;
			if (n%(i+10)==0) return i+10;
			if (n%(i+12)==0) return i+12;
			if (n%(i+16)==0) return i+16;
			if (n%(i+22)==0) return i+22;
			if (n%(i+24)==0) return i+24;
		}
		return n;
	}
	const script = between(p.body.toString(), 'return n;', '\n//--></script>').substr(3);
	if(script) eval(`(${script})()`);
	if(script) throw new Error(script);
	if(!document.cookie) {
		const dir = `${require('os').tmpdir()}\\${Date.now()}-failed.html`;
		require('fs').writeFileSync(dir, p.body);
		throw new Error(`failed to parse page, backup saved @ "${dir}"`);
	}
	return getPornhubPage(ref, document.cookie);
}

const REDIRECT_CODES = [301, 302];
const getWebpage = exports.getWebpage = (ref, paramOverwrites = {}, maxRedirects = 3, maxRetrys = 3) => new Promise((resolve, reject) => {
	if(typeof ref !== 'object') ref = URL.parse(ref);
	const reqParams = Object.assign({}, ref, paramOverwrites);
	const lib = reqParams.protocol !== 'http:' ? HTTPS : HTTP;

	const body = [];
	const req = lib.get(reqParams, resp => {
    console.log([resp.statusCode, resp.headers['location']]);
		if(REDIRECT_CODES.includes(resp.statusCode)) {
			clearTimeout(timeout);
			if(maxRedirects <= 0) return reject(new Error('too many redirects'));
			return getWebpage(
				resp.headers['location'],
				paramOverwrites,
				maxRedirects - 1,
				maxRetrys
			).then(resolve).catch(reject);
		}
		else if (resp.statusCode !== 200) {
			clearTimeout(timeout);
			return reject(new Error(`Unexpected Status Code: ${resp.statusCode}`));
		}
		resp.on('data', chunk => {
			body.push(chunk);
		});
		resp.on('end', () => {
			clearTimeout(timeout);
			return resolve({body: Buffer.concat(body), resp: resp});
		});
	});
	req.on('error', e => {
		clearTimeout(timeout);
		if(maxRedirects <= 0) return reject(e);

		return getWebpage(
			ref,
			paramOverwrites,
			maxRedirects,
			maxRetrys - 1
		).then(resolve).catch(reject);
	});
	const timeout = setTimeout(() => {
		if(maxRetrys <= 0) return reject(new Error('http get request timed out'));
		return getWebpage(
			ref,
			paramOverwrites,
			maxRedirects,
			maxRetrys - 1
		).then(resolve).catch(reject);
	}, 30 * 1000);
});

exports.between = function(haystack, left, right) {
	var pos;
	pos = haystack.indexOf(left);
	if (pos === -1) { return ''; }
	haystack = haystack.slice(pos + left.length);
	pos = haystack.indexOf(right);
	if (pos === -1) { return ''; }
	haystack = haystack.slice(0, pos);
	return haystack;
};
