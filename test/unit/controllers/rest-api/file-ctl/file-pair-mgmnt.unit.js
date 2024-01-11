/*
  Unit tests for the file-pair-mgmnt.js library
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import cloneDeep from 'lodash.clonedeep'

// Local libraries
import FilePairMgmnt from '../../../../../src/controllers/rest-api/file-ctl/file-pair-mgmnt.js'
import adapters from '../../../mocks/adapters/index.js'
import mockDataLib from '../../../mocks/controllers/file-pair-mock.js'
import { MockBchWallet } from '../../../mocks/wallet.js'

describe('#FilePairMgmnt', () => {
  let uut
  let sandbox
  let mockData

  beforeEach(() => {
    uut = new FilePairMgmnt({ adapters })

    sandbox = sinon.createSandbox()

    mockData = cloneDeep(mockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new FilePairMgmnt()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating FilePairMgmnt Controller.'
        )
      }
    })
  })

  describe('#getPair', () => {
    it('should return a file pair given the serial number', async () => {
      const sn = 77702
      uut.allPairs.push(mockData.filePair01)

      // Mock dependencies and force desired code path
      sandbox.stub(uut.axios, 'get').resolves({ data: mockData.pairQuery01 })

      const result = await uut.getPair(sn)
      // console.log('result: ', result)

      assert.equal(result.dataPinned, false)
    })

    it('should return false if pair can not be found', async () => {
      const result = await uut.getPair(1234)
      // console.log('result: ', result)

      assert.equal(result, false)
    })

    it('should catch, report, and throw errors', async () => {
      try {
        const sn = 77702
        uut.allPairs.push(mockData.filePair01)

        // Mock dependencies and force desired code path
        sandbox.stub(uut.axios, 'get').rejects(new Error('test error'))

        await uut.getPair(sn)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#addFile', () => {
    it('should add a file to the filePair array', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.fs, 'createReadStream').returns({})
      sandbox.stub(uut.adapters.ipfs.ipfs.fs, 'addFile').resolves('bafkreih7eeixbkyvabqdde4g5mdourjidxpsgf6bgz6f7ouxqr24stg6f4')
      sandbox.stub(uut, 'createPinClaim').resolves()

      const result = await uut.addFile(mockData.addFileIn01)
      // console.log('result: ', result)

      assert.equal(result, true)
    })

    it('should throw an error fileSizeInMegabytes property is not included', async () => {
      try {
        await uut.addFile()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'File object input must contain a fileSizeInMegabytes property')
      }
    })

    it('should throw an error desiredFileName property is not included', async () => {
      try {
        await uut.addFile({ fileSizeInMegabytes: 100 })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'File object input must contain a desiredFileName property')
      }
    })

    it('should throw an error sn property is not included', async () => {
      try {
        await uut.addFile({ fileSizeInMegabytes: 100, desiredFileName: 'test.txt' })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'File object input must contain a sn (serial number) property')
      }
    })

    it('should throw an error if file is over 1 MB', async () => {
      try {
        mockData.addFileIn01.fileSizeInMegabytes = 1.2

        await uut.addFile(mockData.addFileIn01)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'File size is over 1 MB')
      }
    })
  })

  describe('#addFileToIpfs', () => {
    it('should add file to IPFS and return CID', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.fs, 'createReadStream').resolves({})
      sandbox.stub(uut.adapters.ipfs.ipfs.fs, 'addFile').resolves(mockData.filePair01.cid)
      sandbox.stub(uut, 'createPinClaim').resolves()

      const result = await uut.addFileToIpfs(mockData.filePair01)

      assert.equal(result, mockData.filePair01.cid)
    })

    it('should catch and report errors, and return false', async () => {
      // Force error
      sandbox.stub(uut.fs, 'createReadStream').rejects(new Error('test error'))

      const result = await uut.addFileToIpfs(mockData.filePair01)

      assert.equal(result, false)
    })
  })

  describe('#createPinClaim', () => {
    it('should publish a pin claim on the blockchain', async () => {
      // Mock dependencies and force desired code path
      uut.SlpWallet = MockBchWallet
      // sandbox.stub(uut.)

      const inObj = {
        wif: 'L1qLNxN8QS3kPs8UZ5doJsVngP9Qh7dX9qZymSJeZAHX92RQXPkK',
        cid: 'bafkreih7eeixbkyvabqdde4g5mdourjidxpsgf6bgz6f7ouxqr24stg6f4',
        filename: 'test.txt'
      }

      const result = await uut.createPinClaim(inObj)
      // console.log('result: ', result)

      assert.equal(result, 'fake-txid')
    })

    it('should catch, report, and throw errors', async () => {
      try {
        uut.SlpWallet = class SlpWallet { constructor () { throw new Error('test error') }}

        await uut.createPinClaim()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'test error')
      }
    })
  })
})
