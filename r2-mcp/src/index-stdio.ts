import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import server from './server';

// ~~~~~~ Transporte stdio

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
