import { encode } from '@sensoreverywhere/sew-parser';
import mqtt from 'mqtt';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const MQTT_URL = process.env.MQTT_URL!;

const ALARMA_SENSORES: Record<string, string> = {
  roja: 'F4:CF:A2:E3:C6:93:00:01',
  azul: 'F4:CF:A2:E3:C6:93:00:02'
};

const DISPOSITIVOS = [
  'bombilla', 'interruptor', 'pulsador', 'pulsador2',
  'conmutador', 'potenciometro', 'contactor', 'rojo', 'azul'
] as const;

export function register(server: McpServer) {

  server.tool(
    'sew-switch',
    'encode a SEW SWITCH message (on/off) for a sensor',
    { sensorId: z.string(), on: z.boolean() },
    async ({ sensorId, on }) => {
      const buffer = encode({
        sensorId,
        type: 'SWITCH',
        payload: on ? 1 : 0
      });

      console.log(`SWITCH ${on ? 'ON' : 'OFF'} para sensor ${sensorId}:`, buffer);

      return {
        content: [
          {
            type: 'text',
            text: `SWITCH ${on ? 'ON' : 'OFF'} encoded: [${Buffer.from(buffer).toString('hex').match(/.{2}/g)?.join(' ')}]`
          }
        ]
      };
    }
  );

  server.tool(
    'alarma',
    'Enciende la alarma roja o azul durante 4 segundos y luego la apaga',
    { color: z.enum(['roja', 'azul']).describe('Color de la alarma a activar') },
    async ({ color }) => {
      const sensorId = ALARMA_SENSORES[color];
      const topic = 'formacion/F4:CF:A2:E3:C6:93/action';
      const client = mqtt.connect(MQTT_URL);

      return new Promise((resolve, reject) => {
        client.on('connect', () => {
          const bufferOn = encode({ sensorId, type: 'SWITCH', payload: 1 });
          client.publish(topic, Buffer.from(bufferOn), () => {
            console.log(`Alarma ${color} ON`);

            setTimeout(() => {
              const bufferOff = encode({ sensorId, type: 'SWITCH', payload: 0 });
              client.publish(topic, Buffer.from(bufferOff), () => {
                console.log(`Alarma ${color} OFF`);
                client.end();
                resolve({
                  content: [
                    {
                      type: 'text' as const,
                      text: `Alarma ${color} encendida durante 4 segundos y apagada.`
                    }
                  ]
                });
              });
            }, 4000);
          });
        });

        client.on('error', (err) => {
          client.end();
          reject(err);
        });
      });
    }
  );

  server.tool(
    'controlar-actuador',
    'Enciende o apaga un actuador (bombilla, interruptor, pulsador, pulsador2, conmutador, potenciometro, contactor, rojo, azul) publicando en su topic MQTT',
    {
      dispositivo: z.enum(DISPOSITIVOS).describe('Nombre del actuador a controlar'),
      encender: z.boolean().describe('true para encender (on), false para apagar (off)')
    },
    async ({ dispositivo, encender }) => {
      const topic = `formacion/${dispositivo}`;
      const mensaje = encender ? 'on' : 'off';
      const client = mqtt.connect(MQTT_URL);

      return new Promise((resolve, reject) => {
        client.on('connect', () => {
          client.publish(topic, mensaje, () => {
            console.log(`${dispositivo} ${mensaje.toUpperCase()}`);
            client.end();
            resolve({
              content: [
                {
                  type: 'text' as const,
                  text: `${dispositivo} ${encender ? 'encendido' : 'apagado'} correctamente.`
                }
              ]
            });
          });
        });

        client.on('error', (err) => {
          client.end();
          reject(err);
        });
      });
    }
  );

  server.tool(
    'todos-actuadores',
    'Enciende o apaga todos los actuadores (bombilla, interruptor, pulsador, pulsador2, conmutador, potenciometro, contactor, rojo, azul) a la vez',
    { encender: z.boolean().describe('true para encender todos, false para apagar todos') },
    async ({ encender }) => {
      const mensaje = encender ? 'on' : 'off';
      const client = mqtt.connect(MQTT_URL);

      return new Promise((resolve, reject) => {
        client.on('connect', () => {
          let pending = DISPOSITIVOS.length;
          for (const dispositivo of DISPOSITIVOS) {
            client.publish(`formacion/${dispositivo}`, mensaje, () => {
              console.log(`${dispositivo} ${mensaje.toUpperCase()}`);
              pending--;
              if (pending === 0) {
                client.end();
                resolve({
                  content: [
                    {
                      type: 'text' as const,
                      text: `Todos los actuadores ${encender ? 'encendidos' : 'apagados'} correctamente.`
                    }
                  ]
                });
              }
            });
          }
        });

        client.on('error', (err) => {
          client.end();
          reject(err);
        });
      });
    }
  );
}
