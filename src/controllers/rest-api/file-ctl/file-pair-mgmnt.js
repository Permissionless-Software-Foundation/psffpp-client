/*
  This library manages file pairs
*/

// Global npm libraries
import SlpWallet from 'minimal-slp-wallet'
import fs from 'fs'
import axios from 'axios'

// Local libraries
import config from '../../../../config/index.js'

class FilePairMgmnt {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating FilePairMgmnt Controller.'
      )
    }

    // Encapsulate dependencies
    this.axios = axios
    this.config = config
    this.fs = fs
    this.SlpWallet = SlpWallet

    // State
    this.sn = 0
    this.allPairs = []
    this.hasOriginal = false
    this.hasThumbnail = false
    this.useThumbnail = false

    // Bind 'this' object to all subfunctions
    this.addFile = this.addFile.bind(this)
    this.addFileToIpfs = this.addFileToIpfs.bind(this)
    // this.checkPairs = this.checkPairs.bind(this)
    this.getPair = this.getPair.bind(this)

    // this.checkPairInterval = setInterval(this.checkPairs, 60000 * 10)
  }

  // Called by a timer interval to display data about pairs.
  // checkPairs () {
  //   try {
  //     // console.log('this.allPairs: ', this.allPairs)
  //
  //     const now = new Date()
  //
  //     console.log(`Heartbeat: ${now.toLocaleString()}, Number of file uploaded: ${this.allPairs.length}`)
  //   } catch (err) {
  //     console.error('Error in checkPairs()')
  //     throw err
  //   }
  // }

  // Get the status of an file-upload pair. This used by the REST API to get
  // the status of pinning the file.
  async getPair (sn) {
    try {
      console.log('getPair() sn: ', sn)

      let pairFound = false

      for (let i = 0; i < this.allPairs.length; i++) {
        const thisPair = this.allPairs[i]
        const thisSn = parseInt(thisPair.sn)
        // console.log('thisSn: ', thisSn)
        // console.log('typeof sn: ', typeof sn)
        // console.log('typeof thisSn: ', typeof thisSn)

        if (thisSn === parseInt(sn)) {
          // console.log('Pair found!')

          pairFound = thisPair

          break
        }
      }
      console.log('pairFound: ', pairFound)

      if (!pairFound.cid) return pairFound

      // Get the pin status from ipfs-file-pin-service
      // const result = await axios.get(`http://localhost:5031/ipfs/pin-status/${pairFound.cid}`)
      const result = await this.axios.get(`${this.config.filePinServer}/ipfs/pin-status/${pairFound.cid}`)

      // Display result on command line, but reduce screen spam.
      try {
        result.data.pobTxDetails = result.data.pobTxDetails.txid
        result.data.claimTxDetails = result.data.claimTxDetails.txid
        console.log('result.data2: ', result.data)
      } catch(err) { /* exit quietly */ }


      pairFound.dataPinned = result.data.dataPinned

      return pairFound
    } catch (err) {
      console.error('Error in getPair()')
      throw err
    }
  }

  // Add a file to the pair
  addFile (inObj = {}) {
    try {
      console.log('addFile() inObj: ', inObj)

      const { fileSizeInMegabytes, desiredFileName, sn } = inObj

      // Input validation
      if (!fileSizeInMegabytes) {
        throw new Error('File object input must contain a fileSizeInMegabytes property')
      }
      if (!desiredFileName) {
        throw new Error('File object input must contain a desiredFileName property')
      }
      if (!sn) {
        throw new Error('File object input must contain a sn (serial number) property')
      }

      // Create a new File Pair
      const thisPair = new FilePair(inObj)
      console.log('new file pair created: ', thisPair)

      if (fileSizeInMegabytes > 1) {
        throw new Error('File size is over 1 MB')
      }

      thisPair.originalFile = inObj
      thisPair.originalFile.isThumbnail = false
      thisPair.originalFile.isOver1MB = false

      console.log('upload complete for this file pair: ', thisPair)

      const cid = this.addFileToIpfs(thisPair)
      thisPair.cid = cid

      this.allPairs.push(thisPair)

      return true
    } catch (err) {
      console.error('Error in addPair(): ', err)
      throw err
    }
  }

  // Instruct the IPFS node to add the selected file to IPFS, so that it can
  // be downloaded and pinned by the pinning cluster.
  async addFileToIpfs (filePair) {
    try {
      console.log('file-pair-mgmnt.js/addFileToIpfs() ready to upload file')
      console.log('filePair: ', filePair)

      const path = `files/${filePair.originalFile.desiredFileName}`

      const filename = filePair.originalFile.desiredFileName

      const readableStream = this.fs.createReadStream(path)

      const fileObj = {
        path,
        // content: globSource(`/home/trout/work/psf/code/p2wdb-image-upload-backend/files/${filePair.originalFile.desiredFileName}`, { recursive: true})
        content: readableStream
      }
      // console.log('fileObj: ', fileObj)

      const options = {
        cidVersion: 1,
        wrapWithDirectory: true
      }

      const fileData = await this.adapters.ipfs.ipfs.fs.addFile(fileObj, options)
      console.log('fileData: ', fileData)

      const cid = fileData.toString()
      console.log(`File added with CID: ${cid}`)

      const wif = filePair.originalFile.wif

      filePair.cid = cid

      console.log(`Ready to write CID ${cid} to blockchain for pinning.`)

      // await this.pinCid({ cid, wif, filePair })

      // Generate a pin claim on the blockchain.
      await this.createPinClaim({ cid, wif, filename })

      return cid
    } catch (err) {
      console.error('Error in addFileToIpfs(): ', err)

      // Do not throw errors. This is a top-level function.
      return false
    }
  }

  // Create a Pin Claim on the blockchain. This will cause ipfs-file-pin-service
  // instances to download and pin the file.
  async createPinClaim (inObj = {}) {
    try {
      const { cid, wif, filename } = inObj

      // Initialize the wallet
      const bchWallet = new this.SlpWallet(wif, { interface: 'consumer-api' })
      await bchWallet.initialize()

      // Create a proof-of-burn (PoB) transaction
      const WRITE_PRICE = 0.08335233 // Cost in PSF tokens to pin 1MB
      const PSF_TOKEN_ID = '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
      const pobTxid = await bchWallet.burnTokens(WRITE_PRICE, PSF_TOKEN_ID)
      console.log(`Proof-of-burn TX: ${pobTxid}`)

      // Get info and libraries from the wallet.
      const addr = bchWallet.walletInfo.address
      const bchjs = bchWallet.bchjs

      // Get a UTXO to spend to generate the pin claim TX.
      let utxos = await bchWallet.getUtxos()
      utxos = utxos.bchUtxos
      const utxo = bchjs.Utxo.findBiggestUtxo(utxos)

      // instance of transaction builder
      const transactionBuilder = new bchjs.TransactionBuilder()

      const originalAmount = utxo.value
      const vout = utxo.tx_pos
      const txid = utxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // TODO: Compute the 1 sat/byte fee.
      const fee = 500

      // BEGIN - Construction of OP_RETURN transaction.

      // Add the OP_RETURN to the transaction.
      const script = [
        bchjs.Script.opcodes.OP_RETURN,
        Buffer.from('00510000', 'hex'),
        Buffer.from(pobTxid, 'hex'),
        Buffer.from(cid),
        Buffer.from(filename)
      ]

      // Compile the script array into a bitcoin-compliant hex encoded string.
      const data = bchjs.Script.encode(script)

      // Add the OP_RETURN output.
      transactionBuilder.addOutput(data, 0)

      // END - Construction of OP_RETURN transaction.

      // Send the same amount - fee.
      transactionBuilder.addOutput(addr, originalAmount - fee)

      // Create an EC Key Pair from the user-supplied WIF.
      const ecPair = bchjs.ECPair.fromWIF(wif)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`TX hex: ${hex}`);
      // console.log(` `);

      // Broadcast transation to the network
      // const txidStr = await bchjs.RawTransactions.sendRawTransaction(hex)
      const txidStr = await bchWallet.broadcast({ hex })
      console.log(`Claim Transaction ID: ${txidStr}`)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txidStr}`)

      return txidStr
    } catch (err) {
      console.error('Error in file-pair-mgmnt.js/createPinClaim()')
      throw err
    }
  }
}

class FilePair {
  constructor (inObj = {}) {
    const { fileSizeInMegabytes, desiredFileName, sn } = inObj

    // Input validation
    if (!fileSizeInMegabytes) {
      throw new Error('File object input must contain a fileSizeInMegabytes property')
    }
    if (!desiredFileName) {
      throw new Error('File object input must contain a desiredFileName property')
    }
    if (!sn) {
      throw new Error('File object input must contain a sn (serial number) property')
    }

    // State
    // if (desiredFileName.includes('thumbnail')) {
    //   this.thumbnailFile = inObj
    //   this.thumbnailFile.isThubnail = true
    //
    //   this.thumbnailFile.isOver1MB = false
    //   if (fileSizeInMegabytes > 1) this.thumbnailFile.isOver1MB = true
    // } else {
    this.originalFile = inObj
    this.originalFile.isThumbnail = false

    this.originalFile.isOver1MB = false
    if (fileSizeInMegabytes > 1) this.originalFile.isOver1MB = true
    // }

    this.sn = sn
    this.useThumbnail = false
    this.uploadComplete = false
  }
}

export { FilePairMgmnt, FilePair }
