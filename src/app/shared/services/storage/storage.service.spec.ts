import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';
import { IonicStorageMock } from '@shared/mocks/ionic-storage.mock';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: Storage, useClass: IonicStorageMock },
        StorageService,
      ],
    }).compileComponents();

    service = TestBed.inject(StorageService);
  });
  it('debería guardar y recuperar un valor', async () => {
    await service.setItem('key', 'value');
    const result = await service.getItem('key');
    expect(result).toBe('value');
  });

  it('debería devolver null si la key no existe', async () => {
    const result = await service.getItem('no-existe');
    expect(result).toBeNull();
  });

  it('debería eliminar un valor', async () => {
    await service.setItem('key', 'value');
    await service.removeItem('key');
    const result = await service.getItem('key');
    expect(result).toBeNull();
  });

  it('debería limpiar todo el storage', async () => {
    await service.setItem('a', 1);
    await service.setItem('b', 2);

    await service.clear();

    expect(await service.getItem('a')).toBeNull();
    expect(await service.getItem('b')).toBeNull();
  });
});
