import { ErrorCode } from './error-code';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  CONTACT_DEFAULT_DELETE_FORBIDDEN:
    'No se puede eliminar el contacto por defecto.',
  INVALID_AVAILABILITY_RANGE: 'El rango de disponibilidad es inválido.',
  USER_ALREADY_EXISTS: 'Ya existe un usuario con ese email.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  PASSWORD_ALREADY_SET: 'La contraseña ya fue configurada.',
  USER_DISABLED: 'El usuario se encuentra deshabilitado.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  LODGING_NOT_FOUND: 'Alojamiento no encontrado.',
  CONTACT_NOT_FOUND: 'Contacto no encontrado.',
  CONTACT_NOT_BELONG_TO_OWNER: 'El contacto no pertenece al propietario.',
  CONTACT_NOT_ALLOWED: 'No tiene permisos para realizar esta acción.',
  INVALID_OBJECT_ID: 'Identificador inválido.',
};
