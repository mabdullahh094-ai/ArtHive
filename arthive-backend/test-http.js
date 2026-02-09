const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
server.listen(3001, '127.0.0.1', () => {
  console.log('Simple HTTP server running on http://127.0.0.1:3001');
});
