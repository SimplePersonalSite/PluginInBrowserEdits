/**
 * A plugin which enables editing the source of files from the browser.
 */
var PluginInBrowserEdits = Util.createSingleton('PluginInBrowserEdits', function() {
  this._editing = null;
  this._saved = false;
  this._inited = false;
});

/**
 * Pass this function as a plugin to a SimplePersonalSite.App to install this plugin in the running
 * app.
 */
PluginInBrowserEdits.plugin = function plugin(app) {
  PluginInBrowserEdits.getInstance().init(app);
  SimplePersonalSite.Util.linkCss('PluginInBrowserEdits.css');
};

/**
 * The port the backend edit server is running on.
 */
PluginInBrowserEdits.port = 4113;

/**
 * Grow an element to its natural height.
 * http://stackoverflow.com/a/24676492/1433127
 */
PluginInBrowserEdits.autoGrow = function autoGrow(elm) {
  elm.style.height = "auto";
  elm.style.height = (elm.scrollHeight)+"px";
};

/**
 * The default parameters for this plugi.
 */
PluginInBrowserEdits.defaultConfig = {
  /** if you press tab, how many "tabChars" to insert? */
  tabSize: 2,
  /** if you press tab, what tab char should be inserted? */
  tabChar: ' ',
  /**
   * Regex which determines which pattern will split markdown pages into multiple separate sections
   * for editing.
   *
   * IMPORTANT: make sure to set the global flag (/g at end) if you want to split on all occurrences
   * and not just the first.
   *
   * Set to null to disable.
   */
  section_split_regex: /\n{2}\n+/g,
  /**
   * Should occurrences of section_split_regex be consumed and not displayed in the rendered page
   * and in the section edit text areas?
   */
  section_split_regex_consume: true,
};

/**
 * Override properties in the current config.
 */
PluginInBrowserEdits.prototype.setConfig = function setConfig(config) {
  this.config = _.defaults({}, config, this.config, PluginInBrowserEdits.defaultConfig);
};

/**
 * Initilize this plugin. Don't call this directly. Instead pass PluginInBrowserEdits.plugin
 * to the SimplePersonalSite.App's init/run function.
 */
PluginInBrowserEdits.prototype.init = function init(app) {
  if (this._inited) {
    throw new Error('cannot initiate PluginInBrowserEdits twice');
  }
  this._inited = true;
  this.setConfig();
  this._initRenderFile();
  this._initRenderStr();
};


/**
 * Function called when the users clicks edit or double clicks on a section.
 */
PluginInBrowserEdits.prototype.clickEdit = function clickEdit(evt) {
  var container = evt.target;
  var section = null;
  while (container !== null && !container.classList.contains('sps-ibe-editable-markup')) {
    if (container.classList.contains('sps-ibe-editable-markup-edit-section')) {
      Util.assert(section === null);
      section = container;
    }
    container = container.parentNode;
  }
  Util.assert(container.children[0].classList.contains('sps-ibe-edit-btn'));
  container.children[0].style.display = 'none';
  if (this._editing !== null) {
    if (this._editing !== container) {
      alert('already editing');
    }
    return;
  }
  this._editing = container;

  SimplePersonalSite.Util.assert(container !== null);
  var filename = container.dataset.filename;

  var self = this;
  SimplePersonalSite.Util.pFetch(filename)
      .then(function render(md) {
        if (section) {
          var start = parseInt(section.dataset['startpos']);
          var end = parseInt(section.dataset['endpos']);
          var replaceParentElm = section;
        } else {
          var start = 0;
          var end = md.length;
          var replaceParentElm = container;
        }
        replaceParentElm.innerHTML =
            '<div class="sps-ibe-save-btn">save</div>' +
            '<textarea ' +
            'onblur="PluginInBrowserEdits.getInstance().clickSave()" ' +
            'oninput="PluginInBrowserEdits.autoGrow(this)" ' +
            'onkeydown="PluginInBrowserEdits.getInstance().onKeyDown(event, this)" ' +
            'data-md="' + Util.escapeHtml(md) + '" ' +
            'data-startpos=' + start + ' ' +
            'data-endpos=' + end + ' ' +
            'data-filename="' + container.dataset.filename + '" ' +
            'id="sps-ibe-file-text">' +
            Util.escapeHtml(md.substring(start, end)) + '</textarea>' + 
            '';
        replaceParentElm.childNodes[1].focus();
        PluginInBrowserEdits.autoGrow(replaceParentElm.childNodes[1]);
        self._saved = false;
      })
      .catch(console.error.bind(console));
};

