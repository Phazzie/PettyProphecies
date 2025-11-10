// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'

// Mock mongoose to avoid BSON ESM issues
jest.mock('mongoose', () => {
  class MockObjectId {
    constructor(id) {
      this._id = id || Math.random().toString(36).substring(2, 15)
    }
    toString() {
      return this._id
    }
  }

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

  MockSchema.Types = {
    ObjectId: MockObjectId,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    Mixed: Object,
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
    Types: {
      ObjectId: MockObjectId,
    },
  }

  return {
    ...mock,
    default: mock,
  }
})
