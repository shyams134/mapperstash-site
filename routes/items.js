const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const config = require('./../config.json')

router.get('/items', async (req, res) => {
  const ItemService = require('../services/items.js')
  const TagService = require('../services/tags.js')

  var querytags, includes, excludes
  if (req.query.tags) {
    querytags = req.query.tags.split(' ')

    ({includes, excludes} = ItemService.querytagsParse(querytags))

    if (includes) {
      includes = await TagService.getIdFromTag(includes)
    }

    if (excludes) {
      excludes = await TagService.getIdFromTag(excludes)
    }
  }

  const itemcount = await ItemService.countQuery(includes, excludes)

  const pagesize = 10
  const currentpage = req.query.page || 1
  const pages = Math.ceil(itemcount / pagesize)

  if (req.query.page) {
    if (!(Number.isInteger(Number(req.query.page))) || req.query.page < 1) return res.send("Error")
  }

  const pageresults = await ItemService.itemQuery(req.query.page, pagesize, includes, excludes)

  res.render('items.ejs', {items: pageresults, lastpage: pages, currentpage: currentpage})
})

module.exports = router
