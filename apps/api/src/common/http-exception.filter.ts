import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers["x-request-id"] as string) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "Internal Server Error";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string) ?? exception.message;
        error = (obj.error as string) ?? exception.name;
        details = obj.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      details,
      requestId,
      path: request.url,
    });
  }
}
