var PluginInBrowserEdits = Util.createSingleton('PluginInBrowserEdits', function() {
  this._editing = null;
  this._saved = false;
});
PluginInBrowserEdits.plugin = function plugin() {
  PluginInBrowserEdits.getInstance().init();
  SimplePersonalSite.Util.linkCss('PluginInBrowserEdits.css');
};
PluginInBrowserEdits.port = 4113;
PluginInBrowserEdits.autoGrow = function autoGrow(elm) {
  // http://stackoverflow.com/a/24676492/1433127
  elm.style.height = "auto";
  elm.style.height = (elm.scrollHeight)+"px";
};
PluginInBrowserEdits.defaultConfig = {
  tabSize: 2,
  tabChar: ' ',
};
PluginInBrowserEdits.prototype.setConfig = function setConfig(config) {
  this.config = _.defaults({}, config, this.config, PluginInBrowserEdits.defaultConfig);
};
PluginInBrowserEdits.prototype.init = function init() {
  this.setConfig();
  var old_render = SimplePersonalSite.Context.prototype.render_md_file;
  var new_render = function render_md() {
    var html = old_render.apply(this, arguments);
    var filename = arguments[0];
    return '<div class="sps-ibe-editable-markup" data-filename="' + filename + '" ' +
        'ondblclick="PluginInBrowserEdits.getInstance().clickEdit(event)"><div ' +
        'onclick="PluginInBrowserEdits.getInstance().clickEdit(event)" ' +
        'class="sps-ibe-edit-btn">' + filename + '</div>' + html + '</div>';
  };
  SimplePersonalSite.Context.prototype.render_md_file = new_render;
};
PluginInBrowserEdits.prototype.onKeyDown = function onKeyDown(evt, elm) {
  switch (evt.keyCode) {
    case 9: return this.doTabDown(evt, elm);
  }
};
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
PluginInBrowserEdits.prototype.clickEdit = function clickEdit(evt) {
  var container = evt.target;
  while (container !== null && !container.classList.contains('sps-ibe-editable-markup')) {
    container = container.parentNode;
  }
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
      .then(function(md) {
        container.innerHTML =
            '<div class="sps-ibe-save-btn">save</div><textarea ' +
            'onblur="PluginInBrowserEdits.getInstance().clickSave()" ' +
            'oninput="PluginInBrowserEdits.autoGrow(this)" ' +
            'onkeydown="PluginInBrowserEdits.getInstance().onKeyDown(event, this)" ' +
            'id="sps-ibe-file-text">' +
            md + '</textarea>';
        container.childNodes[1].focus();
        PluginInBrowserEdits.autoGrow(container.childNodes[1]);
        self._saved = false;
      })
      .catch(console.error.bind(console));
};
PluginInBrowserEdits.prototype.clickSave = function clickSave(evt) {
  if (this._saved) {
    return;
  }
  this._saved = true;
  var elm = document.getElementById('sps-ibe-file-text');
  var content = elm.value;
  var msg = JSON.stringify({'filename': elm.parentNode.dataset.filename,
      'content': content});
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
