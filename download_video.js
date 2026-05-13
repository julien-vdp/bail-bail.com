const https = require('https');
const fs = require('fs');

const url = "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-building-exterior-4416-large.mp4";
const file = fs.createWriteStream("public/bg.mp4");

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, function(response) {
  console.log("Status:", response.statusCode);
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      console.log("Download complete.");
    });
  } else if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 307 || response.statusCode === 308) {
    console.log("Redirected to:", response.headers.location);
    https.get(response.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function(res2) {
       res2.pipe(file);
       res2.on('finish', () => { file.close(); console.log("Download complete from redirect."); });
    });
  } else {
    console.log("Failed: " + response.statusCode);
  }
}).on('error', function(err) {
  console.error("Error: " + err.message);
});
