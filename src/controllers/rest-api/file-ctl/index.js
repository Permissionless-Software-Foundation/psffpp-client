// Public npm libraries.
import Router from 'koa-router'

// Local libraries.
import FilesRESTControllerLib from './controller.js'

class FilesRouter {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating PostEntry REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating PostEntry REST Controller.'
      )
    }

    const dependencies = {
      adapters: this.adapters,
      useCases: this.useCases
    }

    // Encapsulate dependencies.
    this.filesRESTController = new FilesRESTControllerLib(dependencies)

    // Instantiate the router and set the base route.
    const baseUrl = '/files'
    this.router = new Router({ prefix: baseUrl })

    this.attach = this.attach.bind(this)
  }

  attach (app) {
    if (!app) {
      throw new Error(
        'Must pass app object when attaching REST API controllers.'
      )
    }

    // Define the routes and attach the controller.
    this.router.post('/', this.filesRESTController.addFile)
    this.router.patch('/:id', this.filesRESTController.addFile)
    this.router.get('/status/:sn', this.filesRESTController.fileStatus)

    // Attach the Controller routes to the Koa app.
    app.use(this.router.routes())
    app.use(this.router.allowedMethods())
  }
}

// module.exports = FilesRouter
export default FilesRouter
