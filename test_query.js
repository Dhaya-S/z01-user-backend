const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`GET ${url} -> Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.log(`GET ${url} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  const url1 = "https://pub-2531ac33275d4afd8443b02c46c96ea3.r2.dev/1778743888144-OIP%20(6).jpg";
  const url2 = "https://pub-2531ac33275d4afd8443b02c46c96ea3.r2.dev/1778743888144-OIP%20%286%29.jpg";
  
  console.log("Checking URL 1 (only space encoded):");
  await checkUrl(url1);
  
  console.log("\nChecking URL 2 (fully encoded):");
  await checkUrl(url2);
}

main();
