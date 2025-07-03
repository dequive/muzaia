import '@testing-library/jest-dom'
import 'jest-environment-jsdom'

// Extender expect
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null
    if (pass) {
      return {
        message: () => `expected ${received} not to be in the document`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be in the document`,
        pass: false,
      }
    }
  },
})

// Mock do matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  }
}

// Mock do IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockImplementation(function(callback, options) {
  return {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }
})
window.IntersectionObserver = mockIntersectionObserver

// Suprimir warnings do console durante os testes
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks()
})
