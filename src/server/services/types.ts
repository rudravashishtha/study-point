export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failure(code: string, message: string): ServiceResult<never> {
  return { success: false, error: { code, message } };
}
