// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'

// Polyfill fetch for jsdom environment
global.fetch = jest.fn()
global.Request = jest.fn()
global.Response = jest.fn()
global.Headers = jest.fn()

// Polyfill TextEncoder and TextDecoder for @react-email/components
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock mongoose to avoid BSON ESM issues
jest.mock('mongoose', () => {
  class MockSchema {
    constructor(definition, options) {
      this.definition = definition
      this.options = options
    }
    pre() { return this }
    post() { return this }
    index(fields, options) {
      this._indexes = this._indexes || []
      this._indexes.push({ fields, options })
      return this
    }
    methods = {}
    statics = {}
  }

  // Mock model class that acts as both a constructor and has static methods
  class MockModel {
    constructor(data) {
      Object.assign(this, data)
      this._id = Math.random().toString(36).substr(2, 9)
    }

    async save() {
      // Get schema from the constructor (class-specific)
      const schema = this.constructor._schema

      // Validate required fields and set defaults based on schema
      if (schema && schema.definition) {
        for (const [key, value] of Object.entries(schema.definition)) {
          // Set default values first
          if (!this[key] && value.default !== undefined) {
            const defaultValue = typeof value.default === 'function' ? value.default() : value.default
            // If the field type is Date and we got a number, convert to Date
            if (value.type === Date && typeof defaultValue === 'number') {
              this[key] = new Date(defaultValue)
            } else {
              this[key] = defaultValue
            }
          }
          // Then validate required fields
          if (value.required && !this[key]) {
            throw new Error(`${key} is required`)
          }
        }
      }

      // Check unique constraints
      const documents = this.constructor._documents
      if (documents && schema && schema.definition) {
        const existingDocs = documents.filter(doc => {
          for (const [key, value] of Object.entries(schema.definition)) {
            if (value.unique && doc[key] === this[key] && doc._id !== this._id) {
              return true
            }
          }
          return false
        })
        if (existingDocs.length > 0) {
          throw new Error('Duplicate key error')
        }
      }

      // Store document
      if (!this.constructor._documents) {
        this.constructor._documents = []
      }
      this.constructor._documents.push(this)

      return this
    }

    static async deleteMany(filter = {}) {
      if (!this._documents) {
        this._documents = []
      }
      if (Object.keys(filter).length === 0) {
        this._documents = []
      } else {
        this._documents = this._documents.filter(doc => {
          for (const [key, value] of Object.entries(filter)) {
            if (doc[key] !== value) return true
          }
          return false
        })
      }
      return { deletedCount: 0 }
    }

    static async findOne(filter) {
      if (!this._documents) return null
      return this._documents.find(doc => {
        for (const [key, value] of Object.entries(filter)) {
          if (doc[key] !== value) return false
        }
        return true
      }) || null
    }

    static find(filter = {}) {
      const documents = !this._documents ? [] : this._documents

      let filtered = documents
      if (filter && Object.keys(filter).length > 0) {
        filtered = documents.filter(doc => {
          for (const [key, value] of Object.entries(filter)) {
            // Handle special operators like $lt
            if (typeof value === 'object' && value !== null) {
              for (const [op, opValue] of Object.entries(value)) {
                if (op === '$lt' && doc[key] >= opValue) return false
                if (op === '$gt' && doc[key] <= opValue) return false
                if (op === '$lte' && doc[key] > opValue) return false
                if (op === '$gte' && doc[key] < opValue) return false
              }
            } else if (doc[key] !== value) {
              return false
            }
          }
          return true
        })
      }

      // Return a chainable and awaitable object
      const query = {
        data: filtered,
        sort(sortObj) {
          if (sortObj.createdAt === -1) {
            this.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          } else if (sortObj.createdAt === 1) {
            this.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          }
          return this
        },
        limit(count) {
          this.data = this.data.slice(0, count)
          return this
        },
        lean() {
          return this.data
        },
        async exec() {
          return this.data
        },
        // Make the query awaitable (thenable)
        then(onFulfilled, onRejected) {
          return Promise.resolve(this.data).then(onFulfilled, onRejected)
        },
        catch(onRejected) {
          return Promise.resolve(this.data).catch(onRejected)
        },
        [Symbol.asyncIterator]() {
          let index = 0
          return {
            next: () => {
              if (index < this.data.length) {
                return Promise.resolve({ value: this.data[index++], done: false })
              } else {
                return Promise.resolve({ done: true })
              }
            }
          }
        }
      }
      return query
    }

    static async create(data) {
      if (Array.isArray(data)) {
        const results = []
        for (const item of data) {
          const doc = new this(item)
          await doc.save()
          results.push(doc)
        }
        return results
      } else {
        const doc = new this(data)
        await doc.save()
        return doc
      }
    }

    static get collection() {
      const modelName = this._modelName
      let indexes = {
        _id_: [['_id', 1]],
      }

      // Return model-specific indexes
      if (modelName === 'User') {
        indexes = {
          ...indexes,
          email_1: [['email', 1]],
          username_1: [['username', 1]],
          createdAt_1: [['createdAt', 1]],
        }
      } else if (modelName === 'Reading') {
        indexes = {
          ...indexes,
          ['userId_1_createdAt_-1']: [['userId', 1], ['createdAt', -1]],
          createdAt_1: [['createdAt', 1]],
          rating_1: [['rating', 1]],
        }
      } else if (modelName === 'PasswordReset') {
        indexes = {
          ...indexes,
          userId_1: [['userId', 1]],
          token_1: [['token', 1]],
          expiresAt_1: [['expiresAt', 1]],
          createdAt_1: [['createdAt', 1]],
        }
      }

      return {
        getIndexes: jest.fn().mockResolvedValue(indexes)
      }
    }
  }

  // Store documents per model
  MockModel._documents = []

  const createMockModel = (name, schema) => {
    const ModelClass = class extends MockModel {}
    ModelClass._schema = schema
    ModelClass._documents = []
    ModelClass._modelName = name
    return ModelClass
  }

  const mock = {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
      dropDatabase: jest.fn().mockResolvedValue({}),
      readyState: 1,
      client: {
        topology: {
          maxPoolSize: 10,
          minPoolSize: 2,
        },
      },
    },
    model: jest.fn((name, schema) => {
      if (!mock.models[name]) {
        mock.models[name] = createMockModel(name, schema)
      }
      return mock.models[name]
    }),
    models: {},
    Schema: MockSchema,
  }

  return {
    ...mock,
    default: mock,
  }
})
