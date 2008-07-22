/*
Class: LazyLoad

LazyLoad makes it easy and painless to lazily load one or more JavaScript
files on demand after a web page has been rendered.

Author:
  Ryan Grove (ryan@wonko.com)

Copyright:
  Copyright (c) 2007-2008 Ryan Grove (ryan@wonko.com)

License:
  New BSD License (http://www.opensource.org/licenses/bsd-license.html)

URL:
  http://wonko.com/post/painless_javascript_lazy_loading_with_lazyload

Version:
  1.0.4 (?)
*/
var LazyLoad = function () {

  // -- Group: Private Variables -----------------------------------------------

  /*
  Object: pending
  Pending request object, or null if no request is in progress.
  */
  var pending = null;

  /*
  Array: queue
  Array of queued load requests.
  */
  var queue = [];
  
  /*
  Object: ua
  User agent information.
  */
  var ua;
  
  // -- Group: Private Methods -------------------------------------------------
  
  /*
  Method: getUserAgent
  Populates the _ua_ variable with user agent information. Uses a paraphrased
  version of the YUI user agent detection code.
  */
  function getUserAgent() {
    // No need to run again if ua is already populated.
    if (ua) {
      return;
    }

    var nua = navigator.userAgent, m;

    ua = {
      gecko : 0,
      ie    : 0,
      webkit: 0
    };

    m = nua.match(/AppleWebKit\/(\S*)/);

    if (m && m[1]) {
      ua.webkit = parseFloat(m[1]);
    } else {
      m = nua.match(/MSIE\s([^;]*)/);

      if (m && m[1]) {
        ua.ie = parseFloat(m[1]);
      } else if ((/Gecko\/(\S*)/).test(nua)) {
        ua.gecko = 1;

        m = nua.match(/rv:([^\s\)]*)/);

        if (m && m[1]) {
          ua.gecko = parseFloat(m[1]);
        }
      }
    }
  }

  return {
    // -- Group: Public Methods ------------------------------------------------

    /*
    Method: load
    Loads the specified script(s) and runs the specified callback function
    when all scripts have been completely loaded.

    Parameters:
      urls     - URL or array of URLs of scripts to load
      callback - function to call when loading is complete
      obj      - (optional) object to pass to the callback function
      scope    - (optional) if true, *callback* will be executed in the scope
                 of *obj* instead of receiving *obj* as an argument.
    */
    load: function (urls, callback, obj, scope) {
      var head    = document.getElementsByTagName('head')[0],
          request = {urls: urls, callback: callback, obj: obj, scope: scope},
          i, script;

      // If a previous load request is currently in progress, we'll wait our
      // turn.
      if (pending) {
        queue.push(request);
        return;
      }

      pending = request;

      // Cast urls to an Array.
      urls = urls.constructor === Array ? urls : [urls];

      // Determine browser type and version for later use.
      getUserAgent();

      // Load the scripts at the specified URLs.
      for (i = 0; i < urls.length; ++i) {
        script = document.createElement('script');
        script.src = urls[i];
        head.appendChild(script);
      }

      if (!script) {
        return;
      }

      if (ua.ie) {
        // If this is IE, watch the last script's ready state.
        script.onreadystatechange = function () {
          if (this.readyState === 'loaded') {
            LazyLoad.requestComplete();
          }
        };
      } else if (ua.webkit >= 420) {
        // Safari 3.0+ support the load event on script nodes. Technically
        // Firefox supports this as well, but Firefox doesn't fire the event on
        // a 404, which prevents queued scripts from being loaded.
        script.addEventListener('load', function () {
          LazyLoad.requestComplete();
        });
      } else {
        // Try to use script node blocking to figure out when things have
        // loaded. This works well in Firefox, but may or may not be reliable in
        // other browsers. It definitely doesn't work in Safari 2.x.
        script = document.createElement('script');
        script.appendChild(document.createTextNode(
            'LazyLoad.requestComplete();'));
        head.appendChild(script);
      }
    },

    /*
    Method: loadOnce
    Loads the specified script(s) only if they haven't already been loaded
    and runs the specified callback function when loading is complete. If all
    of the specified scripts have already been loaded, the callback function
    will not be executed unless the *force* parameter is set to true.

    Parameters:
      urls     - URL or array of URLs of scripts to load
      callback - function to call when loading is complete
      obj      - (optional) object to pass to the callback function
      scope    - (optional) if true, *callback* will be executed in the scope
                 of *obj* instead of receiving *obj* as an argument
      force    - (optional) if true, *callback* will always be executed, even if
                 all specified scripts have already been loaded
    */
    loadOnce: function (urls, callback, obj, scope, force) {
      var newUrls = [],
          scripts = document.getElementsByTagName('script'),
          i, j, loaded, url;

      urls = urls.constructor === Array ? urls : [urls];

      for (i = 0; i < urls.length; ++i) {
        loaded = false;
        url    = urls[i];

        for (j = 0; j < scripts.length; ++j) {
          if (url === scripts[j].src) {
            loaded = true;
            break;
          }
        }

        if (!loaded) {
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        this.load(newUrls, callback, obj, scope);
      } else if (force) {
        if (obj) {
          if (scope) {
            callback.call(obj);
          } else {
            callback.call(window, obj);
          }
        } else {
          callback.call();
        }
      }
    },

    /*
    Method: requestComplete
    Handles callback execution and cleanup after a request is completed. This
    method should not be called manually.
    */
    requestComplete: function () {
      var request;

      // Execute the callback.
      if (pending.callback) {
        if (pending.obj) {
          if (pending.scope) {
            pending.callback.call(pending.obj);
          } else {
            pending.callback.call(window, pending.obj);
          }
        } else {
          pending.callback.call();
        }
      }

      pending = null;

      // Execute the next load request on the queue (if any).
      if (queue.length > 0) {
        request = queue.shift();
        this.load(request.urls, request.callback, request.obj, request.scope);
      }
    }
  };
}();
