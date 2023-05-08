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
app.use(express.static(__dirname + "/public/images"));
app.use('/scene1', express.static('public'))
app.use('/scene2', express.static('public'))
app.use('/form', express.static('public'))

app.use("/build/", express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));


/// MONGOOSE CODE /// 
// mongoose.connect("mongodb://127.0.0.1:27017/threeJS-DB");
mongoose.connect("mongodb+srv://OndraS:bloody44@cluster0.lsbfvmo.mongodb.net/threeJS-DB");


// Schema of data for one scene 
const sceneData = new mongoose.Schema({
  scene : String,
  entryTime: String,
  exitTime: String,
  selectedObject : String,
  cameraPosition: Array
})

const Scene = mongoose.model("Scene", sceneData);

const formData = new mongoose.Schema({
  sex: String,
  age: String,
  experience: String,
  visualization: String
})

const Form = mongoose.model("Form", formData);

const userData = new mongoose.Schema({
  userId: String,
  entryTime : String,
  exitTime : String,
  browser : String,
  platform : String,
  screenWidth: String,
  screenHeight: String,
  scene1 : sceneData,
  scene2 : sceneData,
  formData: formData
})

const User = mongoose.model("User", userData);

// user id is create on client side, but then it is sent to the server
let userId;
// definování mongoDB collection, do které jsou následně vkládány data
let dataFromUser = new User({
  userId: null,
  entryTime: new Date().toLocaleTimeString(),
  exitTime: null,
  browser: null,
  platform: null,
  screenWidth: null,
  screenHeight: null,
  scene1: null,
  scene2: null,
  formData: null
});

/// HOME route ///
app.get("/", (req, res) => {
  res.render("home");
});

app.post("/", (req, res) => {
  userId = req.body.userId; // naplnění userId hodnotou ID generovanou na straně klienta
  
  res.redirect(`/theory`);
});
//      |
//      |
//      V
/// THEORY ROUTE ///
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
  // console.log(dataFromUser);
  res.redirect(`/scene1/${userId}`);
});
//      |
//      |
//      V
// SCENE 1 route ///
app.get(`/scene1/:id`, (req, res) => { 
  res.render("scene", {
    userId: userId
  });
});

app.post(`/scene1`, (req, res) => {
  res.redirect(`/scene2/${userId}`);
});
//      |
//      |
//      V
/// SCENE 2 route 
app.get(`/scene2/:id`, (req, res) => {
  res.render("scene2", {
    userId: userId
  });
})

app.post(`/scene2`, (req, res) => {
  res.redirect(`/form`);
});
//      |
//      |
//      V
/// FORM route /// 
app.get(`/form`, (req, res) => {
  res.render("form");
})


/// FINAL route ///
app.get(`/final`, (req, res) => {
  res.render("final");
})

// app.post(`/final`, (req, res) => {
// })

/// DATA routes - don't render any page, bud data from form is sent here
// data from home route
app.use("/start_data", (req, res) => {
  // save data about browser and screen in dataFromUser object/ Mongoose collection
  dataFromUser.userId = req.body.userId;
  dataFromUser.browser = req.body.browserType;
  dataFromUser.platform = req.body.platform;
  dataFromUser.screenWidth = req.body.screenWidth;
  dataFromUser.screenHeight = req.body.screenHeight;

  // console.log(`test ${dataFromUser}`);
})

// data from sceneX route
app.post("/scene_data", (req, res) => {
  // console.log(req.body);
  res.set('Content-Type', 'application/json');
  let {scene, entryTime, exitTime, selectedObject, cameraMovement } = req.body;
  if (scene === "scene_1") {
    let sceneData = new Scene({
      scene: scene,
      entryTime: entryTime,
      exitTime: exitTime,
      selectedObject: selectedObject,
      cameraPosition: cameraMovement
    })
    dataFromUser.scene1 = sceneData;
    // console.log(`Scene 1 ${dataFromUser}`);
  }
  else if (scene === "scene_2") {
    let sceneData = new Scene({
      scene: scene,
      entryTime: entryTime,
      exitTime: exitTime,
      selectedObject: selectedObject,
      cameraPosition: cameraMovement
    })
    dataFromUser.scene2 = sceneData;
    // console.log(`Scene 2 ${dataFromUser}`);
  }
});

// data from final route
app.post("/final_data", (req, res) => {
  let {sex, age, experience, visualization} = req.body;
  let formData = new Form({
    sex: sex,
    age: age,
    experience: experience,
    visualization: visualization
  })
  dataFromUser.formData = formData
  dataFromUser.exitTime = new Date().toLocaleTimeString(),
  // console.log(`Form ${dataFromUser}`);
  dataFromUser.save();
  res.redirect(`/final`);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});