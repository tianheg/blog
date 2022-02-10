const fs = require("fs");

const dir = "./org/";

/**
 * Load JSON + Update files' date
 */
fs.readFile("./scripts/blogs.json", "utf8", (err, data) => {
  if (err) {
    console.log(`Error reading file from disk: ${err}`);
  } else {
    const databases = JSON.parse(data);
    console.log(databases[0].link.split("/")[1].split(".")[0]);
    fs.readdir(dir, (err, files) => {
      // console.log(typeof files);
      for (let j = 0; j < databases.length; ++j) {
        for (let i = 0; i < files.length; ++i) {
          if (
            files[i].split(".")[0] ===
            databases[j].link.split("/")[1].split(".")[0]
          ) {
            console.log(`Find It! Id is ${j}`);
            // console.log(databases[j]);
            fs.readFile(dir + files[i], "utf8", (err, data) => {
              const dayOfWeekName = new Date(databases[j].date).toLocaleString(
                "default",
                {
                  weekday: "short",
                }
              );
              let updateContent = data.replace(
                "2022-02-10 Thu",
                `${databases[j].date} ${dayOfWeekName}`
              );
              fs.writeFile(
                dir + files[i],
                updateContent,
                "utf8",
                function (err) {
                  if (err) return console.log(err);
                }
              );
            });
          }
        }
      }
    });

    for (let i = 0; i < databases.length; ++i) {
      // console.log(typeof databases);
    }
  }
});
