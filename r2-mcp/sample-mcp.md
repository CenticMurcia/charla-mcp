# Guía para Crear un Servidor MCP en TypeScript

Esta guía te ayudará a crear un servidor MCP (Model Context Protocol) utilizando el SDK oficial de TypeScript. El servidor implementará una funcionalidad simple: sumar dos números proporcionados por el usuario a través del chat de Claude.

## Índice

1. [Introducción a MCP](#introducción-a-mcp)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Implementación del Servidor MCP](#implementación-del-servidor-mcp)
5. [Depuración con MCP Inspector](#depuración-con-mcp-inspector)
6. [Integración con Visual Studio Code](#integración-con-visual-studio-code)
7. [Pruebas](#pruebas)

## Introducción a MCP

El Model Context Protocol (MCP) es un protocolo diseñado para facilitar la comunicación entre modelos de lenguaje (como Claude) y herramientas externas. Permite que los modelos de lenguaje interactúen con servicios externos para realizar tareas específicas, ampliando así sus capacidades.

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Visual Studio Code
- Conocimientos básicos de TypeScript

## Configuración del Proyecto

1. Crea un nuevo directorio para tu proyecto:

```bash
mkdir mcp-calculator
cd mcp-calculator
```

2. Inicializa un proyecto de Node.js:

```bash
npm init -y
```

3. Instala las dependencias necesarias:

```bash
npm install @anthropic-ai/sdk @anthropic-ai/mcp typescript ts-node @types/node
```

4. Configura TypeScript creando un archivo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

5. Crea la estructura de directorios:

```bash
mkdir -p src
```

## Implementación del Servidor MCP

1. Crea un archivo `src/index.ts` con el siguiente contenido:

```typescript
import { createServer } from '@anthropic-ai/mcp';

// Definir la función para sumar dos números
async function addNumbers(params: { a: number; b: number }): Promise<{ result: number }> {
  const { a, b } = params;
  return { result: a + b };
}

// Crear y configurar el servidor MCP
const server = createServer({
  tools: {
    calculator: {
      operations: {
        add: {
          description: 'Suma dos números',
          parameters: {
            type: 'object',
            properties: {
              a: {
                type: 'number',
                description: 'Primer número a sumar'
              },
              b: {
                type: 'number',
                description: 'Segundo número a sumar'
              }
            },
            required: ['a', 'b']
          },
          handler: addNumbers
        }
      }
    }
  }
});

// Iniciar el servidor en el puerto 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor MCP ejecutándose en http://localhost:${PORT}`);
  console.log('Para depurar, abre MCP Inspector y conéctate a esta URL');
});
```

2. Crea un archivo `package.json` con los scripts necesarios:

```json
{
  "name": "mcp-calculator",
  "version": "1.0.0",
  "description": "Servidor MCP para sumar dos números",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["mcp", "anthropic", "claude"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "@anthropic-ai/mcp": "latest",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.1",
    "@types/node": "^18.0.0"
  }
}
```

## Depuración con MCP Inspector

MCP Inspector es una herramienta que te permite depurar y probar tus servidores MCP.

1. Instala MCP Inspector:

```bash
npm install -g @anthropic-ai/mcp-inspector
```

2. Inicia MCP Inspector:

```bash
mcp-inspector
```

3. En la interfaz de MCP Inspector:
   - Conecta a tu servidor local: `http://localhost:3000`
   - Prueba la operación `calculator.add` con diferentes valores
   - Observa las solicitudes y respuestas en tiempo real
   - Utiliza las herramientas de depuración para identificar problemas

## Integración con Visual Studio Code

1. Abre tu proyecto en Visual Studio Code:

```bash
code .
```

2. Instala extensiones recomendadas:
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier

3. Configura el depurador de VS Code creando un archivo `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch MCP Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

4. Para depurar:
   - Establece puntos de interrupción en tu código
   - Presiona F5 para iniciar la depuración
   - Utiliza la consola de depuración para inspeccionar variables

## Pruebas

Para probar tu servidor MCP con Claude:

1. Asegúrate de que tu servidor esté en ejecución:

```bash
npm run dev
```

2. En la conversación con Claude, proporciona la URL de tu servidor MCP cuando se te solicite.

3. Prueba la funcionalidad con prompts como:
   - "Suma 5 y 3 usando la calculadora"
   - "¿Cuál es el resultado de sumar 10.5 y 20.25?"

Claude utilizará tu servidor MCP para realizar los cálculos y mostrará los resultados.

## Ejemplo de Uso

Cuando un usuario le pide a Claude que sume dos números, Claude utilizará tu servidor MCP para realizar el cálculo:

1. El usuario escribe: "Suma 7 y 8"
2. Claude identifica que necesita usar la operación `calculator.add`
3. Claude envía una solicitud a tu servidor MCP con los parámetros `a: 7, b: 8`
4. Tu servidor procesa la solicitud y devuelve `{ result: 15 }`
5. Claude muestra el resultado al usuario: "La suma de 7 y 8 es 15"

---

Esta guía te ha proporcionado los pasos básicos para crear un servidor MCP en TypeScript que suma dos números. Puedes expandir esta funcionalidad según tus necesidades, agregando más operaciones o mejorando la interfaz de usuario.
