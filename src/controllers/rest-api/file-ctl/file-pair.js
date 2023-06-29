/*
  This library tracks pairs of files. When an image is uploaded to the server,
  both the original and a thumbnail are uploaded. This class library tracks
  this pair of files. After both files have been recieved, the `bothFilesSeen`
  flag is set.

  This class implements the following filter
  - If the file is under 1MB, and the filename does not include 'thumbnail', then upload the image.
  - If the file is over 1MB, and the filename does not include 'thumbnail', then do not upload the image.
  - if the original file is too big, and the thumbnail is under 1 MB, then upload the thumbnail.
  - If the thumbnail is bigger than 1MB, then throw an error
*/

class FilePair {
  constructor (inObj = {}) {
    const { fileSizeInMegabytes, desiredFileName } = inObj

    // Input validation
    if (!fileSizeInMegabytes) {
      throw new Error('File object input must contain a fileSizeInMegabytes property')
    }
    if (!desiredFileName) {
      throw new Error('File object input must contain a desiredFileName property')
    }

    // State
    this.isOver1MB = false
    this.sn = 0
  }
}

export default FilePair
