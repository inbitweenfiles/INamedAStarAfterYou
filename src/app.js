
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx-kBaTG7rymiwihCiKHevknQRUmowt1aAAz1KhuzfJ_aJkWOF0sFYEeWm7jB--_bOW/exec";

const signupForm = document.getElementById("signup-form");
const emailStatus = document.getElementById("email-status");
const starDisplay = document.getElementById("star-grid");
const starDetail = document.getElementById("star-detail");
const senderEmailInput = document.getElementById("sender-email");
const signupPage = document.getElementById("signup-page");

const detailStar = document.getElementById("detail-star");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");

const closeDetail = document.getElementById("close-detail");
const giftButton = document.getElementById("gift-button");
const giftForm = document.getElementById("giftForm");

const status = document.getElementById("status");

const senderName = document.getElementById("sender-name");
const senderMessage = document.getElementById("sender-message");
const receiverEmail = document.getElementById("recipient-email");

let currentSender = localStorage.getItem("senderEmail") || "";
let selectedStar = "";

const starNames = [
  "Yuri",
  "Nora",
  "Mint",
  "Ruby",
  "Sky",
  "Toffee",
  "Mauve"
];

function getGiftedStars() {
  return JSON.parse(
    localStorage.getItem("giftedStars") || "{}"
  );
}

function saveGiftedStar(star) {
  const gifted = getGiftedStars();
  gifted[star] = true;

  localStorage.setItem(
    "giftedStars",
    JSON.stringify(gifted)
  );
}

async function sendToGoogleSheets(data) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(data)
  });

  return response;
}

function updateStarButtons() {
  const gifted = getGiftedStars();

  document.querySelectorAll(".custom-btn").forEach(button => {
    const color = button.dataset.color;
    const star = button.querySelector(".star");
    const title = button.querySelector("h2").textContent.trim();

    if (color && star) {
      star.style.setProperty("--star-color", color);
    }

    const alreadyGifted = gifted[title] === true;

    button.disabled = alreadyGifted;
    button.style.opacity = alreadyGifted ? "0.4" : "1";

    button.querySelector("p").textContent = alreadyGifted
      ? "Already gifted"
      : button.querySelector("p").textContent;
  });
}

signupPage.hidden = Boolean(currentSender);
starDisplay.hidden = !currentSender;
starDetail.hidden = true;
giftForm.hidden = true;

if (currentSender) {
  updateStarButtons();
}

signupForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!senderEmailInput.checkValidity()) {
    senderEmailInput.reportValidity();
    return;
  }

  const email = senderEmailInput.value.trim().toLowerCase();
  const proceedButton = signupForm.querySelector(
    'button[type="submit"]'
  );

  proceedButton.disabled = true;
  emailStatus.textContent = "Submitting...";

  try {
    await sendToGoogleSheets({
      action: "registerSender",
      senderEmail: email
    });

    currentSender = email;

    localStorage.setItem("senderEmail", email);

    signupPage.hidden = true;
    starDisplay.hidden = false;

    emailStatus.textContent = "";

    updateStarButtons();

  } catch (error) {
    console.error(error);

    emailStatus.textContent =
      "Something went wrong. Please try again.";

    proceedButton.disabled = false;
  }
});

document.querySelectorAll(".custom-btn").forEach(button => {
  button.addEventListener("click", () => {

    if (button.disabled) return;

    const title = button.querySelector("h2");
    const description = button.querySelector("p");

    selectedStar = title.textContent.trim();

    detailTitle.textContent = selectedStar;
    detailDescription.textContent = description.textContent;

    detailStar.textContent = "★";

    detailStar.style.setProperty(
      "--star-color",
      button.dataset.color || "#f5d98b"
    );

    starDetail.hidden = false;
    giftForm.hidden = true;
    giftButton.hidden = false;

    status.textContent = "";

  });
});

// CLOSE STAR DETAIL
closeDetail.addEventListener("click", () => {
  starDetail.hidden = true;
});

// OPEN GIFT FORM
giftButton.addEventListener("click", () => {
  giftForm.hidden = false;
  giftButton.hidden = true;
});

// SUBMIT GIFT
giftForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentSender || !selectedStar) {
    status.textContent =
      "Please register your email and select a star first.";
    return;
  }

  if (!receiverEmail.checkValidity()) {
    receiverEmail.reportValidity();
    return;
  }

  const gifted = getGiftedStars();

  if (gifted[selectedStar]) {
    status.textContent =
      "You have already gifted this star.";
    return;
  }

  const submitButton = giftForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  status.textContent = "Submitting your gift...";

  try {
    await sendToGoogleSheets({
      action: "giftStar",
      senderEmail: currentSender,
      receiverEmail: receiverEmail.value.trim().toLowerCase(),
      star: selectedStar,
      senderName: senderName.value.trim(),
      senderMessage: senderMessage.value.trim()
    });

    // Optimistically update local state.
    // The server independently enforces duplicate prevention.
    saveGiftedStar(selectedStar);

    status.textContent =
      "Your gift submission has been sent!";

    updateStarButtons();

    giftForm.reset();

    setTimeout(() => {
      giftForm.hidden = true;
      giftButton.hidden = false;
      starDetail.hidden = true;
    }, 2000);

  } catch (error) {
    console.error("Gift submission error:", error);

    status.textContent =
      "There was a problem. Please try again.";

  } finally {
    submitButton.disabled = false;
  }
});
