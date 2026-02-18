# Charla MCP Centic

<div align="center">
  <img src="resources/sauron.png" alt="Sauron" width="300">
</div>

Servidor MCP (Model Context Protocol) en TypeScript para la charla de Centic. Permite a un modelo LLM controlar actuadores IoT por MQTT, gestionar una quiz app con base de datos PostgreSQL y enviar emails.

## Estructura del proyecto

```
src/
  server.ts          # McpServer + resources + prompts (importa tools)
  tools-mqtt.ts      # Tools MQTT (actuadores, alarmas, SEW)
  tools-db.ts        # Tools PostgreSQL (audiencia, preguntas, dudas, ranking)
  tools-mail.ts      # Tool envio de email (Resend)
  index.ts           # Entry point HTTP (Streamable HTTP, puerto 3000)
  index-stdio.ts     # Entry point stdio (para Claude Desktop)
resources/
  sauron.png         # Imagen de Sauron
  circuito.png       # Imagen del circuito
  r2.webp            # Imagen de R2
```

## Configuracion

Copia `.env.example` a `.env` y rellena los valores:

```sh
cp .env.example .env
```

Variables necesarias:

| Variable | Descripcion |
|---|---|
| `RESEND_API_KEY` | API key de Resend para envio de emails |
| `MQTT_URL` | URL del broker MQTT (ej: `mqtt://iiot.centic.dev:30800`) |
| `PGHOST` | Host de PostgreSQL |
| `PGPORT` | Puerto de PostgreSQL |
| `PGUSER` | Usuario de PostgreSQL |
| `PGPASSWORD` | Password de PostgreSQL |
| `PGDATABASE` | Base de datos PostgreSQL |

## Ejecucion

```sh
# Instalar dependencias
npm install

# Desarrollo (HTTP)
npm run dev

# Desarrollo (stdio)
npm run dev:stdio

# Produccion
npm run build
npm start            # HTTP en http://localhost:3000/mcp
npm run start:stdio  # stdio
```

## Docker

```sh
docker build -t charlamcp-centic -f Dockerfile .
docker run --rm -p 3000:3000 --env-file .env charlamcp-centic
```

## Testing con MCP Inspector

```sh
npx @modelcontextprotocol/inspector
# Apuntar a http://localhost:3000/mcp (Streamable HTTP)
```

## Configuracion Claude Desktop (stdio)

```json
{
  "mcpServers": {
    "charla-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/ruta/al/proyecto/dist/index-stdio.js"]
    }
  }
}
```

## Configuracion VS Code (HTTP)

```json
{
  "servers": {
    "charla-mcp": {
      "type": "streamable-http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Tools

### MQTT - Actuadores

| Tool | Params | Descripcion |
|---|---|---|
| `sew-switch` | sensorId, on | Codifica un mensaje SEW SWITCH (on/off) para un sensor |
| `alarma` | color (roja/azul) | Enciende alarma roja o azul 4 segundos via SEW encoding |
| `controlar-actuador` | dispositivo, encender | Enciende/apaga un actuador por MQTT (on/off) |
| `todos-actuadores` | encender | Enciende/apaga todos los actuadores a la vez |

Actuadores disponibles: bombilla, interruptor, pulsador, pulsador2, conmutador, potenciometro, contactor, rojo, azul.

### Base de datos - Quiz App

| Tool | Params | Descripcion |
|---|---|---|
| `consultar-audiencia` | - | Listado de asistentes, total y tiempo desde ultimo registro |
| `crear-pregunta` | pregunta, opcion_a, opcion_b | Crea pregunta/encuesta sin respuesta correcta |
| `resolver-pregunta` | pregunta_id, respuesta_correcta | Establece la respuesta correcta (A/B) |
| `consultar-preguntas` | - | Lista preguntas con stats (aciertos, fallos, votos). La 1a = activa |
| `consultar-respuestas` | pregunta_id (opcional) | Respuestas con nickname/correo e indica si acerto |
| `ranking-audiencia` | - | Ranking de usuarios por aciertos |
| `listar-dudas` | pendientes (opcional) | Dudas con datos del usuario, filtra por pendientes/respondidas |
| `responder-duda` | duda_id, respuesta | Responde a una duda de un asistente |
| `historico-circuito` | elemento_id (opcional) | Historico de encendido/apagado de actuadores |

### Email

| Tool | Params | Descripcion |
|---|---|---|
| `enviar-email` | to, subject, html | Envia email a uno o varios destinatarios via Resend |

## Resources

| Resource | URI | Descripcion |
|---|---|---|
| `greeting` | `greeting://{name}` | Saludo dinamico con nombre |
| `sauron` | `image://sauron` | Imagen de Sauron (PNG) |
| `circuito` | `image://circuito` | Imagen del circuito (PNG) |
| `r2` | `image://r2` | Imagen de R2 (WebP) |

## Prompts

| Prompt | Params | Descripcion |
|---|---|---|
| `personalidad` | nombre | Configura al modelo con tono coloquial y cachondo |
