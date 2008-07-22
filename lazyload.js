/*
Class: LazyLoad

LazyLoad makes it easy and painless to lazily load one or more JavaScript
files on demand after a web page has been rendered.

Author:
  Ryan Grove (ryan@wonko.com)

Copyright:
  Copyright (c) 2007 Ryan Grove (ryan@wonko.com). All rights reserved.

License:
  New BSD License (http://www.opensource.org/licenses/bsd-license.html)

URL:
  http://wonko.com/article/527

Version:
  1.0.3 (2007-06-18)
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
      var request = {urls: urls, callback: callback, obj: obj, scope: scope};

      // If a previous load request is currently in progress, we'll wait our
      // turn.
      if (pending) {
        queue.push(request);
        return;
      }

      pending = request;

      // Cast urls to an Array.
      urls = urls.constructor === Array ? urls : [urls];
      
      // Load the scripts at the specified URLs.
      var script;

      for (var i = 0; i < urls.length; i += 1) {
        script = document.createElement('script');
        script.src = urls[i];
        document.body.appendChild(script);
      }
      
      if (!script) {
        return;
      }

      if ((/msie/i).test(navigator.userAgent) &&
          !(/AppleWebKit\/([^ ]*)/).test(navigator.userAgent) &&
          !(/opera/i).test(navigator.userAgent)) {

        // If this is IE, watch the last script's ready state.
        script.onreadystatechange = function () {
          if (this.readyState === 'loaded') {
            LazyLoad.requestComplete();
          }
        };
      } else {
        // If this is a browser that doesn't suck, append a scriptlet after the
        // last script.
        script = document.createElement('script');
        script.appendChild(document.createTextNode(
            'LazyLoad.requestComplete();'));
        document.body.appendChild(script);
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
          scripts = document.getElementsByTagName('script');

      urls = urls.constructor === Array ? urls : [urls];

      for (var i = 0; i < urls.length; i += 1) {
        var loaded = false,
            url    = urls[i];

        for (var j = 0; j < scripts.length; j += 1) {
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
        var request = queue.shift();
        this.load(request.urls, request.callback, request.obj, request.scope);
      }
    }
  };
}();
