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
}

interface AvailabilityRange {
  from: string;
  to: string;
}

interface LodgingListItem {
  id: string;
  title: string;
  occupiedRanges?: AvailabilityRange[];
}

const ownerIdentifier = requiredEnv('E2E_OWNER_IDENTIFIER');
const ownerPassword = requiredEnv('E2E_OWNER_PASSWORD');
const apiBaseUrl = ensureTrailingSlash(
  process.env.E2E_API_URL ?? 'http://localhost:3000/api',
);

test.describe('Owner smoke @owner-smoke', () => {
  test.describe.configure({ mode: 'serial' });

  let api: APIRequestContext;
  let auth: AuthResponse;

  test.beforeAll(async () => {
    api = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        'content-type': 'application/json',
      },
    });
    auth = await loginByApi(api);
    await api.dispose();
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

  test('login y dashboard cargan para owner', async ({ page }) => {
    await loginByUi(page);
    await expect(page).toHaveURL(/\/app\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
    await expect(page.getByText('Resumen operativo')).toBeVisible();
  });

  test('contacts permite alta y baja de un contacto temporal', async ({ page }) => {
    const contactName = `Smoke Contact ${Date.now()}`;
    const contactEmail = `smoke.${Date.now()}@example.com`;
    let createdContactId: string | null = null;

    try {
      await loginByUi(page);
      await page.goto('/app/contacts/new');

      await page.locator('#name').fill(contactName);
      await page.locator('#email').fill(contactEmail);
      await page.locator('#whatsapp').fill('+5492255009999');
      await page.locator('#notes').fill('Creado por smoke e2e owner.');
      await page.getByRole('button', { name: 'Crear contacto' }).click();

      await expect(page).toHaveURL(/\/app\/contacts$/);

      const createdContact = await waitForContactByName(api, contactName);
      createdContactId = createdContact.id;

      const article = page.locator('article.list-shell__item', {
        hasText: contactName,
      });
      await expect(article).toBeVisible();
      await article.getByRole('button', { name: 'Eliminar elemento' }).click();
      await page.locator('app-confirm-modal').getByRole('button', { name: 'Confirmar' }).click();

      await expect(article).toHaveCount(0);
      await expect.poll(async () => getContactByName(api, contactName)).toBeNull();
      createdContactId = null;
    } finally {
      if (createdContactId) {
        await deleteContact(api, createdContactId);
      }
    }
  });

  test('profile permite editar display name y restaurarlo', async ({ page }) => {
    const me = await getCurrentUser(api);
    const originalDisplayName = me.displayName ?? '';
    const nextDisplayName = `${originalDisplayName || 'Perfil'} Smoke`;

    try {
      await loginByUi(page);
      await page.goto('/app/profile/edit');

      await page.locator('input[formcontrolname="displayName"]').fill(nextDisplayName);
      await page.getByRole('button', { name: 'Guardar cambios' }).click();

      await expect(page).toHaveURL(/\/app\/profile$/);
      const profileField = page.locator('.profile-field', {
        hasText: 'Nombre para mostrar',
      });
      await expect(profileField).toContainText(nextDisplayName);
    } finally {
      await updateMe(api, {
        firstName: me.firstName,
        lastName: me.lastName,
        displayName: originalDisplayName || undefined,
        phone: me.phone,
      });
    }
  });

  test('lodgings availability agrega, rechaza solapamiento y elimina rango', async ({ page }) => {
    const lodging = await findLodgingWithoutRanges(api);
    const range: AvailabilityRange = {
      from: '2026-04-10',
      to: '2026-04-12',
    };
    let rangeCreated = false;

    try {
      await loginByUi(page);
      await page.goto(`/app/lodgings/${lodging.id}/availability`);
      await page.getByRole('button', { name: 'Agregar días de ocupación' }).click();

      const formCalendar = page.locator('app-lodging-availability-calendar').nth(1);
      await moveCalendarToMonth(formCalendar, range.from);
      await clickCalendarDay(formCalendar, range.from);
      await clickCalendarDay(formCalendar, range.to);

      await expect(page.locator('.availability-form__summary')).toContainText('10/04/2026 - 12/04/2026');
      await page.getByRole('button', { name: 'Guardar rango' }).click();
      await expect(page.getByText('Rango ocupado agregado correctamente.')).toBeVisible();
      rangeCreated = true;

      await page.getByRole('button', { name: 'Agregar días de ocupación' }).click();
      const overlapCalendar = page.locator('app-lodging-availability-calendar').nth(1);
      await moveCalendarToMonth(overlapCalendar, '2026-04-09');
      await clickCalendarDay(overlapCalendar, '2026-04-09');
      await clickCalendarDay(overlapCalendar, '2026-04-13');

      await expect(
        page.getByText('El rango se superpone con fechas ya ocupadas.'),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Cancelar' }).click();

      const addedItem = page.locator('.availability-item', {
        hasText: '2026-04-10 a 2026-04-12',
      });
      await addedItem.getByRole('button', { name: 'Eliminar' }).click();
      await expect(page.getByText('Rango ocupado eliminado correctamente.')).toBeVisible();
      rangeCreated = false;
    } finally {
      if (rangeCreated) {
        await removeRange(api, lodging.id, range);
      }
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

async function getCurrentUser(api: APIRequestContext): Promise<AuthUser> {
  const response = await api.get('auth/me');
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AuthUser;
}

async function updateMe(
  api: APIRequestContext,
  payload: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'displayName' | 'phone'>>,
): Promise<void> {
  const response = await api.patch('auth/me', { data: payload });
  expect(response.ok()).toBeTruthy();
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

async function findLodgingWithoutRanges(api: APIRequestContext): Promise<LodgingListItem> {
  const response = await api.get('admin/lodgings?page=1&limit=100');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { data: LodgingListItem[] };
  const lodging = payload.data.find(
    (item) => (item.occupiedRanges ?? []).length === 0,
  );

  if (!lodging) {
    throw new Error('No hay un alojamiento sin rangos ocupados para la smoke suite.');
  }

  return lodging;
}

async function removeRange(
  api: APIRequestContext,
  lodgingId: string,
  range: AvailabilityRange,
): Promise<void> {
  const response = await api.delete(`admin/lodgings/${lodgingId}/occupied-ranges`, {
    data: range,
  });
  expect(response.ok()).toBeTruthy();
}

async function moveCalendarToMonth(
  calendar: ReturnType<Page['locator']>,
  isoDate: string,
): Promise<void> {
  const today = new Date();
  const target = new Date(`${isoDate}T00:00:00Z`);
  const monthDiff =
    (target.getUTCFullYear() - today.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - today.getUTCMonth());
  const nextButton = calendar.getByRole('button', { name: 'Mes siguiente' });
  const previousButton = calendar.getByRole('button', { name: 'Mes anterior' });

  if (monthDiff > 0) {
    for (let index = 0; index < monthDiff; index += 1) {
      await nextButton.click();
    }
  } else {
    for (let index = 0; index < Math.abs(monthDiff); index += 1) {
      await previousButton.click();
    }
  }
}

async function clickCalendarDay(
  calendar: ReturnType<Page['locator']>,
  isoDate: string,
): Promise<void> {
  await calendar.getByRole('button', { name: new RegExp(isoDate) }).click();
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
