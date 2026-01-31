import { ZodError, ZodSchema } from 'zod';
import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }
}

/**
 * Factory function to create validation pipe with schema
 * @example @Body(zodPipe(createUserSchema)) dto: CreateUserDto
 */
export const zodPipe = (schema: ZodSchema) => new ZodValidationPipe(schema);
