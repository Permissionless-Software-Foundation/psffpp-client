/*
  Unit tests for the IPFS Adapter.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
// import cloneDeep from 'lodash.clonedeep'

// Local libraries
import TUS from '../../../src/adapters/tus-node-server.js'
// import config from '../../../config/index.js'
// import createHeliaLib from '../mocks/helia-mock.js'

// config.isProduction =  true;
describe('#Tus-node-server-adapter', () => {
  let uut
  let sandbox
  // let ipfs

  beforeEach(() => {
    uut = new TUS()

    // ipfs = cloneDeep(createHeliaLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#server', () => {
    it('should return false on error', async () => {
      uut.filesPath = 4

      const result = await uut.server()

      assert.equal(result, false)
    })

    it('should return an instance of the tus server', async () => {
      const result = await uut.server()
      // console.log('result: ', result)

      // Assert result has properties consistent with a tus server.
      assert.property(result, '_events')
      assert.property(result, 'handlers')
    })
  })
})
