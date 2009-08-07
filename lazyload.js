/**
 * LazyLoad makes it easy and painless to lazily load one or more external
 * JavaScript or CSS files on demand either during or after the rendering of
 * a web page.
 *
 * Supported browsers include Firefox 2, Firefox 3, IE 6 through 8, Safari 3 and
 * 4 (including iPhone), Chrome, and Opera 9 and 10. Other browsers may or may
 * not work and are not officially supported.
 *
 * Visit http://github.com/rgrove/lazyload/ or
 * http://wonko.com/post/lazyload-200-released for more info.
 *
 * Copyright (c) 2009 Ryan Grove <ryan@wonko.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright notice,
 *     this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *   * Neither the name of this project nor the names of its contributors may be
 *     used to endorse or promote products derived from this software without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * @module lazyload
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

  /**
   * Creates and returns an HTML element with the specified name and attributes.
   *
   * @method createNode
   * @param {String} name element name
   * @param {Object} attrs name/value mapping of element attributes
   * @return {HTMLElement}
   * @private
   */
  function createNode(name, attrs) {
    var node = d.createElement(name), attr;

    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        node.setAttribute(attr, attrs[attr]);
      }
    }

    return node;
  }

  /**
   * Called when the current pending resource of the specified type has finished
   * loading. Executes the associated callback (if any) and loads the next
   * resource in the queue.
   *
   * @method finish
   * @param {String} type resource type ('css' or 'js')
   * @private
   */
  function finish(type) {
    var p = pending[type];

    if (!p) { return; }

    var callback = p.callback,
        urls     = p.urls;

    urls.shift();

    // If this is the last of the pending URLs, execute the callback and
    // start the next request in the queue (if any).
    if (!urls.length) {
      if (callback) {
        callback.call(p.scope || window, p.obj);
      }

      pending[type] = null;

      if (queue[type].length) {
        load(type);
      }
    }
  }

  /**
   * Populates the <code>ua</code> variable with useragent information. Uses a
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

  /**
   * Loads the specified resources, or the next resource of the specified type
   * in the queue if no resources are specified. If a resource of the specified
   * type is already being loaded, the new request will be queued until the
   * first request has been finished.
   *
   * When an array of resource URLs is specified, those URLs will be loaded in
   * parallel if it is possible to do so while preserving execution order. All
   * browsers support parallel loading of CSS, but only Firefox and Opera
   * support parallel loading of scripts. In browsers other than Firefox and
   * Opera, scripts will be queued and loaded one at a time to ensure correct
   * execution order.
   *
   * @method load
   * @param {String} type resource type ('css' or 'js')
   * @param {String|Array} urls (optional) URL or array of URLs to load
   * @param {Function} callback (optional) callback function to execute when the
   *   resource is loaded
   * @param {Object} obj (optional) object to pass to the callback function
   * @param {Object} scope (optional) if provided, the callback function will be
   *   executed in this object's scope
   * @private
   */
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

    /**
     * Requests the specified CSS URL or URLs and executes the specified
     * callback (if any) when they have finished loading. If an array of URLs is
     * specified, the stylesheets will be loaded in parallel and the callback
     * will be executed after all stylesheets have finished loading.
     *
     * Currently, Firefox and WebKit don't provide any way to determine when a
     * stylesheet has finished loading. In those browsers, the callback will be
     * executed after a brief delay. For information on a manual technique you
     * can use to detect when CSS has actually finished loading in Firefox and
     * WebKit, see http://wonko.com/post/how-to-prevent-yui-get-race-conditions
     * (which applies to LazyLoad as well, despite being originally written in
     * in reference to the YUI Get utility).
     *
     * @method css
     * @param {String|Array} urls CSS URL or array of CSS URLs to load
     * @param {Function} callback (optional) callback function to execute when
     *   the specified stylesheets are loaded
     * @param {Object} obj (optional) object to pass to the callback function
     * @param {Object} scope (optional) if provided, the callback function will
     *   be executed in this object's scope
     * @static
     */
    css: function (urls, callback, obj, scope) {
      load('css', urls, callback, obj, scope);
    },

    /**
     * Requests the specified JavaScript URL or URLs and executes the specified
     * callback (if any) when they have finished loading. If an array of URLs is
     * specified and the browser supports it, the scripts will be loaded in
     * parallel and the callback will be executed after all scripts have
     * finished loading.
     *
     * Currently, only Firefox and Opera support parallel loading of scripts
     * while preserving execution order. In browsers other than Firefox and
     * Opera, scripts will be queued and loaded one at a time to ensure correct
     * execution order.
     *
     * @method js
     * @param {String|Array} urls JS URL or array of JS URLs to load
     * @param {Function} callback (optional) callback function to execute when
     *   the specified scripts are loaded
     * @param {Object} obj (optional) object to pass to the callback function
     * @param {Object} scope (optional) if provided, the callback function will
     *   be executed in this object's scope
     * @static
     */
    js: function (urls, callback, obj, scope) {
      load('js', urls, callback, obj, scope);
    }

  };
}();
