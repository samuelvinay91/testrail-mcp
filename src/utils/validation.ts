/**
 * Validation utilities for TestRail MCP Server
 */

import { TestRailErrorCodes } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationResult {
  public isValid: boolean;
  public errors: ValidationError[];

  constructor(isValid: boolean = true, errors: ValidationError[] = []) {
    this.isValid = isValid;
    this.errors = errors;
  }

  addError(
    field: string,
    message: string,
    code: string = TestRailErrorCodes.VALIDATION_ERROR
  ): void {
    this.errors.push({ field, message, code });
    this.isValid = false;
  }
}

export class Validator {
  /**
   * Validate required fields
   */
  static validateRequired(obj: any, fields: string[]): ValidationResult {
    const result = new ValidationResult();

    for (const field of fields) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        result.addError(field, `Field '${field}' is required`);
      }
    }

    return result;
  }

  /**
   * Validate number fields
   */
  static validateNumber(obj: any, field: string, min?: number, max?: number): ValidationResult {
    const result = new ValidationResult();

    if (obj[field] !== undefined && obj[field] !== null) {
      const value = Number(obj[field]);

      if (isNaN(value)) {
        result.addError(field, `Field '${field}' must be a valid number`);
      } else {
        if (min !== undefined && value < min) {
          result.addError(field, `Field '${field}' must be at least ${min}`);
        }
        if (max !== undefined && value > max) {
          result.addError(field, `Field '${field}' must be at most ${max}`);
        }
      }
    }

    return result;
  }

  /**
   * Validate string fields
   */
  static validateString(
    obj: any,
    field: string,
    minLength?: number,
    maxLength?: number,
    pattern?: RegExp
  ): ValidationResult {
    const result = new ValidationResult();

    if (obj[field] !== undefined && obj[field] !== null) {
      const value = String(obj[field]);

      if (minLength !== undefined && value.length < minLength) {
        result.addError(field, `Field '${field}' must be at least ${minLength} characters long`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        result.addError(field, `Field '${field}' must be at most ${maxLength} characters long`);
      }
      if (pattern && !pattern.test(value)) {
        result.addError(field, `Field '${field}' does not match required pattern`);
      }
    }

    return result;
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const result = new ValidationResult();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      result.addError('email', 'Invalid email format');
    }

    return result;
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): ValidationResult {
    const result = new ValidationResult();

    try {
      new URL(url);
    } catch {
      result.addError('url', 'Invalid URL format');
    }

    return result;
  }

  /**
   * Validate TestRail status ID
   */
  static validateStatusId(statusId: number): ValidationResult {
    const result = new ValidationResult();
    const validStatuses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    if (!validStatuses.includes(statusId)) {
      result.addError(
        'statusId',
        `Invalid status ID. Valid values are: ${validStatuses.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Validate array field
   */
  static validateArray(
    obj: any,
    field: string,
    minLength?: number,
    maxLength?: number
  ): ValidationResult {
    const result = new ValidationResult();

    if (obj[field] !== undefined && obj[field] !== null) {
      if (!Array.isArray(obj[field])) {
        result.addError(field, `Field '${field}' must be an array`);
      } else {
        const array = obj[field];
        if (minLength !== undefined && array.length < minLength) {
          result.addError(field, `Field '${field}' must contain at least ${minLength} items`);
        }
        if (maxLength !== undefined && array.length > maxLength) {
          result.addError(field, `Field '${field}' must contain at most ${maxLength} items`);
        }
      }
    }

    return result;
  }

  /**
   * Validate object field
   */
  static validateObject(obj: any, field: string): ValidationResult {
    const result = new ValidationResult();

    if (obj[field] !== undefined && obj[field] !== null) {
      if (typeof obj[field] !== 'object' || Array.isArray(obj[field])) {
        result.addError(field, `Field '${field}' must be an object`);
      }
    }

    return result;
  }

  /**
   * Validate enum value
   */
  static validateEnum(obj: any, field: string, validValues: any[]): ValidationResult {
    const result = new ValidationResult();

    if (obj[field] !== undefined && obj[field] !== null) {
      if (!validValues.includes(obj[field])) {
        result.addError(field, `Field '${field}' must be one of: ${validValues.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * Combine multiple validation results
   */
  static combine(...results: ValidationResult[]): ValidationResult {
    const combined = new ValidationResult();

    for (const result of results) {
      if (!result.isValid) {
        combined.isValid = false;
        combined.errors.push(...result.errors);
      }
    }

    return combined;
  }
}

/**
 * Common validation functions for TestRail entities
 */
export class TestRailValidator {
  /**
   * Validate TestRail connection input
   */
  static validateConnectionInput(input: any): ValidationResult {
    return Validator.combine(
      Validator.validateRequired(input, ['baseUrl', 'username', 'apiKey']),
      Validator.validateUrl(input.baseUrl),
      Validator.validateEmail(input.username),
      Validator.validateString(input, 'apiKey', 1),
      Validator.validateNumber(input, 'timeout', 1000, 300000)
    );
  }

  /**
   * Validate project creation input
   */
  static validateCreateProjectInput(input: any): ValidationResult {
    return Validator.combine(
      Validator.validateRequired(input, ['name']),
      Validator.validateString(input, 'name', 1, 255),
      Validator.validateString(input, 'announcement', 0, 1000),
      Validator.validateNumber(input, 'suiteMode', 1, 3)
    );
  }

  /**
   * Validate case creation input
   */
  static validateCreateCaseInput(input: any): ValidationResult {
    return Validator.combine(
      Validator.validateRequired(input, ['sectionId', 'title']),
      Validator.validateNumber(input, 'sectionId', 1),
      Validator.validateString(input, 'title', 1, 255),
      Validator.validateNumber(input, 'templateId', 1),
      Validator.validateNumber(input, 'typeId', 1),
      Validator.validateNumber(input, 'priorityId', 1),
      Validator.validateNumber(input, 'milestoneId', 1),
      Validator.validateString(input, 'refs', 0, 255),
      Validator.validateString(input, 'estimate', 0, 50),
      Validator.validateArray(input, 'stepsDetailed', 0, 100)
    );
  }

  /**
   * Validate run creation input
   */
  static validateCreateRunInput(input: any): ValidationResult {
    return Validator.combine(
      Validator.validateRequired(input, ['projectId', 'name']),
      Validator.validateNumber(input, 'projectId', 1),
      Validator.validateString(input, 'name', 1, 255),
      Validator.validateString(input, 'description', 0, 1000),
      Validator.validateNumber(input, 'suiteId', 1),
      Validator.validateNumber(input, 'milestoneId', 1),
      Validator.validateNumber(input, 'assignedToId', 1),
      Validator.validateArray(input, 'caseIds', 0, 10000),
      Validator.validateArray(input, 'configIds', 0, 100)
    );
  }

  /**
   * Validate result creation input
   */
  static validateAddResultInput(input: any): ValidationResult {
    const result = Validator.combine(
      Validator.validateRequired(input, ['statusId']),
      Validator.validateStatusId(input.statusId),
      Validator.validateNumber(input, 'testId', 1),
      Validator.validateNumber(input, 'runId', 1),
      Validator.validateNumber(input, 'caseId', 1),
      Validator.validateNumber(input, 'assignedToId', 1),
      Validator.validateString(input, 'comment', 0, 2000),
      Validator.validateString(input, 'version', 0, 100),
      Validator.validateString(input, 'elapsed', 0, 50),
      Validator.validateString(input, 'defects', 0, 255),
      Validator.validateArray(input, 'stepResults', 0, 100)
    );

    // Custom validation: either testId or (runId + caseId) must be provided
    if (!input.testId && !(input.runId && input.caseId)) {
      result.addError('identification', 'Either testId or both runId and caseId must be provided');
    }

    return result;
  }
}
