/*
  /files REST Controller.
*/

// Global npm libraries
import { EVENTS } from 'tus-node-server'
import fs from 'fs'

// Local libraries
import FilePairMgmnt from './file-pair-mgmnt.js'

class FilesController {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /files REST Controller.'
      )
    }

    // Encapsulate dependencies
    this.tus = this.adapters.tus
    this.fs = fs
    this.filePairMgmnt = new FilePairMgmnt(localConfig)

    // Bind 'this' object to each subfunction.
    this.addFile = this.addFile.bind(this)
  }

  // Handles the file upload.
  async addFile (ctx) {
    const tusServer = await this.tus.server()
    if (!tusServer) ctx.throw(500)

    // Event triggers after file upload is complete.
    tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, async event => {
      try {
        console.log('Upload Completed!')
        console.log('event: ', event)
        const fileName = event.file.id

        const metad = await this.tus.parseMetadataString(event.file.upload_metadata)
        console.log('metad: ', metad)
        console.log(metad.filename.decoded)
        const wif = metad.wif.decoded

        // Generate a safe filename based on the files original filename
        let desiredFileName = metad.filename.decoded
        desiredFileName = desiredFileName.replace(/\s+/g, '-').toLowerCase()

        this.fs.renameSync(
          `files/${fileName}`,
          `files/${desiredFileName}`
        )

        // Figure out the size of the file
        const stats = this.fs.statSync(`files/${desiredFileName}`)
        const fileSizeInBytes = stats.size
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
        console.log(`File size in megabytes: ${fileSizeInMegabytes}`)

        const fileObj = {
          desiredFileName,
          sn: metad.sn.decoded,
          fileSizeInMegabytes,
          wif
        }
        this.filePairMgmnt.addFile(fileObj)
      } catch (err) {
        console.error(
          'Error in modules/files/controller.js Upload Complete event handler.'
        )
        console.log('Error: ', err)
      }
    })

    return tusServer.handle(ctx.req, ctx.res)
  }
}

// module.exports = FilesController
export default FilesController
