var gameStarted = false;
var currentIndex = 0;
var gameText = "";
var charList = [];
var wpm = 0;
var mistakes = 0;
var charsWellWritten = 0;
var time = 0;
var wordsWritten = 0;
let cronometro;

var personalBest = "";

const config = {
  difficulty: "easy",
  mode: "timed",
};

const startButton = document.getElementsByClassName("start-button")[0];
const restartButton = document.getElementsByClassName("restart-button")[0];
const testBody = document.getElementsByClassName("test-body")[0];
const testStartedDiv = document.getElementsByClassName("test-started")[0];
const testNotStartedDiv =
  document.getElementsByClassName("test-not-started")[0];
const gameFinished = document.getElementsByClassName("game-finished")[0];
const gameFinishedWithRecord = document.getElementsByClassName(
  "game-finished-with-record"
)[0];
const startButtonContainer = document.getElementsByClassName(
  "start-button-container"
)[0];
const selectDifficulty = document.getElementById("difficulty");
const selectMode = document.getElementById("mode");

const goAgainButton = document.getElementsByClassName("go-again-button")[0];

const beatThisRecord = document.getElementsByClassName(
  "beat-this-score-button"
)[0];

startButton.addEventListener("click", async (e) => {
  e.stopPropagation();
  detenerContador();
  await startGame();
});

const getTextForTheGame = async function () {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    const texts = data[config["difficulty"]];

    const randomIndex = Math.floor((texts.length - 1) * Math.random());
    return texts[randomIndex].text;
  } catch (error) {
    console.error("Error cargando el JSON:", error);
  }
};

const startGame = async function () {
  time = 0;
  gameStarted = true;
  currentIndex = 0;
  wordsWritten = 0;
  charsWellWritten = 0;
  mistakes = 0;
  testNotStartedDiv.classList.add("hidden");
  gameFinishedWithRecord.classList.add("hidden");
  testStartedDiv.classList.remove("hidden");
  gameFinished.classList.add("hidden");
  testBody.classList.remove("hidden");
  document.getElementById("time").innerText =
    config["mode"] === "timed" ? "0:60" : "0:00";
  document.getElementById("accuracy").innerText = "100%";
  document.getElementById("wpm").innerText = "0";
  document.getElementById("restart").classList.remove("hidden");
  testStartedDiv.innerHTML = "";
  openKeyboard();
  startTimer();

  // Crear el texto nuevo y poner la primera letra con class target
  gameText = await getTextForTheGame();
  populateNewText(gameText);
  charList = document.getElementsByClassName("char");
};

window.addEventListener("keydown", (e) => {
  if (!gameStarted) return;

  const key = e.key;
  const targetChar = charList[currentIndex];

  if (key === "Backspace" && currentIndex > 0) {
    updateCursor(currentIndex, false);
    currentIndex--;

    if (charList[currentIndex].innerText === " ") {
      wordsWritten--;
    }
    return;
  }

  // Ignorar teclas especiales (Shift, Alt, etc.)
  if (key.length !== 1) return;

  if (targetChar.innerText === " ") {
    wordsWritten++;
  }

  const accuracyText = document.getElementById("accuracy");

  if (key === targetChar.innerText) {
    targetChar.classList.add("correct");
    targetChar.classList.remove("target");

    charsWellWritten++;
  } else {
    targetChar.classList.add("incorrect");

    mistakes++;
  }
  let accuracy = Math.floor(100 - (mistakes / charList.length) * 100);
  accuracyText.innerHTML = accuracy + "%";

  currentIndex++;

  if (currentIndex < charList.length) {
    updateCursor(currentIndex, true);
  } else {
    wordsWritten++;
    detenerContador();
    endGame();
  }
});

const updateCursor = function (index, moveForward) {
  if (moveForward) {
    charList[index - 1].classList.remove("target");
    charList[index].classList.add("target");
    return;
  }

  charList[index].classList.remove("target");
  charList[index - 1].classList.add("target");
  charList[index - 1].classList.remove("incorrect", "correct");
};

const populateNewText = function (text) {
  text.split("").forEach((letter, currentIndex) => {
    const span = document.createElement("span");
    span.innerText = letter;
    if (currentIndex === 0) span.classList.add("target");
    span.classList.add("font-weight-400", "body-text", "char");
    testStartedDiv.appendChild(span);
  });
};

function startTimer() {
  cronometro = setInterval(() => {
    time++;
    const mode = config["mode"];
    if (mode === "timed") {
      document.getElementById("time").innerText = "0:" + (60 - time);
    } else {
      const [minutes, seconds] = getMinutesAndSeconds(time);
      document.getElementById("time").innerText = minutes + ":" + seconds;
    }

    const wpm = time === 0 ? 0 : Math.floor((wordsWritten * 60) / time);
    document.getElementById("wpm").innerText = wpm;

    if (mode === "timed" && time === 60) {
      detenerContador();
      endGame();
    }
  }, 1000);
}

