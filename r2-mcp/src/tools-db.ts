import { Pool } from 'pg';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

export function register(server: McpServer) {

  // ~~~~~~ Audiencia

  server.tool(
    'consultar-audiencia',
    'Consulta los asistentes registrados en la charla: total, listado con nickname/correo/fecha, y cuánto tiempo desde el último registro',
    {},
    async () => {
      const result = await pool.query(`
        SELECT id, nickname, correo, created_at,
               COUNT(*) OVER() as total_asistentes,
               NOW() - MAX(created_at) OVER() as tiempo_desde_ultimo
        FROM audiencia
        ORDER BY created_at DESC
      `);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );

  // ~~~~~~ Preguntas

  server.tool(
    'crear-pregunta',
    'Crea una nueva pregunta o encuesta para la audiencia con dos opciones (A y B). No incluye respuesta correcta, usa resolver-pregunta para eso',
    {
      pregunta: z.string().describe('Texto de la pregunta'),
      opcion_a: z.string().describe('Texto de la opción A'),
      opcion_b: z.string().describe('Texto de la opción B')
    },
    async ({ pregunta, opcion_a, opcion_b }) => {
      const result = await pool.query(
        'INSERT INTO preguntas (pregunta, opcion_a, opcion_b) VALUES ($1, $2, $3) RETURNING *',
        [pregunta, opcion_a, opcion_b]
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows[0], null, 2) }]
      };
    }
  );

  server.tool(
    'resolver-pregunta',
    'Establece la respuesta correcta de una pregunta existente. Úsalo para convertir una pregunta/encuesta en un quiz con respuesta correcta',
    {
      pregunta_id: z.number().describe('ID de la pregunta'),
      respuesta_correcta: z.enum(['A', 'B']).describe('La respuesta correcta: A o B')
    },
    async ({ pregunta_id, respuesta_correcta }) => {
      const result = await pool.query(
        'UPDATE preguntas SET respuesta_correcta = $2 WHERE id = $1 RETURNING *',
        [pregunta_id, respuesta_correcta]
      );
      if (result.rows.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No se encontró la pregunta con ese ID.' }] };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows[0], null, 2) }]
      };
    }
  );

  server.tool(
    'consultar-preguntas',
    'Lista todas las preguntas con estadísticas de respuestas (aciertos, fallos, votos por opción). La primera pregunta del listado es la pregunta activa (más reciente)',
    {},
    async () => {
      const result = await pool.query(`
        SELECT p.id, p.pregunta, p.opcion_a, p.opcion_b, p.respuesta_correcta, p.timestamp,
               COUNT(r.id)::int as total_respuestas,
               COUNT(CASE WHEN r.opcion = p.respuesta_correcta THEN 1 END)::int as aciertos,
               COUNT(CASE WHEN r.opcion != p.respuesta_correcta THEN 1 END)::int as fallos,
               COUNT(CASE WHEN r.opcion = 'A' THEN 1 END)::int as votos_a,
               COUNT(CASE WHEN r.opcion = 'B' THEN 1 END)::int as votos_b
        FROM preguntas p
        LEFT JOIN respuestas r ON r.pregunta_id = p.id
        GROUP BY p.id
        ORDER BY p.timestamp DESC
      `);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );

  // ~~~~~~ Respuestas

  server.tool(
    'consultar-respuestas',
    'Lista las respuestas de la audiencia con datos del usuario (nickname, correo), la pregunta completa, e indica si acertó. Opcionalmente filtra por pregunta_id',
    {
      pregunta_id: z.number().optional().describe('ID de la pregunta para filtrar (opcional, sin él devuelve todas)')
    },
    async ({ pregunta_id }) => {
      const where = pregunta_id !== undefined ? 'WHERE r.pregunta_id = $1' : '';
      const params = pregunta_id !== undefined ? [pregunta_id] : [];

      const result = await pool.query(`
        SELECT r.id, r.opcion,
               a.nickname, a.correo,
               p.id as pregunta_id, p.pregunta, p.opcion_a, p.opcion_b, p.respuesta_correcta,
               (r.opcion = p.respuesta_correcta) as acertada
        FROM respuestas r
        JOIN audiencia a ON a.id = r.audiencia_id
        JOIN preguntas p ON p.id = r.pregunta_id
        ${where}
        ORDER BY p.timestamp DESC, a.nickname
      `, params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );

  server.tool(
    'ranking-audiencia',
    'Ranking de usuarios ordenado por número de aciertos (con nickname, correo, aciertos, fallos y total de respuestas)',
    {},
    async () => {
      const result = await pool.query(`
        SELECT a.nickname, a.correo,
               COUNT(r.id)::int as total_respuestas,
               COUNT(CASE WHEN r.opcion = p.respuesta_correcta THEN 1 END)::int as aciertos,
               COUNT(CASE WHEN r.opcion != p.respuesta_correcta THEN 1 END)::int as fallos
        FROM audiencia a
        LEFT JOIN respuestas r ON r.audiencia_id = a.id
        LEFT JOIN preguntas p ON p.id = r.pregunta_id
        GROUP BY a.id, a.nickname, a.correo
        ORDER BY aciertos DESC, fallos ASC
      `);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );

  // ~~~~~~ Dudas

  server.tool(
    'listar-dudas',
    'Lista las dudas de la audiencia con datos del usuario (nickname, correo). Puede filtrar por pendientes (sin respuesta) o respondidas',
    {
      pendientes: z.boolean().optional().describe('true = solo sin responder, false = solo respondidas, omitir = todas')
    },
    async ({ pendientes }) => {
      let where = '';
      if (pendientes === true) where = 'WHERE d.respuesta IS NULL';
      else if (pendientes === false) where = 'WHERE d.respuesta IS NOT NULL';

      const result = await pool.query(`
        SELECT d.id, d.duda, d.respuesta, d.timestamp, d.respondido_at,
               a.nickname, a.correo
        FROM dudas d
        JOIN audiencia a ON a.id = d.audiencia_id
        ${where}
        ORDER BY d.timestamp DESC
      `);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );

  server.tool(
    'responder-duda',
    'Responde a una duda de un asistente actualizando el registro con la respuesta',
    {
      duda_id: z.number().describe('ID de la duda a responder'),
      respuesta: z.string().describe('Texto de la respuesta a la duda')
    },
    async ({ duda_id, respuesta }) => {
      await pool.query(
        'UPDATE dudas SET respuesta = $2, respondido_at = NOW() WHERE id = $1',
        [duda_id, respuesta]
      );
      const result = await pool.query(`
        SELECT d.id, d.duda, d.respuesta, d.timestamp, d.respondido_at,
               a.nickname, a.correo
        FROM dudas d
        JOIN audiencia a ON a.id = d.audiencia_id
        WHERE d.id = $1
      `, [duda_id]);

      if (result.rows.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No se encontró la duda con ese ID.' }] };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows[0], null, 2) }]
      };
    }
  );

  // ~~~~~~ Histórico circuito

  server.tool(
    'historico-circuito',
    'Consulta el histórico de encendido/apagado de los elementos del circuito. Opcionalmente filtra por elemento',
    {
      elemento_id: z.string().optional().describe('ID del elemento para filtrar (opcional, sin él devuelve todos)')
    },
    async ({ elemento_id }) => {
      const where = elemento_id !== undefined ? 'WHERE elemento_id = $1' : '';
      const params = elemento_id !== undefined ? [elemento_id] : [];

      const result = await pool.query(`
        SELECT * FROM elementos_circuito_historico
        ${where}
        ORDER BY timestamp DESC
      `, params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
      };
    }
  );
}
