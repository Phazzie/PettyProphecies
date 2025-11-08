// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock mongoose to avoid BSON ESM issues
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    close: jest.fn().mockResolvedValue({}),
  },
  model: jest.fn(),
  Schema: jest.fn(),
  default: {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
    },
  },
}))
