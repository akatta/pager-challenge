import http from 'http';
import * as readline from 'readline';
import { getNamesRelatedToSearch } from './swapi';
import { SWApiClient } from './modules/clients/swApiClient';
import { preProcessSwData } from './modules/seeder/seeder';
import NodeCache from 'node-cache';

const hostname = '127.0.0.1';
const port = 3000;
const queryCache = new NodeCache({ stdTTL: 3600 });
const nodeCache = new NodeCache({ stdTTL: 3600 });
const apiClient = new SWApiClient(queryCache, nodeCache);

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on;
rl.setPrompt('Input> ');
rl.prompt();

rl.on('line', async function (line) {
  if (line === 'prime') {
    preProcessSwData(apiClient);
  } else {
    const result = await getNamesRelatedToSearch(line.trim(), ['people'], apiClient);
    console.log(result.message);
    if (result.names?.length) {
      console.log();
      console.log('ASSOCIATED NAMES');
      console.log(result.names.join('\n'));
    }
  }
  rl.prompt();
}).on('close', function () {
  console.log('Have a great day!');
  process.exit(0);
});
