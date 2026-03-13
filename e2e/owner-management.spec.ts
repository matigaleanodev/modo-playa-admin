import { test, expect, request, type APIRequestContext, type Page } from '@playwright/test';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  isDefault?: boolean;
  notes?: string;
  active?: boolean;
}

interface Lodging {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  type: 'cabin' | 'apartment' | 'house';
  price: number;
  priceUnit: 'night' | 'week' | 'fortnight';
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  minNights: number;
  distanceToBeach?: number | null;
  amenities?: string[];
  contactId?: string | null;
  active: boolean;
  mainImage?: string;
  images?: string[];
}

const ownerIdentifier = requiredEnv('E2E_OWNER_IDENTIFIER');
const ownerPassword = requiredEnv('E2E_OWNER_PASSWORD');
const apiBaseUrl = ensureTrailingSlash(
  process.env.E2E_API_URL ?? 'http://localhost:3000/api',
);

test.describe('Owner management @owner-management', () => {
  test.describe.configure({ mode: 'serial' });

  let api: APIRequestContext;

  test.beforeAll(async () => {
    const bootstrap = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: { 'content-type': 'application/json' },
    });
    const auth = await loginByApi(bootstrap);
    await bootstrap.dispose();

    api = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${auth.accessToken}`,
        'content-type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('contacts permite editar un contacto existente y restaurarlo', async ({ page }) => {
    const contact = await getEditableContact(api);
    const originalNotes = contact.notes ?? '';
    const nextNotes = `Nota smoke ${Date.now()}`;

    try {
      await loginByUi(page);
      await page.goto(`/app/contacts/${contact.id}`);

      await page.locator('#notes').fill(nextNotes);
      await page.getByRole('button', { name: 'Guardar cambios' }).click();

      await expect(page).toHaveURL(new RegExp(`/app/contacts/${contact.id}$`));
      await expect.poll(async () => (await getContact(api, contact.id)).notes ?? '').toBe(nextNotes);
    } finally {
      await patchContact(api, contact.id, { notes: originalNotes });
    }
  });

  test('lodgings permite editar datos generales y restaurarlos', async ({ page }) => {
    const lodging = await getEditableLodging(api);
    const originalTitle = lodging.title;
    const nextTitle = `${originalTitle} Smoke`;

    try {
      await loginByUi(page);
      await page.goto(`/app/lodgings/${lodging.id}`);

      await page.locator('#title').fill(nextTitle);
      await page.getByRole('button', { name: 'Guardar cambios' }).click();

      await expect(page).toHaveURL(/\/app\/lodgings$/);
      await expect.poll(async () => (await getLodging(api, lodging.id)).title).toBe(nextTitle);
    } finally {
      await patchLodging(api, lodging.id, { title: originalTitle });
    }
  });
});

async function loginByUi(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('ion-input').nth(0).locator('input').fill(ownerIdentifier);
  await page.locator('ion-input').nth(1).locator('input').fill(ownerPassword);
  await page.getByRole('button', { name: 'Entrar al panel' }).click();
  await page.waitForURL(/\/app\/dashboard$/);
}

async function loginByApi(api: APIRequestContext): Promise<AuthResponse> {
  const response = await api.post('auth/login', {
    data: {
      identifier: ownerIdentifier,
      password: ownerPassword,
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AuthResponse;
}

async function getEditableContact(api: APIRequestContext): Promise<Contact> {
  const response = await api.get('admin/contacts?page=1&limit=100');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { data: Contact[] };
  const contact = payload.data.find((item) => item.active !== false) ?? payload.data[0];

  if (!contact) {
    throw new Error('No hay contactos disponibles para la suite owner-management.');
  }

  return getContact(api, contact.id);
}

async function getContact(api: APIRequestContext, contactId: string): Promise<Contact> {
  const response = await api.get(`admin/contacts/${contactId}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Contact;
}

async function patchContact(
  api: APIRequestContext,
  contactId: string,
  payload: Partial<Contact>,
): Promise<void> {
  const response = await api.patch(`admin/contacts/${contactId}`, {
    data: compactRecord(payload),
  });
  expect(response.ok()).toBeTruthy();
}

async function getEditableLodging(api: APIRequestContext): Promise<Lodging> {
  const response = await api.get('admin/lodgings?page=1&limit=100');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { data: Array<{ id: string }> };
  const candidate = payload.data[0];

  if (!candidate) {
    throw new Error('No hay alojamientos disponibles para la suite owner-management.');
  }

  return getLodging(api, candidate.id);
}

async function getLodging(api: APIRequestContext, lodgingId: string): Promise<Lodging> {
  const response = await api.get(`admin/lodgings/${lodgingId}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Lodging;
}

async function patchLodging(
  api: APIRequestContext,
  lodgingId: string,
  payload: Partial<Lodging>,
): Promise<void> {
  const response = await api.patch(`admin/lodgings/${lodgingId}`, {
    data: compactRecord(payload),
  });
  expect(response.ok()).toBeTruthy();
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function compactRecord<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}
