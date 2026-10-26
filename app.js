"use strict";

async function copyText(element) {
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(element.textContent.trim());
      copied = true;
    }
  } catch { /* Selection fallback also works when clipboard access is denied. */ }

  if (!copied) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try { copied = document.execCommand("copy"); } catch { /* Keep the key selected. */ }
  }

  return copied;
}


const button = document.getElementById("copy-key");
const label = document.getElementById("copy-label");
const icon = document.querySelector("#copy-icon use");
const status = document.getElementById("copy-status");
const key = document.getElementById("access-key");
let resetTimer;

button.addEventListener("click", async () => {
  clearTimeout(resetTimer);
  const copied = await copyText(key);

  if (copied) {
    label.textContent = "Key copied";
    icon.setAttribute("href", "#icon-check");
    status.textContent = "Return to Halo, paste your key, and select Unlock.";
    status.dataset.state = "copied";
    resetTimer = setTimeout(() => {
      label.textContent = "Copy key";
      icon.setAttribute("href", "#icon-copy");
    }, 2200);
  } else {
    key.focus({ preventScroll: true });
    label.textContent = "Copy selected key";
    icon.setAttribute("href", "#icon-copy");
    status.textContent = "Press ⌘C or Ctrl+C to copy the selected key.";
    status.dataset.state = "manual";
  }
});

const exampleButton = document.getElementById("copy-example");
const example = document.getElementById("example-code");
const exampleStatus = document.getElementById("example-status");
exampleButton.addEventListener("click", async () => {
  const copied = await copyText(example);
  exampleStatus.textContent = copied ? "Copied. Paste into Halo, then select Execute." : "Example selected. Press ⌘C or Ctrl+C to copy.";
});
