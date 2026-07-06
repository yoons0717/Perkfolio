import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FakeIntersectionObserver } from './fakeIntersectionObserver'

global.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver

afterEach(() => {
  cleanup()
})
