import path from 'node:path';
import { test, expect, request, type APIRequestContext, type Page } from '@playwright/test';

interface AuthUser {
  id: string;
  email: string;
  username: string;
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
}

interface Lodging {
  id: string;
  title: string;
}

const superadminIdentifier = process.env.E2E_SUPERADMIN_IDENTIFIER?.trim() ?? '';
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD?.trim() ?? '';
const targetOwnerId = process.env.E2E_TARGET_OWNER_ID?.trim() ?? '';
const apiBaseUrl = ensureTrailingSlash(
  process.env.E2E_API_URL ?? 'http://localhost:3000/api',
);
const fixtureImagePath = path.resolve(
  process.cwd(),
  'src/assets/images/profile_image.png',
);
const hasSuperadminEnv =
  !!superadminIdentifier && !!superadminPassword && !!targetOwnerId;

test.describe('Superadmin targetOwnerId @superadmin-target-owner', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(
    !hasSuperadminEnv,
    'Faltan E2E_SUPERADMIN_IDENTIFIER, E2E_SUPERADMIN_PASSWORD o E2E_TARGET_OWNER_ID.',
  );

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

  test('contacts permite alta soporte con targetOwnerId explicito', async ({ page }) => {
    const contactName = `Support Contact ${Date.now()}`;
    let createdContactId: string | null = null;

    try {
      await loginByUi(page);
      await page.goto('/app/contacts/new');

      await page.locator('#name').fill(contactName);
      await page.locator('#email').fill(`support.${Date.now()}@example.com`);
      await page.locator('#whatsapp').fill('+5492255001111');
      await page.locator('#notes').fill('Creado por smoke de soporte.');
      await page.locator('#targetOwnerId').fill(targetOwnerId);
      await page.getByRole('button', { name: 'Crear contacto' }).click();

      await expect(page).toHaveURL(/\/app\/contacts$/);

      const createdContact = await waitForContactByName(api, contactName);
      createdContactId = createdContact.id;
    } finally {
      if (createdContactId) {
        await deleteContact(api, createdContactId);
      }
    }
  });

  test('users requiere targetOwnerId visible para soporte antes de confirmar alta', async ({ page }) => {
    await loginByUi(page);
    await page.goto('/app/users');

    await page.getByRole('button', { name: 'Dar de alta usuario' }).click();
    await page.locator('input[formcontrolname="username"]').fill(`support${Date.now()}`);
    await page.locator('input[formcontrolname="email"]').fill(`support.${Date.now()}@example.com`);

    await expect(
      page.getByRole('button', { name: 'Confirmar alta' }),
    ).toBeDisabled();

    await page.locator('input[formcontrolname="targetOwnerId"]').fill(targetOwnerId);

    await expect(
      page.getByRole('button', { name: 'Confirmar alta' }),
    ).toBeEnabled();
  });

  test('lodgings permite alta soporte con targetOwnerId explicito', async ({ page }) => {
    const lodgingTitle = `Support Lodging ${Date.now()}`;
    let createdLodgingId: string | null = null;

    try {
      await loginByUi(page);
      await page.goto('/app/lodgings/new');

      await page.locator('#title').fill(lodgingTitle);
      await page.locator('#description').fill('Alojamiento creado desde smoke de soporte.');
      await page.locator('#location').fill('Calle soporte 123');
      await page.locator('#city').fill('Mar Azul');
      await page.locator('#price').fill('120000');
      await page.locator('#maxGuests').fill('4');
      await page.locator('#bedrooms').fill('2');
      await page.locator('#bathrooms').fill('1');
      await page.locator('#minNights').fill('2');
      await page.locator('#targetOwnerId').fill(targetOwnerId);
      await page
        .locator('input[type="file"][accept="image/*"]')
        .setInputFiles(fixtureImagePath);

      await expect(page.getByText('Lista para asociar')).toBeVisible();
      await page.getByRole('button', { name: 'Crear alojamiento' }).click();

      await expect(page).toHaveURL(/\/app\/lodgings$/);

      const createdLodging = await waitForLodgingByTitle(api, lodgingTitle);
      createdLodgingId = createdLodging.id;
    } finally {
      if (createdLodgingId) {
        await deleteLodging(api, createdLodgingId);
      }
    }
  });
});

async function loginByUi(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('ion-input').nth(0).locator('input').fill(superadminIdentifier);
  await page.locator('ion-input').nth(1).locator('input').fill(superadminPassword);
  await page.getByRole('button', { name: 'Entrar al panel' }).click();
  await page.waitForURL(/\/app\/dashboard$/);
}

async function loginByApi(api: APIRequestContext): Promise<AuthResponse> {
  const response = await api.post('auth/login', {
    data: {
      identifier: superadminIdentifier,
      password: superadminPassword,
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AuthResponse;
}

async function getContactByName(
  api: APIRequestContext,
  contactName: string,
): Promise<Contact | null> {
  const response = await api.get('admin/contacts?page=1&limit=100');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { data: Contact[] };
  return payload.data.find((contact) => contact.name === contactName) ?? null;
}

async function waitForContactByName(
  api: APIRequestContext,
  contactName: string,
): Promise<Contact> {
  await expect
    .poll(async () => getContactByName(api, contactName), {
      message: `El contacto ${contactName} no apareció en la API`,
    })
    .not.toBeNull();

  return (await getContactByName(api, contactName)) as Contact;
}

async function deleteContact(api: APIRequestContext, contactId: string): Promise<void> {
  const response = await api.delete(`admin/contacts/${contactId}`);
  expect(response.ok()).toBeTruthy();
}

async function getLodgingByTitle(
  api: APIRequestContext,
  lodgingTitle: string,
): Promise<Lodging | null> {
  const response = await api.get('admin/lodgings?page=1&limit=100');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { data: Lodging[] };
  return payload.data.find((lodging) => lodging.title === lodgingTitle) ?? null;
}

async function waitForLodgingByTitle(
  api: APIRequestContext,
  lodgingTitle: string,
): Promise<Lodging> {
  await expect
    .poll(async () => getLodgingByTitle(api, lodgingTitle), {
      message: `El lodging ${lodgingTitle} no apareció en la API`,
    })
    .not.toBeNull();

  return (await getLodgingByTitle(api, lodgingTitle)) as Lodging;
}

async function deleteLodging(api: APIRequestContext, lodgingId: string): Promise<void> {
  const response = await api.delete(`admin/lodgings/${lodgingId}`);
  expect(response.ok()).toBeTruthy();
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
