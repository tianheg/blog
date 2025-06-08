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
        const isHomePage = window.location.pathname === "/";
        const isPostsPage = window.location.pathname === "/posts/";
        const isTagsPage = window.location.pathname.startsWith("/tags/");

        const isInputOrTextArea =
          event.target.nodeName === "INPUT" ||
          event.target.nodeName === "TEXTAREA";

        if (
          isEditKey &&
          !isHomePage &&
          !isPostsPage &&
          !isTagsPage &&
          !isInputOrTextArea
        ) {
          const contentPath = window.location.pathname.split("/");
          const fileName =
            contentPath.length === 3
              ? `${contentPath[contentPath.length - 2]}.org`
              : `posts/${contentPath[contentPath.length - 2]}.org`;
          const editUrl = `https://github.com/tianheg/blog/edit/main/content/${fileName}`;
          window.location.href = editUrl;
        }
      });
    };
    setupEditHotkey();
  },
  { once: true },
);
