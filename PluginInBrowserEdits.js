var PluginInBrowserEdits = Util.createSingleton('PluginInBrowserEdits', function() {
  this.fileEditModal = new PluginInBrowserEdits.FileEditModal();
});
PluginInBrowserEdits.plugin = function plugin() {
  PluginInBrowserEdits.getInstance().init();
  SimplePersonalSite.Util.linkCss('PluginInBrowserEdits.css');
  return SimplePersonalSite.Util.pLinkJs(
      'https://cdn.rawgit.com/Nycto/PicoModal/master/src/picoModal.js');
};
PluginInBrowserEdits.port = 4113;
PluginInBrowserEdits.prototype.init = function init() {
  var old_render = SimplePersonalSite.Context.prototype.render_md_file;
  var new_render = function render_md() {
    var html = old_render.apply(this, arguments);
    var filename = arguments[0];
    return '<div class="sps-ibe-editable-markup" data-filename="' + filename + '"><div ' + 
        'onclick="PluginInBrowserEdits.getInstance().clickEdit(event)" class="sps-ibe-edit-btn">' +
        filename + '</div>' + html + '</div>';
  };
  SimplePersonalSite.Context.prototype.render_md_file = new_render;
};
PluginInBrowserEdits.prototype.clickEdit = function clickEdit(evt) {
  var filename = this.getFilename(evt);
  this.fileEditModal.pShow(filename).catch(console.error.bind(console));
};
PluginInBrowserEdits.prototype.getFilename = function getFilename(evt) {
  return evt.target.parentNode.dataset.filename;
};

PluginInBrowserEdits.FileEditModal = function FileEditModal() {
  this._modal = null;
  this._saved = false;
  this._p = null;
  this._filename = null;
};
PluginInBrowserEdits.FileEditModal.prototype.pShow = function pShow(filename) {
  var self = this;
  return SimplePersonalSite.Util.pFetch(filename)
    .then(function(md) {
      if (self._modal !== null) {
        return Promise.reject(new Error('Cannot show modal when another modal is up'));
      }
      self._filename = filename;
      self._saved = false;
      self._modal = picoModal('<textarea id="sps-ibe-file-text">' + md + '</textarea>');
      self._modal.show();
      self._p = new SimplePersonalSite.Util.ResolvablePromise();
      self._modal.beforeClose(self.beforeClose.bind(self));
      return self._p;
    });
};
PluginInBrowserEdits.FileEditModal.prototype.beforeClose = function beforeClose() {
  var self = this;
  try {
    if (self._saved) {
      return;
    }
    var elm = document.getElementById('sps-ibe-file-text');
    var content = elm.value;
    var msg = JSON.stringify({'filename': self._filename, 'content': content});
    var url = window.location.protocol + '//' + window.location.hostname + ':' +
        PluginInBrowserEdits.port;
    SimplePersonalSite.Util.pAjax(url, 'post', msg)
      .then(function() {
        self._saved = true;
        self._modal.close();
        self._modal = null;
        SimplePersonalSite.App.getInstance().refresh();
      })
      .then(self._p.resolve)
      .catch(self._p.reject);
  } catch (e) {
    self._p.reject(e);
  }
};
