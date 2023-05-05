document.querySelector("#post-button").onclick = function () {
  let dataToPost = createData();
  console.log(dataToPost);
  fetch("/final_data", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(dataToPost)
    })
    .then(response => response.json())
    .then(data =>
        console.log(data)
      )
    .catch(error => 
        console.log(error)
    );
}

// function nextQuestion() {
//   var answer1 = document.getElementById("answer1").value;
//   if (answer1 === "") {
//     alert("Prosím vyplňte odpověď.");
//   } else {
//     document.getElementById("question1").style.display = "none";
//     document.getElementById("question2").style.display = "block";
//   }

//   var answer2 = document.getElementById("answer2").value;
//   if (answer2 === "") {
//     alert("Prosím vyplňte odpověď.");
//   } else {
//     document.getElementById("question2").style.display = "none";
//     document.getElementById("question3").style.display = "block";
//   }

//   var answer3 = document.getElementById("answer3").value;
//   if (answer3 === "") {
//     alert("Prosím vyberte odpověď.");
//   } else {
//     document.getElementById("question3").style.display = "none";
//     document.getElementById("submit").style.display = "block";
//   }
// }