const express = require("express");
const app = express();
const path = require("path");
const usermodel = require("./models/user");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.render("index");
});

const isloggedin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, "shshshhhh");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send("Unauthorized: Invalid token");
  }
};

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isloggedin, async (req, res) => {
  try {
    let user = await usermodel
      .findOne({ email: req.user.email })
      .populate("posts");
    let allposts = await postmodel.find({}).populate("user", "username name");
    //console.log(allposts);
    res.render("profile", { user, allposts });
  } catch (error) {
    //console.error("Error fetching posts:", error);
    res.status(500).send("Error fetching profile data");
  }
});

app.post("/register", async (req, res) => {
  let { name, email, password} = req.body;
  let user = await usermodel.findOne({ email });
  if (user) return res.status(500).send("User Already Registered");
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await usermodel.create({
        name,
        email,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "shshshhhh");
      res.cookie("token", token);
      res.render("home");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (!user) return res.status(500).send("Something Went Wrong");

  bcrypt.compare(password, user.password, (error, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shshshhhh");
      res.cookie("token", token);
      res.render("home");
    } else res.redirect("/login");
  });
});

// app.get("/logout", (req, res) => {
//   res.cookie("token", "");
//   res.redirect("/login");
// });

app.listen(3000);