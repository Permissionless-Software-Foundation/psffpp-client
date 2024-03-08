/*
  This library handles file uploads using the TUS protocol. This is a newer
  protocol which allows file upload with resume.
*/

// Global npm libraries
import tus from 'tus-node-server'

const tusServer = new tus.Server({
  respectForwardedHeaders: true
})

// let _this

class TUS {
  constructor (path) {
    // Embed external libraries into the class, for easy mocking.
    this.tusServer = tusServer
    // _this = this
    // By default make path an empty string.
    this.filesPath = ''

    // If user specified a path to use, use that.
    path && path !== ''
      ? (this.filesPath = path)
      : (this.filesPath = '/files')

    // Bind 'this' object to all subfunctions.
    this.server = this.server.bind(this)
  }

  async server () {
    try {
      if (this.filesPath && typeof this.filesPath !== 'string') {
        throw new Error('Path must be a string')
      }

      console.log('this.filesPath: ', this.filesPath)

      this.tusServer.datastore = new tus.FileStore({
        path: this.filesPath
      })

      return this.tusServer
    } catch (err) {
      console.error('Error resolving Tus server: ', err)
      return false
    }
  }
}

// module.exports = TUS
export default TUS
