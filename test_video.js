const https = require('https');
https.get('https://vimeo.com/api/oembed.json?url=https://vimeo.com/76979871', (res) => {
  let body = '';
  res.on('data', d => body+=d);
  res.on('end', () => { console.log(body); process.exit(0); });
});
