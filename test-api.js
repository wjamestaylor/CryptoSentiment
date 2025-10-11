const http = require('http');

const postData = JSON.stringify({
  cryptocurrency: 'bitcoin'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sentiment/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\n=== API Response ===');
      console.log('Timestamp:', jsonData.timestamp);
      console.log('Sentiment Score:', jsonData.score);
      console.log('Alerts Checked:', jsonData.alertsChecked);
      console.log('Sentiment:', jsonData.sentiment);
      console.log('Confidence:', jsonData.confidence);
      console.log('\n=== Full Response ===');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();