const getMinutesAndSeconds = function (seconds) {
  const minutes = Math.floor(seconds / 60);
  return [minutes, String(seconds % 60).padStart(2, "0")];
};

function detenerContador() {
  clearInterval(cronometro);
}

const endGame = function () {
  const wpm = time === 0 ? 0 : Math.floor((wordsWritten * 60) / time);
  const record = verifyIfRecord(wpm);
  document.getElementById("restart").classList.add("hidden");
  gameStarted = false;

  if (personalBest === "0") {
    testBody.classList.add("hidden");
    gameFinished.classList.remove("hidden");

    document.getElementById("wpm-score").innerText = wpm;

    let accuracy = Math.floor(100 - (mistakes / charList.length) * 100);
    document.getElementById("accuracy-score").innerText = accuracy + "%";

    document.getElementById("correct-characters-score").innerText =
      charsWellWritten;
    document.getElementById("incorrect-characters-score").innerText = mistakes;

    document.getElementsByClassName("test-completed-text-title")[0].innerText =
      "Baseline Established!";
    document.getElementById("test-completed-text-subtitle").innerText =
      "You've set the bar. Now the real challenge begins—time to beat it.";

    document.getElementById("go-again-button-text").innerText =
      "Beat this score";

    testStartedDiv.innerHTML = "";
    return;
  }

  if (!record) {
    testBody.classList.add("hidden");
    gameFinished.classList.remove("hidden");

    document.getElementById("wpm-score").innerText = wpm;

    let accuracy = Math.floor(100 - (mistakes / charList.length) * 100);
    document.getElementById("accuracy-score").innerText = accuracy + "%";

    document.getElementById("correct-characters-score").innerText =
      charsWellWritten;
    document.getElementById("incorrect-characters-score").innerText = mistakes;

    testStartedDiv.innerHTML = "";
    return;
  }

  testBody.classList.add("hidden");
  gameFinishedWithRecord.classList.remove("hidden");

  document.getElementById("wpm-score-record").innerText = wpm;

  let accuracy = Math.floor(100 - (mistakes / charList.length) * 100);
  document.getElementById("accuracy-score-record").innerText = accuracy + "%";

  document.getElementById("correct-characters-score-record").innerText =
    charsWellWritten;
  document.getElementById("incorrect-characters-score-record").innerText =
    mistakes;
  testStartedDiv.innerHTML = "";
};

const verifyIfRecord = function (wpm) {
  if (personalBest < wpm) {
    localStorage.setItem("personalBest", wpm);
    const personalBestLabel = document.getElementById("personal-best");
    personalBestLabel.innerText = wpm + " WPM";
    return true;
  }

  return false;
};

goAgainButton.addEventListener("click", async (e) => {
  await startGame();
});

beatThisRecord.addEventListener("click", async (e) => {
  await startGame();
});

document.querySelectorAll(".button-group").forEach((group) => {
  group.addEventListener("click", (e) => {
    const target = e.target;

    // Verificamos que se haya hecho click en un botón y no en el espacio vacío
    if (target.classList.contains("config-button")) {
      const type = target.dataset.type; // 'difficulty' o 'mode'
      const value = target.dataset.value;

      group
        .querySelectorAll(".config-button")
        .forEach((btn) => btn.classList.remove("active"));

      target.classList.add("active");

      config[type] = value;
    }
  });
});

restartButton.addEventListener("click", async (e) => {
  testStartedDiv.innerHTML = "";
  detenerContador();
  await startGame();
});

startButtonContainer.addEventListener("click", async (e) => {
  detenerContador();
  await startGame();
});

testStartedDiv.addEventListener("click", () => {
  openKeyboard();
});

document.addEventListener("DOMContentLoaded", chargePB);

function chargePB() {
  let pb = localStorage.getItem("personalBest");
  personalBest = pb;
  if (!pb) {
    localStorage.setItem("personalBest", 0);
    personalBest = "0";
  }
  const personalBestLabel = document.getElementById("personal-best");
  personalBestLabel.innerText = personalBest + " WPM";
}

selectDifficulty.addEventListener("change", (e) => {
  const newDifficulty = e.target.value;
  config["difficulty"] = newDifficulty;
});

selectMode.addEventListener("change", (e) => {
  const newMode = e.target.value;
  config["mode"] = newMode;
});

const openKeyboard = function () {
  const input = document.getElementById("hidden-input");
  input.focus();
};
