#!/usr/bin/env node
// use this shebang line https://stackoverflow.com/a/66316262/12539782

/**
 * I GIVE UP TO WORK ON IT, useless
 */

/**
 * Code logic:
 * 1. Get files list
 * 2. Put this list into a *.org file with some extra characters
 */
import fs from "fs"
import fetch from "node-fetch"

const dir = "./content/posts";
const res = await fetch("https://tianheg.xyz/posts/")
const blogHtml = await res.text()

console.log(blogHtml.split("><"))

fs.readdir(dir, (err, files) => {
	if (err) {
		throw err;
	}
	let newFilesList = [];
	files.forEach((file) => {
		if (file.slice(-3) === ".md") {
			newFilesList.push(file.slice(0, -3));
			// console.log(file);
		} else {
			newFilesList.push(file.slice(0, -4));
		}
	});
	// console.log(newFilesList);
  // console.log(newFilesList.map(file => `### [](/posts/${file}/)`))
});
