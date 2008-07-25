/*
Class: LazyLoad

LazyLoad makes it easy and painless to lazily load one or more JavaScript
files on demand after a web page has been rendered.

Supported browsers include Firefox 2.x, Firefox 3.x, Internet Explorer 6.x,
Internet Explorer 7.x, Safari 3.x (including iPhone), and Opera 9.x. Other
browsers may or may not work and are not officially supported.

Author:
  Ryan Grove (ryan@wonko.com)

Copyright:
  Copyright (c) 2008 Ryan Grove (ryan@wonko.com). All rights reserved.

License:
  BSD License (http://www.opensource.org/licenses/bsd-license.html)

URL:
  http://wonko.com/post/painless_javascript_lazy_loading_with_lazyload

Version:
  1.0.4 (2008-07-24)
*/
var LazyLoad = function () {

  // -- Group: Private Variables -----------------------------------------------

  /*
  Object: d
  Shorthand reference to the browser's *document* object.
  */
  var d = document,

  /*
  Object: pending
  Pending request object, or null if no request is in progress.
  */
  pending = null,

  /*
  Array: queue
  Array of queued load requests.
  */
  queue = [],

  /*
  Object: ua
  User agent information.
  */
  ua;

  // -- Group: Private Methods -------------------------------------------------

  /*
  Method: getUserAgent
  Populates the *ua* variable with user agent information. Uses a paraphrased
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
      var head = d.getElementsByTagName('head')[0],
          i, script;

      if (urls) {
        // Cast urls to an Array.
        urls = urls.constructor === Array ? urls : [urls];

        // Create a request object for each URL. If multiple URLs are specified,
        // the callback will only be executed after the last URL is loaded.
        for (i = 0; i < urls.length; ++i) {
          queue.push({
            'url'     : urls[i],
            'callback': i === urls.length - 1 ? callback : null,
            'obj'     : obj,
            'scope'   : scope
          });
        }
      }

      // If a previous load request is currently in progress, we'll wait our
      // turn. Otherwise, grab the first request object off the top of the
      // queue.
      if (pending || !(pending = queue.shift())) {
        return;
      }

      // Determine browser type and version for later use.
      getUserAgent();

      // Load the script.
      script = d.createElement('script');
      script.src = pending.url;

      if (ua.ie) {
        // If this is IE, watch the last script's ready state.
        script.onreadystatechange = function () {
          if (this.readyState === 'loaded' ||
              this.readyState === 'complete') {
            LazyLoad.requestComplete();
          }
        };
      } else if (ua.gecko || ua.webkit >= 420) {
        // Firefox and Safari 3.0+ support the load/error events on script
        // nodes.
        script.onload  = LazyLoad.requestComplete;
        script.onerror = LazyLoad.requestComplete;
      }

      head.appendChild(script);

      if (!ua.ie && !ua.gecko && !(ua.webkit >= 420)) {
        // Try to use script node blocking to figure out when things have
        // loaded. This works well in Opera, but may or may not be reliable in
        // other browsers. It definitely doesn't work in Safari 2.x.
        script = d.createElement('script');
        script.appendChild(d.createTextNode('LazyLoad.requestComplete();'));
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
          scripts = d.getElementsByTagName('script'),
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
        LazyLoad.load(newUrls, callback, obj, scope);
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
      if (queue.length) {
        LazyLoad.load();
      }
    }
  };
}();
