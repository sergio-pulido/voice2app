/**
 * Shared types across all packages
 */

export interface TelegramUpdate {
  message?: {
    message_id: number
    chat: {
      id: number
      type: string
    }
    from?: {
      id: number
      first_name: string
      username?: string
    }
    text?: string
    voice?: {
      file_id: string
      file_unique_id: string
      duration: number
      mime_type?: string
      file_size?: number
    }
  }
  callback_query?: any
}

export interface Task {
  jobId: string
  project: string
  intent: string
  context: string
  checks: string[]
  artifact: {
    screenshot: boolean
    logs: boolean
  }
  chatId: number
  messageId: number
}

export interface CodegenResult {
  success: boolean
  files: GeneratedFile[]
  sandboxPath: string
  error?: string
}

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface RunnerResult {
  success: boolean
  screenshot?: string
  logs: string[]
  errors: string[]
  url?: string
  publicUrl?: string
  buildLogs?: string[]
}

export interface AnalysisResult {
  summary: string
  suggestions: string[]
  status: 'success' | 'partial' | 'failed'
  checksCompleted: string[]
  checksFailed: string[]
}

export interface NotificationPayload {
  chatId: number
  text: string
  screenshot?: string
  voice?: boolean
  channel?: string  // 'telegram', 'whatsapp', 'discord', 'slack', etc.
}

export interface STTResult {
  text: string
  duration: number
  language?: string
}

export interface PlannerResult {
  task: Task
  transcription?: string
  error?: string
}

// Discord Types
export interface DiscordInteraction {
  id: string
  application_id: string
  type: number // 1 = PING, 2 = APPLICATION_COMMAND, 3 = MESSAGE_COMPONENT
  data?: {
    id: string
    name: string
    options?: Array<{
      name: string
      value: any
      type: number
    }>
  }
  guild_id?: string
  channel_id?: string
  member?: DiscordMember
  user?: DiscordUser
  token: string
  message?: DiscordMessage
}

export interface DiscordMember {
  user?: DiscordUser
  nick?: string
  roles: string[]
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar?: string
  bot?: boolean
}

export interface DiscordMessage {
  id: string
  channel_id: string
  author: DiscordUser
  content: string
  timestamp: string
  attachments?: Array<{
    id: string
    filename: string
    size: number
    url: string
    proxy_url: string
    content_type?: string
  }>
}

// Gateway Orchestration Options
export interface OrchestrateOptions {
  chatId: number | string  // number for Telegram, string for Discord
  messageId: number | string
  voiceBuffer?: Buffer
  textMessage?: string
  username?: string
  platform: 'telegram' | 'discord'
  discordToken?: string  // For deferred responses
}

