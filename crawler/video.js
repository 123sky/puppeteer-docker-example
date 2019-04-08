const puppeteer = require('puppeteer')
const log4js = require('log4js')

log4js.configure({
  appenders: {
    out: {
      type: 'stdout'
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
})

const logger = log4js.getLogger('things')

const BASE_URL = `https://movie.douban.com/subject/`

const sleep = time =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })

process.on('message', async function(movies) {
  const launchOptions = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    dumpio: false
  }
  if (process.env.NODE_ENV === 'production') {
    launchOptions.executablePath = '/usr/bin/chromium-browser'
  }
  const browser = await puppeteer.launch(launchOptions)
  const page = await browser.newPage()

  for (let index = 0; index < movies.length; index++) {
    const movie = movies[index]

    // 获取视频页面，视频封面图
    const url = BASE_URL + movie.doubanId
    logger.info('opening ' + url)
    await page.goto(url, {
      waitUntil: 'networkidle2'
    })
    await sleep(1000)
    const result = await page.evaluate(() => {
      const $ = window.$
      const items = Array.from($('.related-pic-bd li')) || []
      const result = {
        videos: [],
        pictures: []
      }

      items.forEach(item => {
        const it = $(item)

        // 预告片
        const trailer = it.find('.related-pic-video')
        if (trailer && trailer.length > 0) {
          const $t = $(trailer[0])
          const link = $t.attr('href')
          const cover = $t
            .attr('style')
            .replace('background-image:url(', '')
            .replace(')', '')
          result.videos.push({
            link,
            cover
          })
        }

        // 图片
        const picture = it.find('img')
        if (picture && picture.length > 0) {
          const $p = $(picture[0])
          result.pictures.push($p.attr('src'))
        }
      })

      return result
    })

    // 获取视频地址
    const videos = []
    for (let index = 0; index < result.videos.length; index++) {
      const video = result.videos[index]
      await page.goto(video.link, {
        waitUntil: 'networkidle2'
      })
      await sleep(1000)

      const url = await page.evaluate(() => {
        const $ = window.$
        return $('source').attr('src')
      })

      videos.push({
        video: url,
        cover: video.cover
      })
    }

    const data = {
      videos,
      pictures: result.pictures,
      movie
    }

    process.send(data)
  }

  browser.close()
  process.exit(0)
})
