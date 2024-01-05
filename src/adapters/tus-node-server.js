/*
    This library handles file uploads using the TUS protocol. This is a newer
    protocol which allows file upload with resume.
*/

// Global npm libraries
import tus from 'tus-node-server'

const tusServer = new tus.Server({
  respectForwardedHeaders: true
})

let _this

class TUS {
  constructor (path) {
    // Embed external libraries into the class, for easy mocking.
    this.tusServer = tusServer
    _this = this
    // By default make path an empty string.
    _this.filesPath = ''

    // If user specified a path to use, use that.
    path && path !== ''
      ? (_this.filesPath = path)
      : (_this.filesPath = '/files')
  }

  async server () {
    if (_this.filesPath && typeof _this.filesPath !== 'string') {
      throw new Error('Path must be a string')
    }

    try {
      console.log('_this.filesPath: ', _this.filesPath)

      _this.tusServer.datastore = new tus.FileStore({
        path: _this.filesPath
      })

      return _this.tusServer
    } catch (err) {
      console.error('Error resolving Tus server: ', err)
      return false
    }
  }

  getServer () {
    return _this.tusServer
  }

  // parse metadata from file
  async parseMetadataString (metadataString) {
    const kvPairList = metadataString.split(',')

    return kvPairList.reduce((metadata, kvPair) => {
      const [key, base64Valuse] = kvPair.split(' ')

      metadata[key] = {
        encoded: base64Valuse,
        decoded: Buffer.from(base64Valuse, 'base64').toString('ascii')
      }

      return metadata
    }, {})
  }
}

// module.exports = TUS
export default TUS
