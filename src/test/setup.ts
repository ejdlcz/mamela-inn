import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees and wipe browser storage between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
