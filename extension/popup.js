const captureButton = document.getElementById("captureBtn");

console.log("Popup Loaded");

captureButton.addEventListener("click", () => {

    console.log("Button Clicked");

    chrome.tabs.captureVisibleTab({ format: "png" }, (imageUrl) => {

        console.log("Image:", imageUrl);

        console.log("Error:", chrome.runtime.lastError);

        alert("Finished");

    });

});