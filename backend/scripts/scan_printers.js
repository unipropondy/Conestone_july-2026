const net = require("net");

function checkIp(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(200);

    socket.connect(9100, ip, () => {
      socket.destroy();
      resolve(ip);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(null);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

async function run() {
  const base = "192.168.0.";
  console.log(`Scanning subnet ${base}1 to ${base}254 on port 9100...`);
  
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    promises.push(checkIp(base + i));
  }

  const results = await Promise.all(promises);
  const activePrinters = results.filter(ip => ip !== null);

  console.log("\n=== Scan Results ===");
  if (activePrinters.length === 0) {
    console.log("No printers found on port 9100 in the 192.168.0.x subnet.");
  } else {
    console.log("Found active printers at IPs:", activePrinters);
  }
}

run();
