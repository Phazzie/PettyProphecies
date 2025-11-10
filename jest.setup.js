// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock mongoose to avoid BSON ESM issues
jest.mock('mongoose', () => {
  class MockSchema {
    constructor(definition, options) {
      this.definition = definition
      this.options = options
    }
    pre() { return this }
    post() { return this }
    methods = {}
    statics = {}
  }

  const mock = {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
      readyState: 1,
    },
    model: jest.fn(),
    models: {},
    Schema: MockSchema,
  }

  return {
    ...mock,
    default: mock,
  }
})
