import type { Cents, CommitmentHardness, ISODateTimeString } from '../common';
import type { Commitment } from '../models/commitment';

/** POST /commitments/:id/confirm */
export interface ConfirmCommitmentRequest {
  /** Optional user-corrected amount captured at confirmation time. */
  confirmedAmount?: Cents;
}
export interface ConfirmCommitmentResponse {
  commitment: Commitment;
}

/** POST /commitments/:id/deny — no body. */
export interface DenyCommitmentResponse {
  commitment: Commitment;
}

/** POST /commitments/:id/edit */
export interface EditCommitmentRequest {
  title?: string;
  confirmedAmount?: Cents;
  dueAt?: ISODateTimeString | null;
  hardness?: CommitmentHardness;
}
export interface EditCommitmentResponse {
  commitment: Commitment;
}
