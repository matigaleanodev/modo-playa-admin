import { Validation } from './validations.model';

export interface FormOption<T> {
  type: FormType;
  key: string;
  label: string;
  value?: T;
  placeholder?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  helper?: string;
  hint?: string;
  options?: FormOptionChoice<T>[];
  multiple?: boolean;
  order?: number;
  inputMode?: FormInputMode;
  columns?: number;

  validaciones?: ValidationList;
  errores?: ErrorMessages;
}

export type FormType =
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'number'
  | 'numberstring'
  | 'boolean'
  | 'dropdown'
  | 'multiple'
  | 'hidden'
  | 'date';

export type ValidationList = Validation[];
export type ErrorMessages = Record<string, string>;

export interface FormOptionChoice<T = unknown> {
  label: string;
  value: T;
  disabled?: boolean;
}

export type FormInputMode =
  | 'text'
  | 'search'
  | 'email'
  | 'tel'
  | 'url'
  | 'numeric'
  | 'decimal';
