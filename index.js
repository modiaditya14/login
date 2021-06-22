/**
 * Library System
 * @todo Make user GUI
 */
const express = require("express")
const { encrypt, decrypt } = require("./crypto")
var bodyParser = require("body-parser")

const db = require("monk")("localhost/libs")

const app = express()

const port = 3000
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
const users = db.get("users")
const books = db.get("books")

let user

app.set("view engine", "ejs")

app.get("/", (req, res) => res.render("index"))
app.get("/index.html", (req, res) => res.render("index"))
app.get("/index", (req, res) => res.render("index"))
app.get("/user.html", (req, res) => res.render("user"))
app.get("/admin.html", (req, res) => res.render("admin", { books }))
app.get("/guest.html", (req, res) =>
  books.find({}).then((docs) => res.render("guest", { docs: docs }))
)
app.get("/register.html", (req, res) => res.render("register", { message: "" }))
app.get("/login.html", (req, res) => res.render("login", { message: "" }))
app.get("/styles.css", (req, res) =>
  res.sendFile(__dirname + "/views/styles.css")
)
function adminCheck(username) {
  if (username.includes("adminlib")) return true
  return false
}
app.post("/register.html", (req, res) => {
  if (req.body.username.length && req.body.password.length) {
    if (!(req.body.password === req.body.repass)) {
      console.log("nomatch " + new Date().toLocaleTimeString())
      res.render("register", { message: "passwords don't match" })
    } else {
      user = {
        username: req.body.username,
        password: encrypt(req.body.password),
        isAdmin: adminCheck(req.body.username),
      }
      if (user.isAdmin)
        users.insert(user).then(
          books.find({}).then((docs) => {
            res.render("admin", { docs: docs })
          })
        )
      else
        users
          .insert(user)
          .then(
            books
              .find({})
              .then((docs) => res.render("user", { user: user, docs: docs }))
          )
    }
  }
})
app.post("/new", (req, res) => {
  books.insert({ name: req.body.bname, author: req.body.bauth })
  books.find({}).then((docs) => {
    res.render("admin", { docs: docs })
  })
})
app.post("/login.html", (req, res) => {
  // users.find({}).then((users) => {
  //   console.log(users)
  // })
  users.findOne({ username: req.body.username }).then((user) => {
    if (user == null) {
      return res.render("register", { message: "no user found" })
    }
    // user = JSON.stringify(user)
    if (decrypt(user.password) == req.body.password) {
      if (user.isAdmin) {
        books.find({}).then((docs) => {
          res.render("admin", { docs: docs })
        })
      } else
        books
          .find({})
          .then((docs) => res.render("user", { user: user, docs: docs }))
    } else {
      console.log(user)
      res.render("login", { message: "Incorrrect password" })
    }
  })
})

app.listen(port, () =>
  console.log(`my app listening on http://localhost:${port} !`)
)
