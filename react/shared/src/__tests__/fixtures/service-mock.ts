/**
 * Shared test fixture: mock factory for the Service singleton.
 * Creates a mock matching all ServiceInstance method signatures (D-04).
 *
 * @module test-fixtures/service-mock
 */
import { vi } from "vitest";

export function createMockService() {
  return {
    post: vi.fn(),
    search: vi.fn(),
    add: vi.fn(),
    action: vi.fn(),
    fetchId: vi.fn(),
    fetchRecord: vi.fn(),
    get: vi.fn(),
    request: vi.fn(),
    fields: vi.fn(),
    fetchFields: vi.fn(),
    view: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    delete: vi.fn(),
    fetch: vi.fn(),
    info: vi.fn(),
  };
}
