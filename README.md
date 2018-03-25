## PluginInBrowserEdits
This plugin is for use with [SimplePersonalSiteJavaServer](https://github.com/SimplePersonalSite/SimplePersonalSiteJavaServer). It allows you to make edits in your browser instead of in a separate editor.

## How To use it
1. follow directions to setup a [SimplePersonalSiteJavaServer](https://github.com/SimplePersonalSite/SimplePersonalSiteJavaServer).
1. symlink `PluginInBrowserEdits.css` and `PluginInBrowserEdits.js` from this repo to the plugins directory of your site
1. include `PluginInBrowserEdits.js` as a script in `index.html` **below** `SimplePersonalSite.js`
  - `<script src='plugins/PluginInBrowserEdits.js'></script>`
1. Tell the app to initialize the plugin by passing `PluginInBrowserEdits.plugin` to `app.run()` in `index.html`
  - if you only have one plugin, this looks like:
  - `app.run([PluginInBrowserEdits.plugin])`
- if you need to change the default port (8000), Change the value `PluginInBrowserEdits.port` after importing PluginInBrowserEdits to your index.html but before executing the plugin.
