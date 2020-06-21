const express = require('express')
const mongoclient = require('mongodb').MongoClient
const fs = require('fs')
const config = require('./config.json')

const app = express()

function getTemplate (path, p) {
  const template = fs.readFileSync(path)
  return new Function('p',`return \`${template}\``)(p)
}

app.use(express.static('public'))

app.get('/', async (req, res) => {
  const client = new mongoclient(config.mongodb.url, config.mongodb.opts)
  await client.connect()
  const db = client.db(config.mongodb.db)

  let page = getTemplate('./resources/views/head.tpl')
  page += getTemplate('./resources/views/header.tpl')

  const itemcount = await db.collection('items').countDocuments()

  page += getTemplate('./resources/views/home.tpl', {"itemcount": itemcount})
  page += getTemplate('./resources/views/foot.tpl')

  client.close()
  res.send(page)
})

app.get('/item/:itemid', (req, res) => {
  res.send(req.params.itemid)
})

app.get('/access', (req, res) => {
  res.send('access')
})

app.get('/users', (req, res) => {
  res.send('users')
})

app.get('/user/:userid', (req, res) => {
  res.send(req.params.userid)
})

app.get('/submit', (req, res) => {
  res.send('submit')
})

app.get('/items/(:tags)?(/:page)?', async (req, res) => {
  const client = new mongoclient(config.mongodb.url, config.mongodb.opts)
  await client.connect()
  const db = client.db(config.mongodb.db)

  var filters
  var query = '.find(queryobj)'
  var queryobj = {}
  if (req.params.tags) {
    filters = req.params.tags.split('+')
    queryobj.tags = { $all: filters}
  }
  if (Number.isInteger(Number(req.params.page)) && Number(req.params.page) >= 0) {
    query += `.skip(${req.params.page * 10})`
  }
  query += '.limit(10).toArray()'

  const results = (await eval(`db.collection('items')${query}`))

  let page = getTemplate('./resources/views/head.tpl')
  page += getTemplate('./resources/views/header.tpl')
  page += getTemplate('./resources/views/itemsearch.tpl')

  results.forEach(result => {
    const link = `/item/${result._id}`
    let tagfrag = '<ul class="searchtags">'
    result.tags.forEach(tag => {
      tagfrag += `<li>${tag}</li>`
    })
    tagfrag += '</ul>'

    page += getTemplate('./resources/views/itemresult.tpl', {"link": link, "text": result.name, "url": result.url, "tags": tagfrag})
  })

  page += getTemplate('./resources/views/itempagination.tpl')
  page += getTemplate('./resources/views/foot.tpl')

  res.send(page)
})

app.listen(3000)
