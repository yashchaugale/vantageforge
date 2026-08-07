import { captureTrade } from "./services/tradeService.js";

const captureButton = document.getElementById("captureBtn");

captureButton.addEventListener("click", async () => {

    const trade = await captureTrade();

    console.log(trade);

    alert("Trade Saved Successfully!");

});