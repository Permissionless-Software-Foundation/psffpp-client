/*
  /files REST Controller.
*/

// Global npm libraries
import { EVENTS } from 'tus-node-server'
import fs from 'fs'

class FilesController {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /files REST Controller.'
      )
    }

    this.tus = this.adapters.tus
    this.fs = fs

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
        //   console.log(event)
        const fileName = event.file.id

        const metad = await this.tus.parseMetadataString(event.file.upload_metadata)
        console.log('metad: ', metad)
        console.log(metad.filename.decoded)

        this.fs.renameSync(
          `files/${fileName}`,
          `files/${metad.filename.decoded}`
        )
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
