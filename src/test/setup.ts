import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Mock environment variables if not set
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Required environment variables are not set. Please check your .env file.')
}

// Global test setup
globalThis.IS_REACT_ACT_ENVIRONMENT = true 