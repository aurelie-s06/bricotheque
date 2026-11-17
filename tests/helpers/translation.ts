import type {
  BatchStatus,
  TranslationBatchApi,
  TranslationRequest,
  TranslationResult,
} from '#services/translation/claude_batch_api'

/**
 * Fake Claude Batches API: "translates" by prefixing the text with "FR: ".
 * A batch ends after `checksBeforeEnd` status checks.
 */
export class FakeTranslationApi implements TranslationBatchApi {
  batches = new Map<string, TranslationRequest[]>()
  statusChecks = 0
  failIds = new Set<string>()

  constructor(public checksBeforeEnd = 0) {}

  async createBatch(requests: TranslationRequest[]) {
    const id = `msgbatch_${this.batches.size + 1}`
    this.batches.set(id, requests)
    return id
  }

  async batchStatus(batchId: string): Promise<BatchStatus> {
    this.statusChecks++
    const count = this.batches.get(batchId)?.length ?? 0
    const ended = this.statusChecks > this.checksBeforeEnd
    return {
      ended,
      succeeded: ended ? count : 0,
      errored: 0,
      processing: ended ? 0 : count,
    }
  }

  async *results(batchId: string): AsyncIterable<TranslationResult> {
    for (const request of this.batches.get(batchId) ?? []) {
      yield this.failIds.has(request.customId)
        ? { customId: request.customId, status: 'failed', reason: 'refus (cyber)' }
        : { customId: request.customId, status: 'succeeded', text: `FR: ${request.text}` }
    }
  }

  async translateNow(text: string) {
    return `FR: ${text}`
  }
}
