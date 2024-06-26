import { createApi } from "unsplash-js";
import fetch from "node-fetch";
import express from "express";
import serverless from "serverless-http";

const unsplash = createApi({
  accessKey: process.env.ACCESS_KEY,
  fetch,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/.netlify/functions/unsplash/", async (req, res) => {
  try {
    const response = await unsplash.photos.getRandom();
    const imageUrl = response.response.urls.regular;
    res.send(`<img src="${imageUrl}">`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the image.");
  }
});

app.listen(PORT, () => {
  console.log(`Unsplash app listening on port ${PORT}`);
});

exports.handler = serverless(app);
