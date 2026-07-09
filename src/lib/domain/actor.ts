export interface ActorContext {
  userId: string;
  role: string;
  metadata: {
    email?: string;
    role: string;
    status: string;
    [key: string]: unknown;
  };
}

export function requireAdminContext(actor: ActorContext) {
  if (actor.role !== "ADMIN") {
    throw new Error(`Unauthorized: Actor role must be ADMIN, got ${actor.role}`);
  }
}
