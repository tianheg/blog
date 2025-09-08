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
        const isTilPage = window.location.pathname.startsWith("/til/");

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
          let fileName = "";
          if (isTilPage) {
            // /til/.../<slug>/ => content/til/.../<slug>.org
            // Remove leading and trailing slashes, split, and remove empty segments
            const tilSegments = window.location.pathname
              .replace(/^\/|\/$/g, "")
              .split("/")
              .slice(1); // remove 'til' segment
            if (tilSegments.length > 0) {
              // Remove possible empty string at the end (from trailing slash)
              const filteredSegments = tilSegments.filter(Boolean);
              if (filteredSegments.length > 0) {
                // Last segment is the slug
                const slug = filteredSegments.pop();
                const subPath = filteredSegments.length > 0 ? filteredSegments.join("/") + "/" : "";
                fileName = `til/${subPath}${slug}.org`;
              }
            }
          } else if (contentPath.length === 3) {
            fileName = `${contentPath[contentPath.length - 2]}.org`;
          } else {
            fileName = `posts/${contentPath[contentPath.length - 2]}.org`;
          }
          if (fileName) {
            const editUrl = `https://github.com/tianheg/blog/edit/main/content/${fileName}`;
            window.location.href = editUrl;
          }
        }
      });
    };
    setupEditHotkey();
  },
  { once: true },
);
