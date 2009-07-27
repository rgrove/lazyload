/**
 * LazyLoad makes it easy and painless to lazily load one or more external
 * JavaScript or CSS files on demand either during or after the rendering of
 * a web page.
 *
 * Supported browsers include Firefox 2, Firefox 3, IE 6 through 8, Safari 3 and
 * 4 (including iPhone), Chrome, and Opera 9 and 10. Other browsers may or may
 * not work and are not officially supported.
 *
 * @module lazyload
 * @author Ryan Grove <ryan@wonko.com>
 * @copyright (c) 2009 Ryan Grove <ryan@wonko.com>. All rights reserved.
 * @license BSD License (http://www.opensource.org/licenses/bsd-license.html)
 * @url http://wonko.com/post/painless_javascript_lazy_loading_with_lazyload
 * @version 2.0.0
 */

/**
 * @class LazyLoad
 * @static
 */
LazyLoad = function () {

  // -- Private Variables ------------------------------------------------------

  // Shorthand reference to the browser's document object.
  var d = document,

  // Reference to the <head> element.
  head,

  // Requests currently in progress, if any.
  pending = {},

  // Queued requests.
  queue = {css: [], js: []},

  // User agent information.
  ua;

  // -- Private Methods --------------------------------------------------------

  function createNode(name, attrs) {
    var node = d.createElement(name), attr;

    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        node.setAttribute(attr, attrs[attr]);
      }
    }

    return node;
  }

  function finish(type) {
    var p = pending[type];

    if (!p) { return; }

    var callback = p.callback,
        obj      = p.obj,
        urls     = p.urls;

    urls.shift();

    // If this is the last of the pending URLs, execute the callback and
    // start the next request in the queue (if any).
    if (!urls.length) {
      if (callback) {
        if (obj) {
          if (p.scope) {
            callback.call(obj);
          } else {
            callback.call(window, obj);
          }
        } else {
          callback.call();
        }
      }

      pending[type] = null;

      if (queue[type].length) {
        load(type);
      }
    }
  }

  /**
   * Populates the <tt>ua</tt> variable with useragent information. Uses a
   * paraphrased version of the YUI useragent detection code.
   *
   * @method getUserAgent
   * @private
   */
  function getUserAgent() {
    // No need to run again if ua is already populated.
    if (ua) { return; }

    var nua = navigator.userAgent,
        pF  = parseFloat,
        m;

    ua = {
      gecko : 0,
      ie    : 0,
      opera : 0,
      webkit: 0
    };

    m = nua.match(/AppleWebKit\/(\S*)/);

    if (m && m[1]) {
      ua.webkit = pF(m[1]);
    } else {
      m = nua.match(/MSIE\s([^;]*)/);

      if (m && m[1]) {
        ua.ie = pF(m[1]);
      } else if ((/Gecko\/(\S*)/).test(nua)) {
        ua.gecko = 1;

        m = nua.match(/rv:([^\s\)]*)/);

        if (m && m[1]) {
          ua.gecko = pF(m[1]);
        }
      } else if (m = nua.match(/Opera\/(\S*)/)) {
        ua.opera = pF(m[1]);
      }
    }
  }

  function load(type, urls, callback, obj, scope) {
    var i, len, node, p, url;

    // Determine browser type and version.
    getUserAgent();

    if (urls) {
      // Cast urls to an Array.
      urls = urls.constructor === Array ? urls : [urls];

      // Create a request object for each URL. If multiple URLs are specified,
      // the callback will only be executed after all URLs have been loaded.
      //
      // Sadly, Firefox and Opera are the only browsers capable of loading
      // scripts in parallel while preserving execution order. In all other
      // browsers, scripts must be loaded sequentially.
      //
      // All browsers respect CSS specificity based on the order of the link
      // elements in the DOM, regardless of the order in which the stylesheets
      // are actually downloaded.
      if (type === 'css' || ua.gecko || ua.opera) {
        queue[type].push({
          urls    : [].concat(urls), // concat ensures copy by value
          callback: callback,
          obj     : obj,
          scope   : scope
        });
      } else {
        for (i = 0, len = urls.length; i < len; ++i) {
          queue[type].push({
            urls    : [urls[i]],
            callback: i === len - 1 ? callback : null, // callback is only added to the last URL
            obj     : obj,
            scope   : scope
          });
        }
      }
    }

    // If a previous load request of this type is currently in progress, we'll
    // wait our turn. Otherwise, grab the next item in the queue.
    if (pending[type] || !(p = pending[type] = queue[type].shift())) {
      return;
    }

    head = head || d.getElementsByTagName('head')[0];
    urls = p.urls;

    for (i = 0, len = urls.length; i < len; ++i) {
      url = urls[i];

      if (type === 'css') {
        node = createNode('link', {
          href : url,
          rel  : 'stylesheet',
          type : 'text/css'
        });
      } else {
        node = createNode('script', {src: url});
      }

      if (ua.ie) {
        node.onreadystatechange = function () {
          var readyState = this.readyState;

          if (readyState === 'loaded' || readyState === 'complete') {
            this.onreadystatechange = null;
            finish(type);
          }
        };
      } else if (type === 'css' && (ua.gecko || ua.webkit)) {
        // Gecko and WebKit don't support the onload event on link nodes, so we
        // just have to finish after a brief delay and hope for the best.
        setTimeout(function () { finish(type); }, 50 * len);
      } else {
        node.onload = node.onerror = function () { finish(type); };
      }

      head.appendChild(node);
    }
  }

  return {
    css: function (urls, callback, obj, scope) {
      load('css', urls, callback, obj, scope);
    },

    js: function (urls, callback, obj, scope) {
      load('js', urls, callback, obj, scope);
    }
  };
}();
