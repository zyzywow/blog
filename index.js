const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const multer = require("multer");

const cloudinary = require("cloudinary");
// const db = require("./routes/db");

const MongoClient = require("mongodb").MongoClient;
const htmlParser = require("node-html-parser");

let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false })); // post에서 보낸 데이터 req.body로 받을려면 있어야함
app.use(express.static(path.join(__dirname, "/public")));
app.use("/upload", express.static(path.join(__dirname, "/upload")));
app.set("port", process.env.PORT || 8099);
const PORT = app.get("port");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, done) => {
    done(null, path.join(__dirname, "/upload"));
  },
  filename: (req, file, done) => {
    done(null, file.originalname);
  },
});

const fileUpload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index", { title: "가나다라마바사" });
});
app.get("/insert", (req, res) => {
  res.render("insert", { title: "글 쓰기" });
});
app.post("/register", fileUpload.single("image"), (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const category = Array.isArray(req.body.category) ? req.body.category.join(" ") : req.body.category;
  const desc = req.body.desc;
  const point = req.body.point;
  const image = req.file.filename;
  cloudinary.uploader.upload(req.file.path, (result) => {
    console.log(db.collection("blog"));
    db.collection("blog").insertOne({
      title: title,
      date: date,
      category: category,
      desc: desc,
      point: point,
      image: result.url,
    });
    res.send("잘들어갔습니다.");
  });
});

app.get("/list", (req, res) => {
  db.collection("blog")
    .find()
    .toArray((err, result) => {
      res.render("list", { title: "list", list: result });
    });
});
app.get("/detail/:title", (req, res) => {
  const title = req.params.title;
  db.collection("blog").findOne({ title: title }, (err, result) => {
    if (result) {
      res.render("detail", { title: "detail", data: result });
    }
  });
});
app.post("/summerNoteInsertImg", fileUpload.single("summerNoteImg"), (req, res) => {
  cloudinary.uploader.upload(req.file.path, (result) => {
    res.json({ cloudinaryImgSrc: result.url });
  });
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 서버 대기중5`);
});
