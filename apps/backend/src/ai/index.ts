/**
 * Model-agnostic AI service abstraction, per docs/05_engineering_architecture.md:
 * "Critical financial calculations should not depend on the LLM. The LLM may
 * explain, parse, summarize, or generate insights, but deterministic engine
 * services must own final money decisions."
 *
 * This file fixes the contract shape only. No provider is selected or
 * implemented yet (see Phase 6).
 */

export interface AiRequest<TInput = unknown> {
  provider: string;
  model: string;
  promptVersion: string;
  input: TInput;
}

export interface AiResponse<TOutput = unknown> {
  output: TOutput;
  confidence: number | null;
  latencyMs: number;
  tokenCost: number | null;
  safety: {
    flagged: boolean;
    reason?: string;
  };
  error?: string;
}

export interface AiService {
  run<TInput, TOutput>(request: AiRequest<TInput>): Promise<AiResponse<TOutput>>;
}
