const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.zivfzfv.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("❌ DNS lookup failed:", err.message);
  } else {
    console.log("✅ DNS SRV records:");
    console.log(addresses);
  }
});
