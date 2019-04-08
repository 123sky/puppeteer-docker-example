const Koa = require('koa') 
const consola = require('consola') 
const logger = require('koa-logger') 
const getTrailerList = require('./crawler/trailer-list') 

const appLogger = consola.withScope(`APP`)
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3001

;(async () => {

  const app = new Koa()

  app.use(logger())

  app.use(async (ctx, next) => {
    let res = await getTrailerList()
    ctx.body = res
    await next()
  });

  app.listen(port, host, function koaInitEnd() {
    appLogger.start(
      `server is listening at ${host}:${port}`,
      `on mode ${app.env}`
    )
  })
})()
