import type { VslWordEvent } from './vslWord';

// Clip boundaries are not sign boundaries. Re-arm a repeated gloss only after NO_SIGN.
export class GlossSequenceBuffer {
  private readonly seen = new Set<string>();
  private readonly glosses: string[] = [];
  private lastAction: string | null = null;
  private rearmed = true;
  private sessionId: string | null = null;
  private lastSequence = 0;
  private lastStartedAt = 0;

  accept(event: VslWordEvent): boolean {
    if (event.sessionId && event.sequenceNumber) {
      if (this.sessionId !== event.sessionId) {
        if (this.sessionId && (event.startedAt ?? 0) <= this.lastStartedAt) return false;
        this.seen.clear();
        this.glosses.length = 0;
        this.lastAction = null;
        this.rearmed = true;
        this.sessionId = event.sessionId;
        this.lastSequence = 0;
      }
      if (event.sequenceNumber <= this.lastSequence) return false;
      this.lastSequence = event.sequenceNumber;
      this.lastStartedAt = event.startedAt ?? this.lastStartedAt;
    }
    if (this.seen.has(event.eventId)) return false;
    this.seen.add(event.eventId);
    if (this.seen.size > 512) {
      const oldest = this.seen.values().next().value;
      if (oldest) this.seen.delete(oldest);
    }
    if (event.status === 'NO_SIGN') {
      this.rearmed = true;
      return false;
    }
    if (event.action === this.lastAction && !this.rearmed) return false;
    this.glosses.push(event.action);
    if (this.glosses.length > 40) this.glosses.shift();
    this.lastAction = event.action;
    this.rearmed = false;
    return true;
  }

  get rawGlosses(): string[] { return [...this.glosses]; }

  // Display normalization only: no language model or invented words.
  get localText(): string {
    const raw = this.glosses.join(' ').trim();
    return raw ? raw.charAt(0).toLocaleUpperCase('vi-VN') + raw.slice(1).toLocaleLowerCase('vi-VN') : '';
  }
}
