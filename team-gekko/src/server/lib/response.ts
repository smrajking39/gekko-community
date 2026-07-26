import { nanoId } from '@/lib/utils';
/**
 * Standard response envelope + a `handle()` wrapper for route handlers.
 *
 * Pattern:
 *   export async function GET(req: Request) {
 *     return handle(async () => postService.list({ ... }));
 *   }
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, type ErrorCode } from './errors';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: ErrorCode | 'HTTP_ERROR';
    message: string;
    details?: unknown;
    requestId: string;
  };
};

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function fail(
  code: ErrorCode | 'HTTP_ERROR',
  message: string,
  requestId: string,
  details?: unknown,
): ApiFailure {
  return { success: false, error: { code, message, details, requestId } };
}

export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  const requestId = `req_${nanoId(16)}`;
  try {
    const data = await fn();
    return NextResponse.json(ok(data), {
      headers: { 'x-request-id': requestId },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        fail('VALIDATION_ERROR', 'Invalid input', requestId, err.flatten()),
        { status: 400, headers: { 'x-request-id': requestId } },
      );
    }
    if (err instanceof AppError) {
      return NextResponse.json(fail(err.code, err.message, requestId, err.details), {
        status: err.status,
        headers: { 'x-request-id': requestId },
      });
    }
    console.error('[handle] unhandled error', { requestId, err });
    return NextResponse.json(fail('INTERNAL', 'Something went wrong', requestId), {
      status: 500,
      headers: { 'x-request-id': requestId },
    });
  }
}
