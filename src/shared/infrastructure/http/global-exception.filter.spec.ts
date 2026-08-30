import { describe, expect, it, vi } from 'vitest';
import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { DomainError } from '../../domain/errors/domain-error';
import { GlobalExceptionFilter } from './global-exception.filter';
import type { ErrorResponseBody } from './error-response.dto';

class StockInsuficienteError extends DomainError {
  readonly code = 'stock_insuficiente';
}

function mockHost() {
  const json = vi.fn<(body: ErrorResponseBody) => void>();
  const status = vi.fn<(code: number) => { json: typeof json }>().mockReturnValue({ json });
  const response = { status };
  const request = { method: 'POST', url: '/v1/checkout' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('GlobalExceptionFilter', () => {
  it('traduce un DomainError al formato { error } con código estable y 400', () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(new StockInsuficienteError('Insufficient stock', { sku: 'ABC', available: 1 }), host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('stock_insuficiente');
    expect(body.error.details).toEqual({ sku: 'ABC', available: 1 });
    expect(typeof body.error.traceId).toBe('string');
    expect(body.error.traceId.length).toBeGreaterThan(0);
  });

  it('traduce una HttpException de Nest preservando su status', () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(new NotFoundException('Order not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].error.code).toBe('not_found');
  });

  it('nunca deja escapar un stack trace: un error desconocido se vuelve internal_error 500', () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(new Error('boom, algo interno explotó'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('internal_error');
    expect(body.error.message).not.toContain('boom');
  });
});
