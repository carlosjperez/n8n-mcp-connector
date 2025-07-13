/**
 * Advanced Validation System for N8N MCP Server
 * Implements robust input validation with detailed error reporting
 */

// Validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
  sanitizer?: (value: any) => any;
}

export class Validator {
  private static instance: Validator;
  
  private constructor() {}
  
  static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }
    return Validator.instance;
  }

  /**
   * Validate workflow ID format
   */
  validateWorkflowId(workflowId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!workflowId) {
      errors.push('Workflow ID is required');
      return { isValid: false, errors, warnings };
    }

    if (typeof workflowId !== 'string') {
      errors.push('Workflow ID must be a string');
    }

    // Check for valid UUID format or numeric ID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numericPattern = /^\d+$/;
    const alphanumericPattern = /^[a-zA-Z0-9_-]+$/;

    if (!uuidPattern.test(workflowId) && !numericPattern.test(workflowId) && !alphanumericPattern.test(workflowId)) {
      warnings.push('Workflow ID format may not be standard (expected UUID, numeric, or alphanumeric)');
    }

    if (workflowId.length > 100) {
      errors.push('Workflow ID too long (max 100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: workflowId.trim()
    };
  }

  /**
   * Validate execution data
   */
  validateExecutionData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedData = data;

    if (data !== undefined && data !== null) {
      if (typeof data !== 'object') {
        errors.push('Execution data must be an object');
        return { isValid: false, errors, warnings };
      }

      // Check for potentially dangerous properties
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      for (const key of dangerousKeys) {
        if (key in data) {
          errors.push(`Dangerous property '${key}' not allowed in execution data`);
        }
      }

      // Sanitize data by removing undefined values and limiting depth
      sanitizedData = this.sanitizeObject(data, 5);

      // Check data size
      const dataSize = JSON.stringify(sanitizedData).length;
      if (dataSize > 1024 * 1024) { // 1MB limit
        errors.push('Execution data too large (max 1MB)');
      } else if (dataSize > 100 * 1024) { // 100KB warning
        warnings.push('Execution data is large (>100KB), consider optimizing');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(limit?: number, offset?: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: { limit?: number; offset?: number } = {};

    if (limit !== undefined) {
      if (typeof limit !== 'number' || !Number.isInteger(limit)) {
        errors.push('Limit must be an integer');
      } else if (limit < 1) {
        errors.push('Limit must be greater than 0');
      } else if (limit > 100) {
        errors.push('Limit cannot exceed 100');
      } else {
        sanitizedData.limit = limit;
        if (limit > 50) {
          warnings.push('Large limit may impact performance');
        }
      }
    }

    if (offset !== undefined) {
      if (typeof offset !== 'number' || !Number.isInteger(offset)) {
        errors.push('Offset must be an integer');
      } else if (offset < 0) {
        errors.push('Offset cannot be negative');
      } else {
        sanitizedData.offset = offset;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Validate webhook configuration
   */
  validateWebhookConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    if (!config || typeof config !== 'object') {
      errors.push('Webhook configuration must be an object');
      return { isValid: false, errors, warnings };
    }

    // Validate path
    if (config.path) {
      if (typeof config.path !== 'string') {
        errors.push('Webhook path must be a string');
      } else if (!/^\/[a-zA-Z0-9_\/-]*$/.test(config.path)) {
        errors.push('Invalid webhook path format');
      } else {
        sanitizedData.path = config.path;
      }
    }

    // Validate HTTP method
    if (config.method) {
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!allowedMethods.includes(config.method.toUpperCase())) {
        errors.push(`Invalid HTTP method. Allowed: ${allowedMethods.join(', ')}`);
      } else {
        sanitizedData.method = config.method.toUpperCase();
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Generic validation using rules
   */
  validateWithRules(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    for (const rule of rules) {
      const value = data[rule.field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Field '${rule.field}' is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
        continue;
      }

      // Length validation for strings
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`Field '${rule.field}' must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`Field '${rule.field}' cannot exceed ${rule.maxLength} characters`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`Field '${rule.field}' does not match required pattern`);
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(`Field '${rule.field}' must be one of: ${rule.allowedValues.join(', ')}`);
      }

      // Custom validation
      if (rule.customValidator && !rule.customValidator(value)) {
        errors.push(`Field '${rule.field}' failed custom validation`);
      }

      // Sanitization
      sanitizedData[rule.field] = rule.sanitizer ? rule.sanitizer(value) : value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private sanitizeObject(obj: any, maxDepth: number): any {
    if (maxDepth <= 0) return '[Max depth exceeded]';
    
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = this.sanitizeObject(value, maxDepth - 1);
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const validator = Validator.getInstance();