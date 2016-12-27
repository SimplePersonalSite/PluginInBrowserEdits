## PluginInBrowserEdits
This plugin is for use with [SimplePersonalSite](https://github.com/SimplePersonalSite/SimplePersonalSite). It allows you to make edits in your browser instead of in a separate editor.

## How To use it
1. follow directions to setup a [SimplePersonalSite](https://github.com/SimplePersonalSite/SimplePersonalSite).
1. `cd` to the root directory of your site
1. symlink `PluginInBrowserEdits.css` and `PluginInBrowserEdits.js`
1. include `PluginInBrowserEdits.js` as a script in `index.html` **below** `SimplePersonalSite.js`
  - `<script src='PluginInBrowserEdits.js'></script>`
1. Tell the app to initialize the plugin by passing `PluginInBrowserEdits.plugin` to `app.run()` in `index.html`
  - if you only have one plugin, this looks like:
  - `app.run([PluginInBrowserEdits.plugin])`
1. Start this plugin's `server.py` **from the root directory of your project**
  - if you need to change the default port (4113), make sure to change it in `PluginInBrowserEdits.js` too by overriding `PluginInBrowserEdits.port`
