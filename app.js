/**
 *  * Module Dependencies
 *   */
const express = require("express");
const fileUpload = require("express-fileupload");
const unoconv = require("unoconv-promise");
const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(fileUpload());
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  express.static("public");
});

app.post("/upload", function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(`./sample.pptx`, function (err) {
    if (err) return res.status(500).send(err);
    unoconv
      .run({
        file: "./sample.pptx",
        output: "./sample.pdf",
      })
      .then((filePath) => {
        console.log(filePath);
        res.sendFile("sample.pdf", { root: __dirname });
      })
      .catch((e) => {
        throw e;
      });
  });
});

app.post("/uploadImage", function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  const imageFile = req.files.image;
  console.log(req.files);
  imageFile.mv(`./images/${imageFile.name}.png`, (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Done" });
  });
});

/**
 *  * Start Server
 *   */
app.listen(8000);
console.log("Express listening on port 8000...");
