import { ErrorCode } from './error-code';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  REQUEST_VALIDATION_ERROR: 'La solicitud contiene datos inválidos.',
  INVALID_DESTINATION_ID: 'El destino indicado no es válido.',
  INVALID_TARGET_OWNER_ID: 'El owner de destino indicado no es válido.',
  INVALID_OWNER_ID: 'El owner indicado no es válido.',
  INVALID_USER_ID: 'El usuario indicado no es válido.',
  INVALID_LODGING_ID: 'El alojamiento indicado no es válido.',
  INVALID_CONTACT_ID: 'El contacto indicado no es válido.',
  INVALID_UPLOAD_SESSION_ID: 'La sesión de carga indicada no es válida.',
  INVALID_IMAGE_MIME: 'El tipo de archivo de imagen no es válido.',
  INVALID_IMAGE_SIZE: 'El tamaño de la imagen no es válido.',
  INVALID_PRICE_RANGE: 'El rango de precios indicado no es válido.',
  PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN:
    'SUPERADMIN no puede administrar su imagen de perfil desde este endpoint.',
  CONTACT_DEFAULT_DELETE_FORBIDDEN:
    'No se puede eliminar el contacto por defecto.',
  INVALID_AVAILABILITY_RANGE: 'El rango de disponibilidad es inválido.',
  OCCUPIED_RANGE_CONFLICT:
    'El rango de disponibilidad se superpone con otro existente.',
  USER_ALREADY_EXISTS: 'Ya existe un usuario con ese email.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  PASSWORD_ALREADY_SET: 'La contraseña ya fue configurada.',
  USER_DISABLED: 'El usuario se encuentra deshabilitado.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  LODGING_NOT_FOUND: 'Alojamiento no encontrado.',
  CONTACT_NOT_FOUND: 'Contacto no encontrado.',
  CONTACT_NOT_BELONG_TO_OWNER: 'El contacto no pertenece al propietario.',
  CONTACT_NOT_ALLOWED: 'No tiene permisos para realizar esta acción.',
  LODGING_IMAGE_LIMIT_EXCEEDED:
    'Se excedió el límite permitido de imágenes para el alojamiento.',
  LODGING_IMAGE_NOT_FOUND: 'La imagen del alojamiento no fue encontrada.',
  LODGING_IMAGE_DEFAULT_REQUIRED:
    'El alojamiento debe conservar una imagen predeterminada.',
  LODGING_IMAGE_INVALID_DEFAULT_STATE:
    'No se pudo resolver una imagen predeterminada válida.',
  LODGING_IMAGE_UPLOAD_NOT_FOUND:
    'La carga de imagen del alojamiento no fue encontrada.',
  LODGING_IMAGE_UPLOAD_INVALID_KEY:
    'La clave de carga de la imagen no es válida.',
  LODGING_IMAGE_INVALID_MIME: 'El formato de imagen del alojamiento no es válido.',
  LODGING_IMAGE_SIZE_EXCEEDED:
    'La imagen del alojamiento supera el tamaño permitido.',
  STORAGE_OBJECT_NOT_FOUND:
    'El archivo asociado no fue encontrado en el almacenamiento.',
  LODGING_IMAGE_PENDING_NOT_FOUND:
    'No se encontró una imagen pendiente del alojamiento.',
  LODGING_IMAGE_PENDING_EXPIRED:
    'Una imagen pendiente del alojamiento expiró antes de confirmarse.',
  LODGING_IMAGE_INVALID_STATE:
    'La imagen del alojamiento quedó en un estado inválido para completar la operación.',
};
