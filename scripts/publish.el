;; load env
(load "~/.emacs.d/init.el")
(add-to-list 'load-path "~/repo/blog/scripts")
;; https://orgmode.org/worg/org-tutorials/org-publish-html-tutorial.html
(require 'ox-publish)
(require 'ox-rss)
  
;; https://bastibe.de/2014-05-07-speeding-up-org-publishing.html
(remove-hook 'find-file-hooks 'vc-find-file-hook 'vc-refresh-state)

(setq org-publish-project-alist
      '(
        ;; blog
        ("site-orgs"
         :base-directory "~/org/"
         :publishing-directory "~/repo/blog/"
         ;; :exclude "gtd*"
         :recursive t
         :html-head-include-default-style nil
         :html-head ""
         :publishing-function org-html-publish-to-html
         :html-postamble nil
         :with-toc 't
         )
        ;; RSS
        ("site-rss"
         :base-directory "~/org/"
         :base-extension "org"
         :recursive nil
         :exclude "rss.org"
         :exclude "index.org"
         :exclude "404.org"
         :publishing-function org-publish-org-sitemap
         :publishing-directory "~/repo/blog/"
         :rss-extension "xml"
         :html-link-home "https://www.yidajiabei.xyz/blog/"
         :html-link-use-abs-url t
         :html-link-org-files-as-html t
         :auto-sitemap t
         :sitemap-filename "rss.org"
         :sitemap-title "一大加贝的 RSS"
         )
        ;; publish component
        ("site" :components ("site-orgs" "site-rss"))
        ))

;; (progn (profiler-start 'cpu) (org-publish-project "site") (profiler-report) (profiler-stop))
(org-publish-project "site")

;; https://bzg.fr/en/blogging-from-emacs/