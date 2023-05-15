import serverless from "serverless-http"
import { createApi } from "unsplash-js";
import express from 'express'

const unsplash = createApi({ accessKey: process.env.ACCESS_KEY, fetch: fetch })

const app = express()
const PORT = 3000

app.get('/.netlify/functions/unsplash/', (req, res) => {
  unsplash.photos.getRandom()
    .then(json => {
      let imageUrl = json.response.urls.regular;
      res.send(`<img src="${imageUrl}">`)
    })
})

app.listen(PORT, () => {
  console.log(`Unsplash app listening on port ${PORT}`)
})

exports.handler = serverless(app)
