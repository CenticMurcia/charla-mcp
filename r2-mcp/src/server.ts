import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

import { register as registerMqttTools } from './tools-mqtt';
import { register as registerDbTools } from './tools-db';
import { register as registerMailTools } from './tools-mail';

const server = new McpServer({
  name: 'CharlaMCP2026',
  version: '1.0'
});

// Ejemplo recurso dinámico

server.resource(
  'greeting',
  new ResourceTemplate('greeting://{name}', { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`
      }
    ]
  })
);

// ~~~~~~ Recursos estáticos (imágenes)

server.resource(
  'sauron',
  'image://sauron',
  imageResource('resources/sauron.png', 'image/png', 'Imagen de Sauron')
);
server.resource(
  'circuito',
  'image://circuito',
  imageResource('resources/circuito.png', 'image/png', 'Imagen del circuito')
);
server.resource(
  'r2',
  'image://r2',
  imageResource('resources/r2.webp', 'image/webp', 'Imagen de R2')
);

server.prompt('personalidad', { nombre: z.string() }, ({ nombre }) => ({
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `A partir de este momento tu nombre es ${nombre} y responderas a todas las conversaciones en un tono coloquial, cachondo y pasota, me preguntaras mi nombre para dirigirte a mi de forma mas personal, y me responderas a todas las preguntas con ese tono, sin importar el tema de la conversacion, incluso si te pregunto por el tiempo por la capital de un pais, tu respuesta siempre tendra ese tono, y si no sabes algo lo inventaras pero siempre manteniendo ese tono. Responde siempre en un solo parrafo continuo, sin saltos de linea, todo seguido como si estuvieras hablando de corrido sin pausas raras, que si metes saltos de linea esten muy justificados para entender el texto.`
      }
    }
  ]
}));

// ~~~~~~ Tools

registerMqttTools(server);
registerDbTools(server);
registerMailTools(server);

// Utils

function imageResource(relativePath: string, mimeType: string, description: string) {
  return async (uri: URL): Promise<ReadResourceResult> => {
    const imagePath = path.resolve(__dirname, '..', relativePath);
    try {
      const imageData = await fs.promises.readFile(imagePath);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType,
            name: path.basename(imagePath),
            description,
            blob: imageData.toString('base64')
          } as any
        ]
      };
    } catch (error) {
      console.error(`Error al leer imagen ${imagePath}:`, error);
      return { contents: [] };
    }
  };
}

export default server;
