import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { ValidationError } from '../utils';

// Validation result handler
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors: Record<string, string> = {};
    errors.array().forEach((error) => {
      if ('path' in error) {
        formattedErrors[error.path] = error.msg;
      }
    });

    next(ValidationError('Dữ liệu không hợp lệ', formattedErrors));
  };
};

// Common validation rules
export const commonValidations = {
  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Số trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Giới hạn phải từ 1 đến 100'),
    query('sort')
      .optional()
      .isString()
      .withMessage('Trường sắp xếp phải là chuỗi'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Thứ tự sắp xếp phải là asc hoặc desc'),
  ],

  // UUID validation (for Prisma)
  uuid: (field: string, location: 'param' | 'body' | 'query' = 'param') => {
    const validator = location === 'param' ? param(field) : location === 'body' ? body(field) : query(field);
    return validator.isUUID().withMessage(`${field} không hợp lệ`);
  },

  // Integer ID validation (for MySQL auto-increment)
  id: (field: string, location: 'param' | 'body' | 'query' = 'param') => {
    const validator = location === 'param' ? param(field) : location === 'body' ? body(field) : query(field);
    return validator.isInt({ min: 1 }).withMessage(`${field} không hợp lệ`);
  },

  // Email
  email: body('email')
    .trim()
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  // Password
  password: body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),

  // Vietnamese phone number
  phone: body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9}$/)
    .withMessage('Số điện thoại không hợp lệ'),

  // Required string
  requiredString: (field: string, minLength = 1, maxLength = 255) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} không được để trống`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} phải từ ${minLength} đến ${maxLength} ký tự`),

  // Optional string
  optionalString: (field: string, maxLength = 255) =>
    body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field} không được quá ${maxLength} ký tự`),

  // Required number
  requiredNumber: (field: string, min = 0, max?: number) => {
    let validator = body(field)
      .notEmpty()
      .withMessage(`${field} không được để trống`)
      .isNumeric()
      .withMessage(`${field} phải là số`)
      .custom((value) => {
        const num = parseFloat(value);
        if (num < min) {
          throw new Error(`${field} phải lớn hơn hoặc bằng ${min}`);
        }
        if (max !== undefined && num > max) {
          throw new Error(`${field} phải nhỏ hơn hoặc bằng ${max}`);
        }
        return true;
      });
    return validator;
  },

  // Optional number
  optionalNumber: (field: string, min = 0, max?: number) =>
    body(field)
      .optional()
      .isNumeric()
      .withMessage(`${field} phải là số`)
      .custom((value) => {
        const num = parseFloat(value);
        if (num < min) {
          throw new Error(`${field} phải lớn hơn hoặc bằng ${min}`);
        }
        if (max !== undefined && num > max) {
          throw new Error(`${field} phải nhỏ hơn hoặc bằng ${max}`);
        }
        return true;
      }),

  // Boolean
  optionalBoolean: (field: string) =>
    body(field)
      .optional()
      .isBoolean()
      .withMessage(`${field} phải là boolean`),

  // Array
  requiredArray: (field: string, minLength = 1) =>
    body(field)
      .isArray({ min: minLength })
      .withMessage(`${field} phải là mảng có ít nhất ${minLength} phần tử`),

  // Date
  requiredDate: (field: string) =>
    body(field)
      .notEmpty()
      .withMessage(`${field} không được để trống`)
      .isISO8601()
      .withMessage(`${field} không phải định dạng ngày hợp lệ`)
      .toDate(),

  optionalDate: (field: string) =>
    body(field)
      .optional()
      .isISO8601()
      .withMessage(`${field} không phải định dạng ngày hợp lệ`)
      .toDate(),
};

export { body, param, query };
