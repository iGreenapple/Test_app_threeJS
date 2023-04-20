import express from 'express';
import ejs from "ejs";
import mongoose, { Schema } from "mongoose";
import path from "path";
import theory from "./public/js/theory.js";


//////// jelikož v ES module neexistuje __dirname, musíme si ho nadefionvat takhle:
import { fileURLToPath } from 'url'; // this method decodes the file URL to a path string (změní / na \ a začně to normálně C:\Users...)

const __filename = fileURLToPath(import.meta.url); // import.meta.url je path k souboru
const __dirname = path.dirname(__filename); //metodou dirname pak dostaneme path k directory  
////////

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/js"));
app.use('/scene1', express.static('public'))

app.use("/build/", express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

mongoose.connect("mongodb://127.0.0.1:27017/threeJS-DB");

// Schema of data for one scene 
const sceneData = new mongoose.Schema({
  scene : String,
  selectedObject : String,
  cameraPosition : Array
})

const Scene = mongoose.model("Scene", sceneData);

const userData = new mongoose.Schema({
  entryTime : Date,
  exitTime : Date,

  scene1 : [sceneData],
  scene2 : [sceneData]
})

const User = mongoose.model("User", userData);


let userId;

app.get("/", (req, res) => {
  res.render("home");
});

app.post("/", (req, res) => {
  userId = req.body.userId;
  console.log(userId);
  const userAgent = req.headers["user-agent"];
  // console.log("User-Agent:", userAgent); // Výpis User-Agent do konzole
  // const screenWidth = window.screen.width;
  // const screenHeight = window.screen.height;
  // console.log("Šířka obrazovky:", screenWidth, "px");
  // console.log("Výška obrazovky:", screenHeight, "px");
  
  res.redirect(`/theory`);
});

app.get("/theory", (req, res) => {
  res.render("theory", {
    heading: theory.StavbaZeme.heading,
    paragraph1: theory.StavbaZeme.paragraph1,
    paragraph2: theory.StavbaZeme.paragraph2,
    paragraph3: theory.StavbaZeme.paragraph3,
    paragraph4: theory.StavbaZeme.paragraph4
  });
});

app.post("/theory", (req, res) => {
  res.redirect(`/scene1/${userId}`);
});

app.get(`/scene1/:id`, (req, res) => {
  console.log(req.params.id); 
  res.render("scene", {
    userId: userId
  });
});

app.post(`/scene1`, (req, res) => {
  res.redirect(`/final`);
});

app.post("/data", (req, res) => {
  res.set('Content-Type', 'application/json');
  let { scene, selectedObject, cameraPosition } = req.body;
  let sceneData = new Scene({
    scene: scene,
    selectedObject: selectedObject,
    cameraPosition: cameraPosition
  })
  console.log(sceneData.cameraPosition);
  sceneData.save();
});

// app.get(`/scene2/:id`, (req, res) => {})
app.get(`/final`, (req, res) => {
  res.render("final")
})




app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});