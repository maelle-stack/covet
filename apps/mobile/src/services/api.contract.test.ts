import { fixtureApi } from './fixtureApi';
import { httpApi } from './httpApi';
import type { CovetApi } from './CovetApi';

/**
 * The seam contract: the fixture client and the live HTTP client must be
 * interchangeable. If the backend echoes the canonical data, `httpApi` must
 * return the exact same domain shapes `fixtureApi` returns — that equality is
 * what guarantees switching modes never changes a screen.
 *
 * `fetch` is mocked to wrap each fixture payload in the standard `{ data }`
 * envelope, so this test exercises httpApi's real unwrapping without a server.
 */

type Json = Record<string, unknown>;

function mockFetchWith(routes: Record<string, Json>) {
  globalThis.fetch = jest.fn(async (url: string) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    const data = routes[path];
    if (!data) throw new Error(`unexpected path ${path}`);
    return {
      ok: true,
      status: 200,
      json: async () => ({ data }),
    } as Response;
  }) as unknown as typeof fetch;
}

describe('CovetApi contract parity (fixture vs http)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the same method surface in both implementations', () => {
    const keysOf = (impl: CovetApi) => Object.keys(impl).sort();
    expect(keysOf(httpApi)).toEqual(keysOf(fixtureApi));
  });

  it('getCurrentSafeToSpend returns identical data', async () => {
    const expected = await fixtureApi.getCurrentSafeToSpend();
    mockFetchWith({ '/safe-to-spend/current': { snapshot: expected } });
    await expect(httpApi.getCurrentSafeToSpend()).resolves.toEqual(expected);
  });

  it('getActivity returns identical data (insights, actions, transactions)', async () => {
    const expected = await fixtureApi.getActivity();
    mockFetchWith({ '/activity': expected as unknown as Json });
    await expect(httpApi.getActivity()).resolves.toEqual(expected);
  });

  it('getUpcoming returns identical data (events, recurring, vaults)', async () => {
    const expected = await fixtureApi.getUpcoming();
    mockFetchWith({ '/upcoming': expected as unknown as Json });
    await expect(httpApi.getUpcoming()).resolves.toEqual(expected);
  });

  it('getUserSettings returns identical data', async () => {
    const expected = await fixtureApi.getUserSettings();
    mockFetchWith({ '/settings': { settings: expected } });
    await expect(httpApi.getUserSettings()).resolves.toEqual(expected);
  });

  it('getSeedPurchaseCheck returns identical data', async () => {
    const expected = await fixtureApi.getSeedPurchaseCheck();
    mockFetchWith({ '/purchase-checks/seed': { purchaseCheck: expected } });
    await expect(httpApi.getSeedPurchaseCheck()).resolves.toEqual(expected);
  });

  it('surfaces a calm error when the envelope carries one', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        error: { code: 'not_found', message: 'No Safe to Spend snapshot yet.' },
      }),
    })) as unknown as typeof fetch;
    await expect(httpApi.getCurrentSafeToSpend()).rejects.toThrow('No Safe to Spend snapshot yet.');
  });
});
