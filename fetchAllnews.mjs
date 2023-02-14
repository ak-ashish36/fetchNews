import fetch from 'node-fetch';
import fs from 'fs';
import { parse as json2csv } from "json2csv";
import createCsvParser from "csv-parser";

let category = ["india", "technology", "attack", "police", "government", "officials", "incident", "accident", "authorities", "murder", "death"];
let fields = ["title", "text", "subject", "date", "label"];
let rows = [];

let totalResults = 0;
let currentResults = 0;
const fetchApi = async (subject, page, articles) => {
  let data = await fetch(`https://newsapi.org/v2/everything?q=${subject}&sortBy=popularity&apiKey=263a980ad1c641d89022c4c2db5c4b99&page=${page}`)
  let parsed = await data.json();
  totalResults = parsed.totalResults;
  currentResults += parsed.articles.length;
  return articles.concat(parsed.articles);
}
const fetchnews = async (subject) => {
  let page = 1;
  let articles = [];
  do {
    try {
      articles = await fetchApi(subject, page++, articles);
    } catch (err) {
      console.log(`Error encountered in page ${page} while fecthing ${subject} news`);
      break;
    }
    if (page > 5) {
      break;
    }
  }
  while (currentResults < totalResults) {
  }
  console.log(currentResults);
  currentResults = 0, totalResults = 0;
  for (let i = 0; i < articles.length; i++) {
    let newsData = { "title": "", "text": "", "subject": "", "date": "", "label": 1 };
    try {
      let title = await articles[i].title;
      let text = await articles[i].description;
      let date = await articles[i].publishedAt.substring(0, 10);
      if (title === null) { title = "" }
      if (text === null) { text = "" }
      if (date === null) { date = "" }
      newsData.title = title;
      newsData.text = text;
      newsData.subject = subject;
      newsData.date = date;
      rows.push(newsData);
    } catch (err) {
      console.log(`Error encountered in ${subject} , index: ${i}`)
      console.error(err);
    }
  }
}

const writeAppend = async (filename, fields, data) => {
  let rows;
  if (!fs.existsSync(filename)) {
    rows = json2csv(data, { header: true });
  } else {
    rows = json2csv(data, { header: false });
  }
  fs.appendFileSync(filename, rows);
  fs.appendFileSync(filename, "\r\n");
}

const writeNew = async (filename, fields, data) => {
  let rows;
  rows = json2csv(data, { header: true });
  // Append file function can create new file too.
  fs.writeFileSync(filename, rows);
  // Always add new line if file already exists.
  fs.appendFileSync(filename, "\r\n");
}

const Fetch = async () => {
  for (var i = 0; i < category.length; i++) {
    console.log(`Fetching ${category[i]} News....`)
    await fetchnews(category[i]);
  }
}
await Fetch();
if (rows.length !== 0) {
  await writeAppend('News.csv', fields, rows);
  console.log("News Added to News.csv")
} else {
  console.log("No news to add")
}

const results = [];
const set = new Set();

fs.createReadStream('News.csv')
    .pipe(createCsvParser())
    .on('data', (data) => {
      let subject=data.subject;
      data.subject="";
      const dataAsString = JSON.stringify(data);
      if (!set.has(dataAsString)) {
        set.add(dataAsString);
        data.subject=subject;
        results.push(data);
      }
    })
    .on('end', () => {
      console.log("Removing Duplicates");
      writeNew('News.csv', fields, results);
      console.log("Duplicates Removed");
    })





