import Anthropic from '@anthropic-ai/sdk'

/** Model chosen for the translations */
export const TRANSLATION_MODEL = 'claude-opus-5-5'

/** Descriptions are at most ~4,000 characters: room for the translation and the thinking */
const MAX_TOKENS = 8000

export const TRANSLATION_PROMPT = `You translate LEGO® set descriptions from English into French for a French website about brick sets.

Rules:
- Write natural, fluent French (France), faithful to the original meaning. Do not add or remove information.
- Address the reader with "tu", consistently, like the rest of the website.
- Keep set names, character names, vehicle and place names, and brand names exactly as written in the original (e.g. "Millennium Falcon", "Darth Vader"), so they match the set names shown on the site.
- Keep the ® and ™ symbols where they appear.
- Format numbers the French way (7 500 pièces, 21,5 cm) without converting units.
- Keep the structure: one paragraph per paragraph, separated by a blank line; keep "• " bullet points.
- Answer with the French translation only, without any introduction, note or quotation marks.`

export type TranslationRequest = { customId: string; text: string }

export type TranslationResult =
  | { customId: string; status: 'succeeded'; text: string }
  | { customId: string; status: 'failed'; reason: string }

export type BatchStatus = {
  ended: boolean
  succeeded: number
  errored: number
  processing: number
}

/**
 * What the translator needs from the Claude Message Batches API; replaced
 * by a fake in the tests.
 */
export interface TranslationBatchApi {
  createBatch(requests: TranslationRequest[]): Promise<string>
  batchStatus(batchId: string): Promise<BatchStatus>
  results(batchId: string): AsyncIterable<TranslationResult>
  translateNow(text: string): Promise<string>
}

function messageParams(text: string) {
  return {
    model: TRANSLATION_MODEL,
    max_tokens: MAX_TOKENS,
    // Translation is a simple task: low effort keeps the thinking (always on) short
    output_config: { effort: 'low' as const },
    system: TRANSLATION_PROMPT,
    messages: [{ role: 'user' as const, content: text }],
  }
}

/** Text of a response, or why it cannot be used */
function readMessage(message: Anthropic.Message): { text: string } | { reason: string } {
  if (message.stop_reason === 'refusal') {
    return { reason: `refus (${message.stop_details?.category ?? 'sans catégorie'})` }
  }
  if (message.stop_reason === 'max_tokens') {
    return { reason: 'réponse tronquée (max_tokens)' }
  }
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
  return text ? { text } : { reason: 'réponse vide' }
}

/**
 * Claude Message Batches API: asynchronous, 50 % cheaper than single calls.
 */
export default class ClaudeBatchApi implements TranslationBatchApi {
  #client: Anthropic

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY manquante dans .env')
    }
    this.#client = new Anthropic({ apiKey })
  }

  async createBatch(requests: TranslationRequest[]) {
    const batch = await this.#client.messages.batches.create({
      requests: requests.map((request) => ({
        custom_id: request.customId,
        params: messageParams(request.text),
      })),
    })
    return batch.id
  }

  async batchStatus(batchId: string): Promise<BatchStatus> {
    const batch = await this.#client.messages.batches.retrieve(batchId)
    return {
      ended: batch.processing_status === 'ended',
      succeeded: batch.request_counts.succeeded,
      errored: batch.request_counts.errored + batch.request_counts.expired,
      processing: batch.request_counts.processing,
    }
  }

  async *results(batchId: string): AsyncIterable<TranslationResult> {
    for await (const entry of await this.#client.messages.batches.results(batchId)) {
      if (entry.result.type !== 'succeeded') {
        yield { customId: entry.custom_id, status: 'failed', reason: entry.result.type }
        continue
      }
      const read = readMessage(entry.result.message)
      yield 'text' in read
        ? { customId: entry.custom_id, status: 'succeeded', text: read.text }
        : { customId: entry.custom_id, status: 'failed', reason: read.reason }
    }
  }

  /** One description, synchronously (debug: --set) */
  async translateNow(text: string) {
    const message = await this.#client.messages.create(messageParams(text))
    const read = readMessage(message)
    if ('reason' in read) {
      throw new Error(`Traduction impossible : ${read.reason}`)
    }
    return read.text
  }
}
