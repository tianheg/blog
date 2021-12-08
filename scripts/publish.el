;; load env
(load "~/.emacs.d/init.el")

;; https://orgmode.org/worg/org-tutorials/org-publish-html-tutorial.html
(require 'ox-publish)

;; https://bastibe.de/2014-05-07-speeding-up-org-publishing.html
(remove-hook 'find-file-hooks 'vc-find-file-hook 'vc-refresh-state)

(setq org-publish-project-alist
      '(("pages"
         :base-directory "~/org/"
         :publishing-directory "~/repo/blog/"
         :recursive t
         :html-head-include-default-style nil
         :html-head ""
         :publishing-function org-html-publish-to-html
         :html-postamble nil
         :with-toc 't)
         ;; 这个 rss.xml 目前是手动维护内容
         ("rss.xml"
          :base-directory "~/org/blog/"
          :base-extension "xml"
          :publishing-directory "~/repo/blog/"
          :publishing-function org-publish-attachment)
        ("site" :components ("pages" "rss.xml"))))

;; (progn (profiler-start 'cpu) (org-publish-project "site") (profiler-report) (profiler-stop))
(org-publish-project "site")
