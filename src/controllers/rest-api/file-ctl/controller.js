/*
  /files REST Controller.

  Tus code examples:
  https://socket.dev/npm/package/@tus/server#events
*/

// Global npm libraries
// import { EVENTS } from 'tus-node-server'
import fs from 'fs'
import { Server, EVENTS } from '@tus/server'
import { FileStore } from '@tus/file-store'
import * as url from 'url'

// Local libraries
import { FilePairMgmnt } from './file-pair-mgmnt.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

let _this

class FilesController {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /files REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /files REST Controller.'
      )
    }

    // Encapsulate dependencies
    this.tus = this.adapters.tus
    this.fs = fs
    this.filePairMgmnt = new FilePairMgmnt(localConfig)

    // Attach Tus file upload server
    const filePath = `${__dirname}../../../../files`
    this.tusServer = new Server({
      path: '/files',
      datastore: new FileStore({ directory: filePath }),
      respectForwardedHeaders: true
    })

    this.tusServer.on(EVENTS.POST_FINISH, this.tusEventHandler)

    // Bind 'this' object to each subfunction.
    this.addFile = this.addFile.bind(this)
    this.fileStatus = this.fileStatus.bind(this)
    this.tusEventHandler = this.tusEventHandler.bind(this)

    _this = this
  }

  // async addFile(ctx) {
  //   return this.tusServer.handle(ctx.req, ctx.res)
  // }

  // Handles the file upload.
  async addFile (ctx) {
    return this.tusServer.handle(ctx.req, ctx.res)
  }

  async tusEventHandler (req, res, upload) {
    try {
      // console.log('req: ', req)
      // console.log('res: ', res)
      console.log('upload: ', upload)

      console.log('Upload Completed!')
      // console.log('event: ', event)
      const fileName = upload.id

      const wif = upload.metadata.wif

      // Generate a safe filename based on the files original filename
      // let desiredFileName = metad.filename.decoded
      let desiredFileName = upload.metadata.filename
      desiredFileName = desiredFileName.replace(/\s+/g, '-').toLowerCase()

      // Rename the file back to the original filename.
      const filePath = `${__dirname}../../../../files`
      _this.fs.renameSync(
        `${filePath}/${fileName}`,
        `${filePath}/${desiredFileName}`
      )

      // Figure out the size of the file
      const stats = _this.fs.statSync(`${filePath}/${desiredFileName}`)
      const fileSizeInBytes = stats.size
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
      console.log(`File size in megabytes: ${fileSizeInMegabytes}`)

      // Pass the file to the
      const fileObj = {
        desiredFileName,
        // sn: metad.sn.decoded,
        sn: upload.metadata.sn,
        fileSizeInMegabytes,
        wif
      }
      _this.filePairMgmnt.addFile(fileObj)

      return true
    } catch (err) {
      console.error(
        'Error in modules/files/controller.js Upload Complete event handler.'
      )
      console.log('Error: ', err)

      // Do not throw error.
      return false
    }
  }

  // Check the status of a file upload
  async fileStatus (ctx) {
    try {
      const sn = ctx.params.sn
      // console.log('fileStatus() sn: ', sn)

      const fileStatus = await this.filePairMgmnt.getPair(sn)
      console.log('fileStatus: ', fileStatus)

      ctx.body = {
        success: true,
        fileStatus
      }
    } catch (err) {
      console.error('Error in fileStatus(): ', err)
      ctx.throw(422, err.message)
    }
  }
}

// module.exports = FilesController
export default FilesController
