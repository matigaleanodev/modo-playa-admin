import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';
import { StorageService } from '@shared/services/storage/storage.service';
import { JwtPayload } from '../models/token.model';

describe('TokenService', () => {
  let service: TokenService;
  let storageMock: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    storageMock = jasmine.createSpyObj<StorageService>('StorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TokenService,
        { provide: StorageService, useValue: storageMock },
      ],
    });

    service = TestBed.inject(TokenService);
  });

  it('debería guardar tokens en memoria y storage', async () => {
    storageMock.setItem.and.resolveTo();

    await service.setTokens('access', 'refresh');

    expect(storageMock.setItem).toHaveBeenCalledWith('access_token', 'access');
    expect(storageMock.setItem).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
    );
  });

  it('debería limpiar tokens de memoria y storage', async () => {
    storageMock.removeItem.and.resolveTo();

    await service.clearTokens();

    expect(storageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(storageMock.removeItem).toHaveBeenCalledWith('refresh_token');
  });

  it('debería devolver token desde cache si existe', async () => {
    storageMock.getItem.and.resolveTo(null);

    await service.setTokens('cached', 'refresh');

    const token = await service.getAccessToken();

    expect(token).toBe('cached');
    expect(storageMock.getItem).not.toHaveBeenCalled();
  });

  it('debería decodificar correctamente el token', () => {
    const payload: JwtPayload = {
      sub: '1',
      ownerId: 'owner',
      role: 'OWNER',
      purpose: 'ACCESS',
      exp: Math.floor(Date.now() / 1000) + 1000,
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const fakeToken = `header.${base64Payload}.signature`;

    const decoded = service.decode(fakeToken);

    expect(decoded.ownerId).toBe('owner');
    expect(decoded.role).toBe('OWNER');
  });

  it('debería detectar token expirado', () => {
    const payload: JwtPayload = {
      sub: '1',
      ownerId: 'owner',
      role: 'OWNER',
      purpose: 'ACCESS',
      exp: Math.floor(Date.now() / 1000) - 10,
    };

    const fakeToken = `h.${btoa(JSON.stringify(payload))}.s`;

    const expired = service.isExpired(fakeToken);

    expect(expired).toBeTrue();
  });

  it('debería obtener ownerId desde token', async () => {
    const payload: JwtPayload = {
      sub: '1',
      ownerId: 'owner123',
      role: 'OWNER',
      purpose: 'ACCESS',
      exp: Math.floor(Date.now() / 1000) + 1000,
    };

    const token = `h.${btoa(JSON.stringify(payload))}.s`;

    storageMock.getItem.and.resolveTo(token);

    const ownerId = await service.getOwnerId();

    expect(ownerId).toBe('owner123');
  });
});
