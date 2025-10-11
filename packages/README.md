# 📦 Voice2App Packages

This directory contains the modular packages that make up the Voice2App system.

## 🏗️ Architecture

```
User (Telegram) → telegram-gateway → orchestrator
                        ↓
                    planner (STT + Task Planning)
                        ↓
                    codegen (LLM Code Generation)
                        ↓
                    runner (Build + Serve + Screenshot)
                        ↓
                    analyzer (Results Analysis)
                        ↓
                    notifier (Send to Telegram)
```

## 📁 Package Structure

### `shared/`
Common types, configuration, and utilities used across all packages.

**Exports:**
- `types.ts` - TypeScript interfaces for Task, Results, etc.
- `config.ts` - Environment configuration and validation
- `logger.ts` - Logging utilities with emoji prefixes

### `telegram-gateway/`
Receives webhook events from Telegram via Hookdeck and routes them to the orchestrator.

**Key files:**
- `index.ts` - Hono app with `/telegram` endpoint
- `telegram-client.ts` - Telegram API utilities (download files, send messages)
- `orchestrator.ts` - Main pipeline coordinator

### `planner/`
Converts voice or text input into structured tasks using Whisper STT and GPT.

**Key files:**
- `stt.ts` - OpenAI Whisper speech-to-text
- `task-planner.ts` - Natural language → JSON task conversion

**Output:**
```typescript
{
  jobId: string
  project: "mvp" | "frontend" | "backend"
  intent: "create" | "edit" | "add-feature" | "fix"
  context: string
  checks: string[]
  artifact: { screenshot: boolean, logs: boolean }
}
```

### `codegen/`
Generates complete application code using GPT-4o-mini.

**Key files:**
- `generator.ts` - LLM-based code generation
- `file-writer.ts` - Writes files to sandbox directory

**Output:**
Array of generated files written to `sandbox/<jobId>/`

### `runner/`
Builds, serves, and captures screenshots of generated apps using Playwright.

**Key files:**
- `builder.ts` - Runs `bun install` and `bun run build`
- `server.ts` - Starts dev server for the app
- `screenshot.ts` - Playwright screenshot capture

**Output:**
- Screenshot saved to `artifacts/<jobId>.png`
- Build and runtime logs
- Success/failure status

### `analyzer/`
Analyzes results and generates summaries with GPT.

**Key files:**
- `index.ts` - Analyzes runner results, generates summary and suggestions

**Output:**
- Summary text (2-3 sentences)
- Suggestions array
- Status: success | partial | failed

### `notifier/`
Sends results back to Telegram.

**Key files:**
- `index.ts` - Send messages and photos to Telegram

**Features:**
- Markdown-formatted messages
- Screenshot attachments
- Error handling

## 🔧 Usage

Each package exports its main function and can be used independently:

```typescript
import { processInput } from './packages/planner'
import { generateApp } from './packages/codegen'
import { runApp } from './packages/runner'
import { analyzeResults } from './packages/analyzer'
import { sendNotification } from './packages/notifier'

// Or use the orchestrator to run the full pipeline
import { orchestrate } from './packages/telegram-gateway/orchestrator'
```

## 🧪 Testing

To test individual packages:

```bash
# Test planner
bun run packages/planner/test.ts

# Test codegen
bun run packages/codegen/test.ts

# etc.
```

## 🔄 Data Flow

1. **Telegram** sends webhook to **Hookdeck**
2. **Hookdeck** forwards to **telegram-gateway** (`POST /telegram`)
3. **Gateway** downloads voice/text and calls **orchestrator**
4. **Orchestrator** runs pipeline:
   - **Planner**: Voice → Text → Task
   - **Codegen**: Task → Files
   - **Runner**: Files → App → Screenshot
   - **Analyzer**: Results → Summary
   - **Notifier**: Summary + Screenshot → Telegram

## 🎯 Design Principles

- **Modularity**: Each package has a single responsibility
- **Type Safety**: Strong TypeScript types throughout
- **Error Handling**: Graceful fallbacks at each stage
- **Logging**: Consistent logging with job IDs
- **Scalability**: Easy to add new packages or replace implementations

