import fetch from 'node-fetch';
import fs from 'fs';
import { parse as json2csv } from "json2csv";
import createCsvParser from "csv-parser";

let news = ["general", "business", "entertainment", "health", "science", "sports", "technology"];

let category = ["general", "business", "entertainment", "health", "science", "sports", "technology"];
let fields = ["title", "text", "subject", "date", "label"];
let rows = [];

const fetchnews = async (subject) => {
  let parsedData
  try {
    let data = await fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${subject}&apiKey=a69d759565f04901bb33ff3f4594ab39&pageSize=100`)
    parsedData = await data.json();
    // data = JSON.stringify(parsedData);
    console.log(parsedData.articles.length)
  }
  catch (err) {
    console.log(`Error in fetching ${subject} news`)
    return;
  }
  for (let i = 0; i < parsedData.articles.length; i++) {
    let newsData = { "title": "", "text": "", "subject": "", "date": "", "label": 1 };
    try {
      let title = await parsedData.articles[i].title;
      let text = await parsedData.articles[i].description;
      let date = await parsedData.articles[i].publishedAt.substring(0, 10);
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
  // output file in the same folder
  // const filename = path.join(__dirname, 'CSV', `${fileName}`);
  let rows;
  // If file doesn't exist, we will create new file and add rows with headers.    
  if (!fs.existsSync(filename)) {
    rows = json2csv(data, { header: true });
  } else {
    // Rows without headers.
    rows = json2csv(data, { header: false });
  }

  // Append file function can create new file too.
  fs.appendFileSync(filename, rows);
  // Always add new line if file already exists.
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
  for (var i = 0; i < 7; i++) {
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
    let subject = data.subject;
    data.subject = "";
    const dataAsString = JSON.stringify(data);
    if (!set.has(dataAsString)) {
      set.add(dataAsString);
      data.subject = subject;
      results.push(data);
    }
  })
  .on('end', () => {
    console.log("Removing Duplicates");
    writeNew('News.csv', fields, results);
    console.log("Duplicates Removed");
  })


