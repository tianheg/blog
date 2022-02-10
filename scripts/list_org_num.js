const fs = require("fs");

const dir = "./org/";

fs.readdir(dir, (err, files) => {
  if (err) {
    throw err;
  }

  files.forEach((file) => {
    console.log(file);
  });
});
