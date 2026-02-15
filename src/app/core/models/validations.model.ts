export interface Validation {
  tipo: 'required' | 'email' | 'minlength' | 'maxlength' | 'pattern' | 'cuit';
  valor?: any;
}
