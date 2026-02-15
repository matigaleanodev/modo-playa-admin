import { Validation } from './validations.model';

export interface FormOption<T> {
  type: FormType;
  key: string;
  label: string;
  value?: T;

  validaciones: ValidationList;
  errores: ErrorMessages;
  helper: string;
  readonly?: boolean;
}

type FormType =
  | 'text'
  | 'number'
  | 'numberstring'
  | 'boolean'
  | 'dropdown'
  | 'multiple'
  | 'hidden'
  | 'date';

type ValidationList = Validation[];
type ErrorMessages = Record<string, string>;