/**
 * Function called when the user clicks save or clicks outside of the edit area.
 */
PluginInBrowserEdits.prototype.clickSave = function clickSave(evt) {
  if (this._saved) {
    return;
  }
  this._saved = true;
  var elm = document.getElementById('sps-ibe-file-text');
  var sectionMd = elm.value;
  var fullMd = elm.dataset['md'];
  var start = parseInt(elm.dataset['startpos']);
  var end = parseInt(elm.dataset['endpos']);
  var newMd = fullMd.substring(0, start) + sectionMd
      + fullMd.substring(end, fullMd.length);
  var msg = JSON.stringify({'filename': elm.dataset.filename, 'content': newMd});
  var url = window.location.protocol + '//' + window.location.hostname + ':' +
      PluginInBrowserEdits.port;
  var self = this;
  SimplePersonalSite.Util.pAjax(url, 'post', msg)
    .then(function() {
      SimplePersonalSite.App.getInstance().refresh();
      self._editing = null;
    })
    .catch(console.error.bind(console));
};

/**
 * Interpret tabs.
 */
PluginInBrowserEdits.prototype.onKeyDown = function onKeyDown(evt, elm) {
  switch (evt.keyCode) {
    case 9: return this.doTabDown(evt, elm);
  }
};

/**
 * Actually insert a tab or remove one.
 */
PluginInBrowserEdits.prototype.doTabDown = function doTabDown(evt, elm) {
  var start = elm.selectionStart;
  var end = elm.selectionEnd;
  var value = evt.target.value;
  var tabSize = this.config.tabSize;
  var tabChar = this.config.tabChar;

  if (evt.shiftKey) {
    if (start != end) {
      // What is the expected behavior if the user presses shift+tab while selecting text?
    } else {
      for (var i = 0; i < tabSize && value.charAt(start - i - 1) === tabChar; ++i) {
        document.execCommand('delete', false);
      }
    }
  } else {
    for (var i = 0; i < tabSize; ++i) {
      document.execCommand('insertText', false, tabChar);
    }
  }

  evt.preventDefault();
};

PluginInBrowserEdits.prototype._initRenderFile = function _initRenderFile() {
  var old_render_file = SimplePersonalSite.Context.prototype.render_md_file;
  var new_render_file = function render_md_file() {
    var html = old_render_file.apply(this, arguments);
    var filename = arguments[0];
    return '<div class="sps-ibe-editable-markup" data-filename="' + filename + '" ' +
        'ondblclick="PluginInBrowserEdits.getInstance().clickEdit(event)">' +
        '<div  onclick="PluginInBrowserEdits.getInstance().clickEdit(event)" ' +
        'class="sps-ibe-edit-btn">' + filename + '</div>' +
        html + '</div>';
  };
  SimplePersonalSite.Context.prototype.render_md_file = new_render_file;
};

PluginInBrowserEdits.prototype._initRenderStr = function _initRenderStr() {
  var rexp = this.config.section_split_regex;
  var consume = this.config.section_split_regex_consume;
  if (rexp === null) {
    return;
  }
  var needed_newlines = this.config.needed_newlines;
  var old_render_str = SimplePersonalSite.Context.prototype.render_md_str;
  var new_render_str = function render_md_str() {
    var ctx = this;
    var args = Array.prototype.slice.call(arguments);
    var md = arguments[0];
    rexp.lastIndex = 0;

    var html = '';
    var match;
    var start = 0;
    while (match = rexp.exec(md)) {
      var end = match.index + (consume ? 0 : match[0].length);
      html += sectionify(start, end);
      start = end + match[0].length;
    }
    html += sectionify(start, md.length);
    return html;

    function sectionify(start, end) {
      var sectionMd = md.substring(start, end);
      var sectionArgs = Array.prototype.slice.call(args);
      sectionArgs[0] = sectionMd;
      var mdHtml = old_render_str.apply(ctx, sectionArgs);
      return '\n<div class="sps-ibe-editable-markup-edit-section" data-startpos='
          + start + ' data-endpos=' + end + '>' + mdHtml + '</div>\n';
    }
  };
  SimplePersonalSite.Context.prototype.render_md_str = new_render_str;
};
