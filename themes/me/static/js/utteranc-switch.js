(function () {
  function setUtterancesTheme() {
    let theme = window.localStorage.getItem("theme") || "dark";
    let msg = {
      type: "set-theme",
      theme: "github-light",
    };
    if (theme == "dark") {
      msg.theme = "github-dark";
    }
    document
      .querySelector(".utterances-frame")
      .contentWindow.postMessage(msg, "https://utteranc.es");
  }

  document.querySelector(".dark-mode-toggle").addEventListener("click", () => {
    setTimeout(setUtterancesTheme, 500);
  });
  setTimeout(setUtterancesTheme, 2000);
})();
