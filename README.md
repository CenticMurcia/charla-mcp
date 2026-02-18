<p align="center">
  <img src="sauron.png" alt="Sauron - Un protocolo para gobernarlos a todos">
</p>

# MCP: Un protocolo para gobernarlos a todos

Este repositorio contiene material de apoyo para la charla "MCP: Un protocolo para gobernarlos a todos" presentada en mayo de 2025. El Model Context Protocol (MCP) es una especificación abierta que define cómo las aplicaciones pueden interactuar con modelos de lenguaje de manera estandarizada.

## Contenido del Repositorio

- **Material de la Presentación**

  - `MCP_ Un protocolo para gobernarlos a todos.pdf` - Presentación en formato PDF

- **Documentación MCP**

  - `mcp_manifest_documentation.pdf` - Documentación del manifiesto MCP
  - `mcp_manifest_example.json` - Ejemplo de archivo de manifiesto MCP

- **Ejemplos de Implementación**
  - `typescript-mcp-sample/` - Implementación de ejemplo en TypeScript
  - `rust-mcp-sample/` - Implementación de ejemplo en Rust
  - `r2-mcp/` - Servidor MCP completo para demo en vivo (IoT + Quiz + Email)

## Ejemplos de Código

### Ejemplo en TypeScript

El directorio `typescript-mcp-sample/` contiene una implementación de MCP en TypeScript. Incluye:

- Dockerfile para contenerización
- Configuración para integración con Claude
- Código fuente en TypeScript para la implementación del protocolo

Para ejecutar el ejemplo de TypeScript:

```bash
cd typescript-mcp-sample
npm install
npm start
```

### Ejemplo en Rust

El directorio `rust-mcp-sample/` contiene una implementación de MCP en Rust. Incluye:

- Código fuente en Rust para la implementación del protocolo
- Generador aleatorio como muestra de funcionalidad

Para ejecutar el ejemplo de Rust:

```bash
cd rust-mcp-sample
cargo run
```

### R2-MCP — Servidor MCP para Demo en Vivo

El directorio `r2-mcp/` contiene un servidor MCP completo pensado para usar como demo interactiva durante la charla. Permite que un LLM (como Claude) actúe como presentador en vivo, controlando dispositivos IoT, gestionando un quiz con la audiencia y enviando emails a los asistentes.

**Tecnologías:** TypeScript, MCP SDK, MQTT, PostgreSQL, Resend, Docker.

**Herramientas expuestas (14):**

| Categoría | Herramientas | Descripción |
|---|---|---|
| IoT / MQTT | `sew-switch`, `alarma`, `controlar-actuador`, `todos-actuadores` | Control de actuadores físicos (bombilla, interruptor, contactor, etc.) vía MQTT |
| Quiz / Audiencia | `consultar-audiencia`, `crear-pregunta`, `resolver-pregunta`, `consultar-preguntas`, `consultar-respuestas`, `ranking-audiencia` | Gestión de preguntas, encuestas, respuestas y ranking en tiempo real |
| Dudas | `listar-dudas`, `responder-duda` | Q&A con los asistentes |
| Histórico | `historico-circuito` | Registro de eventos on/off de los actuadores |
| Email | `enviar-email` | Envío de correos a asistentes vía Resend |

**Variables de entorno necesarias** (ver `.env.example`):
`RESEND_API_KEY`, `MQTT_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**Para ejecutar:**

```bash
cd r2-mcp
npm install
npm run dev          # Modo HTTP (puerto 3000)
npm run dev:stdio    # Modo stdio (para Claude Desktop)
```

**Con Docker:**

```bash
cd r2-mcp
docker build -t charlamcp-centic -f Dockerfile .
docker run --rm -p 3000:3000 --env-file .env charlamcp-centic
```

**Configuración para Claude Desktop (stdio):**

```json
{
  "mcpServers": {
    "charla-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/ruta/a/dist/index-stdio.js"]
    }
  }
}
```

**Configuración para VS Code (HTTP):**

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

## Más Información

El Model Context Protocol (MCP) es una iniciativa para estandarizar la forma en que las aplicaciones se comunican con modelos de lenguaje, permitiendo una mayor interoperabilidad y simplificando la integración de IA en diferentes entornos de desarrollo.
