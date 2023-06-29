
function start() {
  setInterval(function () {
    const now = new Date()
    console.log(`timestamp: ${now.toLocaleString()}`)
  }, 10000)
}
start()
