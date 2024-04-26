window.addEventListener(
  "DOMContentLoaded",
  (event) => {
    /**
     * Sets up a hotkey to navigate to the GitHub edit page for the current post.
     *
     * @return {void} This function does not return anything.
     */
    const setupEditHotkey = () => {
      window.addEventListener("keypress", (event) => {
        const isEditKey = event.key === ".";
        const isOnPostPage = window.location.pathname.startsWith("/posts/");
        const isOnHomePage = window.location.pathname === "/";
        const isOnTagsPage = window.location.pathname.startsWith("/tags/");
        const isInputOrTextArea =
          event.target.nodeName === "INPUT" ||
          event.target.nodeName === "TEXTAREA";

        if (
          isEditKey &&
          !isOnPostPage &&
          !isOnHomePage &&
          !isOnTagsPage &&
          !isInputOrTextArea
        ) {
          const fileName = window.location.pathname.split("/")[2] + ".org";
          const editUrl = `https://github.com/tianheg/blog/edit/main/content/${fileName}`;
          window.location.href = editUrl;
        }
      });
    };
    setupEditHotkey();
  },
  { once: true }
);
