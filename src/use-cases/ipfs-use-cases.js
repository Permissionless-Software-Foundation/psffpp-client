/*
  Use case library for working with IPFS.
*/

// Global npm libraries
import { exporter } from 'ipfs-unixfs-exporter'
import fs from 'fs'

// Local libraries
// import wlogger from '../adapters/wlogger.js'

class IpfsUseCases {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating IPFS Use Cases library.'
      )
    }

    // Bind 'this' object to all class subfunctions.
    this.downloadCid = this.downloadCid.bind(this)
  }

  async downloadCid (inObj = {}) {
    try {
      const { cid, fileName, path } = inObj

      console.log(`downloadFile() retrieving this CID: ${cid}, with fileName: ${fileName}, and path: ${path}`)

      const blockstore = this.adapters.ipfs.ipfs.blockstore
      const entry = await exporter(cid, blockstore)

      console.info(entry.cid) // Qmqux
      console.info(entry.path) // Qmbaz/foo/bar.txt
      console.info(entry.name) // bar.txt
      console.log('entry: ', entry)
      // console.info(entry.unixfs.fileSize()) // 4

      const filePath = `${path}/${fileName}`
      const writableStream = fs.createWriteStream(filePath)

      writableStream.on('error', (error) => {
        console.log(`An error occured while writing to the file. Error: ${error.message}`)
      })

      writableStream.on('finish', () => {
        console.log(`CID ${cid} downloaded to ${filePath}`)
      })

      for await (const buf of entry.content()) {
        writableStream.write(buf)
      }

      writableStream.end()

      return { cid, size: entry.size }
    } catch (err) {
      console.error('Error in ipfs-use-cases.js/downloadCid()')
      throw err
    }
  }
}

export default IpfsUseCases
