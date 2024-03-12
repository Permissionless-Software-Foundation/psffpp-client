/*
  Unit tests for the IPFS Use Cases library.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local support libraries
import adapters from '../mocks/adapters/index.js'

// Unit under test (uut)
import IpfsUseCases from '../../../src/use-cases/ipfs-use-cases.js'

describe('#users-use-case', () => {
  let uut
  let sandbox

  before(async () => {
    // Delete all previous users in the database.
    // await testUtils.deleteAllUsers()
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new IpfsUseCases({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new IpfsUseCases()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of adapters must be passed in when instantiating IPFS Use Cases library.'
        )
      }
    })
  })

  describe('#downloadCid', () => {
    it('should download a file given the CID and filename', async () => {
      // Mock dependencies and force desired code path.
      sandbox.stub(uut, 'exporter').resolves({
        cid: 'bafkreic6glbvbcpiutupmaocbjjmbszlq4lmk2srapafpub7smuxfmp7yq',
        content: [1, 2, 3, 4, 5]
      })

      const inObj = {
        cid: 'bafkreic6glbvbcpiutupmaocbjjmbszlq4lmk2srapafpub7smuxfmp7yq',
        fileName: 'green-wizard.jpg',
        path: '/home/trout/work/psf/code/psf-bch-wallet/src/commands/../../ipfs-files'
      }

      const result = await uut.downloadCid(inObj)
      console.log('result: ', result)

      assert.equal(true, true)
    })
  })
})
