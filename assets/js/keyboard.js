window.addEventListener(
  "DOMContentLoaded",
  (event) => {
    const setupEditHotkey = () => {
      window.addEventListener("keypress", (e) => {
        if (
          e.key === "." &&
          window.location.pathname !== "/posts/" &&
          window.location.pathname !== "/" &&
          !window.location.pathname.startsWith("/tags/")
        ) {
          const contentPath = window.location.pathname.split("/");
          const fileName = `${contentPath[contentPath.length - 2]}.org`;
          const editUrl = `https://github.com/tianheg/blog/edit/main/content/${fileName}`;
          window.location.href = editUrl;
        }
      });
    };
    setupEditHotkey();
  },
  { once: true }
);
