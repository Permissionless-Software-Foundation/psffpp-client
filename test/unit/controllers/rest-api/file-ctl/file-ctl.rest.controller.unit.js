/*
  Unit tests for the REST API handler for the /files endpoints.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import FileController from '../../../../../src/controllers/rest-api/file-ctl/controller.js'
import adapters from '../../../mocks/adapters/index.js'
import UseCasesMock from '../../../mocks/use-cases/index.js'

import { context as mockContext } from '../../../mocks/ctx-mock.js'
let uut
let sandbox
let ctx

describe('#IPFS REST API', () => {
  before(async () => {
  })

  beforeEach(() => {
    const useCases = new UseCasesMock()

    uut = new FileController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new FileController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /files REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new FileController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /files REST Controller.'
        )
      }
    })
  })

  describe('#POST /addFile', () => {
    it('should return the output of tus', async () => {
      sandbox.stub(uut.tusServer, 'handle').returns(true)

      ctx.request.body = {}

      const result = await uut.addFile(ctx)

      assert.equal(result, true)
    })
  })

  describe('#GET /status', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.filePairMgmnt, 'getPair').rejects(new Error('test error'))

        ctx.params = {
          sn: 'test-sn'
        }

        await uut.fileStatus(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        console.log('err: ', err)
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.filePairMgmnt, 'getPair').resolves({ a: 'b' })

      ctx.params = {
        sn: 'test-sn'
      }

      await uut.fileStatus(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'success')
      assert.equal(ctx.body.success, true)
    })
  })

  describe('#tusEventHandler', () => {
    it('should return true on successful upload', async () => {
      const upload = {
        id: 'ad369eb4032ec52b18f5eb253df0cdf2',
        size: 81527,
        offset: 81527,
        metadata: {
          test: 'avatar',
          sn: '4435',
          wif: 'L4jNPkakY9QYnw4dudX6JN3q2WAWGKZzrGcZm3JSGJvDaPspp77i',
          relativePath: 'null',
          name: 'aah.jpeg',
          type: 'image/jpeg',
          filetype: 'image/jpeg',
          filename: 'aah.jpeg'
        },
        creation_date: '2024-01-10T14:48:03.209Z'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.fs, 'renameSync').returns()
      sandbox.stub(uut.fs, 'statSync').returns({ size: 100 })
      sandbox.stub(uut.filePairMgmnt, 'addFile').returns()

      const result = await uut.tusEventHandler({}, {}, upload)

      assert.equal(result, true)
    })

    it('should catch, report, and throw errors', async () => {
      const result = await uut.tusEventHandler()

      assert.equal(result, false)
    })
  })

  // describe('#POST /relays', () => {
  //   it('should return 422 status on biz logic error', async () => {
  //     try {
  //       // Force an error
  //       sandbox.stub(uut.adapters.ipfs, 'getRelays').rejects(new Error('test error'))
  //
  //       await uut.getRelays(ctx)
  //
  //       assert.fail('Unexpected result')
  //     } catch (err) {
  //       assert.equal(err.status, 422)
  //       assert.include(err.message, 'test error')
  //     }
  //   })
  //
  //   it('should return 200 status on success', async () => {
  //     // Mock dependencies
  //     sandbox.stub(uut.adapters.ipfs, 'getRelays').resolves({ a: 'b' })
  //
  //     await uut.getRelays(ctx)
  //     // console.log('ctx.body: ', ctx.body)
  //
  //     assert.property(ctx.body, 'relays')
  //     assert.equal(ctx.body.relays.a, 'b')
  //   })
  // })
  //
  // describe('#POST /connect', () => {
  //   it('should return 422 status on biz logic error', async () => {
  //     try {
  //       // Force an error
  //       sandbox.stub(uut.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs, 'connectToPeer').rejects(new Error('test error'))
  //
  //       ctx.request.body = {
  //         multiaddr: '/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu'
  //       }
  //
  //       await uut.connect(ctx)
  //
  //       assert.fail('Unexpected result')
  //     } catch (err) {
  //       assert.equal(err.status, 422)
  //       assert.include(err.message, 'test error')
  //     }
  //   })
  //
  //   it('should return 200 status on success', async () => {
  //     // Mock dependencies
  //     sandbox.stub(uut.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs, 'connectToPeer').resolves({ success: true })
  //
  //     ctx.request.body = {
  //       multiaddr: '/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu'
  //     }
  //
  //     await uut.connect(ctx)
  //     // console.log('ctx.body: ', ctx.body)
  //
  //     assert.property(ctx.body, 'success')
  //     assert.equal(ctx.body.success, true)
  //   })
  // })
  //
  // describe('#handleError', () => {
  //   it('should still throw error if there is no message', () => {
  //     try {
  //       const err = {
  //         status: 404
  //       }
  //
  //       uut.handleError(ctx, err)
  //     } catch (err) {
  //       assert.include(err.message, 'Not Found')
  //     }
  //   })
  //
  //   it('should throw error with message', () => {
  //     try {
  //       const err = {
  //         status: 422,
  //         message: 'test error'
  //       }
  //
  //       uut.handleError(ctx, err)
  //     } catch (err) {
  //       assert.include(err.message, 'test error')
  //     }
  //   })
  // })
})
