/**
 * Base de todo error de dominio. `code` es estable y pensado para la
 * máquina (el frontend decide el texto que lee la persona); `message`
 * es sólo para logs, nunca para mostrarse en la interfaz.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  /** 400 por defecto; las subclases lo sobreescriben (404, 409, ...). */
  readonly httpStatus: number = 400;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}
