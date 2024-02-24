/*
  Mocks created for file-pair-mgmnt.unit.js
*/

const filePair01 = {
  originalFile: {
    desiredFileName: '5xji2na4jmodt1sf7ywo--1--79rqt.jpg',
    sn: '77702',
    fileSizeInMegabytes: 0.038466453552246094,
    wif: 'L4jNPkakY9QYnw4dudX6JN3q2WAWGKZzrGcZm3JSGJvDaPspp77i',
    isThumbnail: false,
    isOver1MB: false
  },
  sn: '77702',
  useThumbnail: false,
  uploadComplete: false,
  cid: 'bafkreih7eeixbkyvabqdde4g5mdourjidxpsgf6bgz6f7ouxqr24stg6f4',
  dataPinned: false
}

const pairQuery01 = {
  validClaim: null,
  dataPinned: false,
  _id: '659ebbd87c039200121b7c05',
  proofOfBurnTxid: '855312d06cc827cebbac1ccf3f64152917be4ca9d2286f1760f0bb4b69553153',
  cid: 'bafkreih7eeixbkyvabqdde4g5mdourjidxpsgf6bgz6f7ouxqr24stg6f4',
  filename: '5xji2na4jmodt1sf7ywo--1--79rqt.jpg',
  claimTxid: '0cc31ff9936a7e66e271f04bfc7219199488ca35929ecbba00eeb68a62f8401f',
  pobTxDetails: {},
  claimTxDetails: {}
}

const addFileIn01 = {
  desiredFileName: '5xji2na4jmodt1sf7ywo--1--79rqt.jpg',
  sn: '77702',
  fileSizeInMegabytes: 0.038466453552246094,
  wif: 'L4jNPkakY9QYnw4dudX6JN3q2WAWGKZzrGcZm3JSGJvDaPspp77i'
}

export default {
  filePair01,
  pairQuery01,
  addFileIn01
}
