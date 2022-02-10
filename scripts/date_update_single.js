const fs = require("fs");

const dir = "./org/";

/**
 * Load JSON + Update single_file's date
 */
fs.readFile("./scripts/blogs.json", "utf8", (err, data) => {
  if (err) {
    console.log(`Error reading file from disk: ${err}`);
  } else {
    const databases = JSON.parse(data);
    databases.forEach((db) => {
      if ("12-years-a-slave" == db.link.split("/")[1].split(".")[0]) {
        console.log("Find it!");
        fs.readFile(dir + "12-years-a-slave" + ".org", "utf8", (err, data) => {
          const dayOfWeekName = new Date(db.date).toLocaleString("default", {
            weekday: "short",
          });
          let updateContent = data.replace(
            "2022-02-10 Thu",
            `${db.date} ${dayOfWeekName}`
          );
          fs.writeFile(
            dir + "12-years-a-slave" + ".org",
            updateContent,
            "utf8",
            function (err) {
              if (err) return console.log(err);
            }
          );
        });
      } else {
        console.log("Can't find it");
      }
    });
  }
});
