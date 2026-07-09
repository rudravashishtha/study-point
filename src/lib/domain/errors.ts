export type DomainErrorCode =
  | "DUPLICATE_IDENTITY"
  | "NOT_FOUND"
  | "ARCHIVE_BLOCKED"
  | "INVALID_LIFECYCLE"
  | "CONCURRENT_UPDATE"
  | "UNAUTHORIZED"
  | "INVALID_RELATION"
  | "INTERNAL_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    public readonly message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
