import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = 'Centic <noreply@centic.dev>';

export function register(server: McpServer) {
  server.tool(
    'enviar-email',
    'Envía un email a uno o varios destinatarios usando Resend. Útil para notificar a asistentes de la charla',
    {
      to: z.array(z.string()).describe('Lista de emails destinatarios'),
      subject: z.string().describe('Asunto del email'),
      html: z.string().describe('Contenido del email en HTML')
    },
    async ({ to, subject, html }) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            { type: 'text' as const, text: `Error al enviar email: ${JSON.stringify(data)}` }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Email enviado correctamente a ${to.join(', ')}. ID: ${data.id}`
          }
        ]
      };
    }
  );
}
