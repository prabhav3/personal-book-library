const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const { error } = require("console");
const req = require("express/lib/request");

const app = express();

const PORT = 3000;

// setup for ejs templating

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// connect to sqlite database

const db = new sqlite3.Database("./db/library.db", (err) => {
  if (err) {
    console.error("Error opening database " + err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// create books table if it doesnt exist

db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    coverImage TEXT
)`);

// routes

// home route

app.get("/", (req, res) => {
  res.render("index");
});

// view all books

app.get("/books", (req, res) => {
  db.all("SELECT * FROM books", [], (err, rows) => {
    if (err) {
      res.status(400).send("Error retrieving books.");
    } else {
      res.render("viewBooks", { books: rows });
    }
  });
});

// add a new book form

app.get("/books/new", (req, res) => {
  res.render("addBook");
});

// add a new book

app.post("/books", (req, res) => {
  const { title, author, description, coverImage } = req.body;
  db.run(
    `INSERT INTO books(title, author, description, coverImage) VALUES (?, ?, ?, ?)`,
  ),
    [title, author, description, coverImage],
    (err) => {
      if (err) {
        res.status(400).send("Error adding book");
      } else {
        res.redirect("/books");
      }
    };
});

// edit a book form

app.get("/books/edit/:id", (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM books WHERE id = ?`, [
    id,
    (err, row) => {
      if (err) {
        res.status(400).send("Error retrieving book");
      } else {
        res.render("editBook", { book: row });
      }
    },
  ]);
});

// update a book

app.post("/books/edit/:id", (req, res) => {
  const { title, author, description, coverImage } = req.body;
  const id = req.params.id;
  db.run(
    `UPDATE books SET title = ?, author = ?, description = ?, coverImage = ? WHERE id = ?`,
    [title, author, description, coverImage, id],
    (err) => {
      if (err) {
        res.status(400).send("Error updating book");
      } else {
        res.redirect("/books");
      }
    },
  );
});

// delete a book

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM books WHERE id = ?`, [id], (err) => {
    if (err) {
      res.status(400).send("Error deleting book");
    } else {
      res.redirect("/books");
    }
  });
});

// search for books

app.get("/search", (req, res) => {
  const query = req.query.q;
  db.all(
    `SELECT * FROM books WHERE title LIKE "" OR author LIKE ?`,
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        res.status(400).send("Error searching books");
      } else {
        res.render("searchResult", { books: rows, query });
      }
    },
  );
});

// start the server

app.listen((PORT) => {
  console.log(`Server is running on http//localhost:${PORT}`);
});
