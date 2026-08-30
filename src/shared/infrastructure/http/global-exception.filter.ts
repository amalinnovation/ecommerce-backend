import { randomUUID } from 'node:crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';
import type { ErrorResponseBody } from './error-response.dto';

/**
 * Único lugar que arma respuestas de error. Ningún controlador debe
 * construir un `{ error: ... }` a mano — así el formato no se desincroniza
 * entre endpoints, y un stack trace nunca llega al cliente.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = randomUUID();

    const { status, code, message, details } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${traceId}] ${request.method} ${request.url} -> ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      error: { code, message, details, traceId },
    };
    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: HttpStatus;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string' ? body : ((body as { message?: string }).message ?? exception.message);
      return { status, code: httpStatusToCode(status), message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Internal server error',
    };
  }
}

function httpStatusToCode(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'bad_request';
    case HttpStatus.UNAUTHORIZED:
      return 'unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'forbidden';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'too_many_requests';
    default:
      return 'http_error';
  }
}
