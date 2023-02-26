import axios from 'axios'

exports.handler = function (event, context, callback) {
  const apiRoot = 'https://api.unsplash.com'
  const accessKey = process.env.ACCESS_KEY || "AI2MSAoSGIbSoXLxV84Hqe6Z0N-nq2Jf0D4U7ohw5iw"

  const someEndpoint = `${apiRoot}/photos/random?client_id=${accessKey}&count=${10}&collections='3816141,1154337,1254279'`

  axios.get(someEndpoint)
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          images: res.data
        })
      })
    })
}