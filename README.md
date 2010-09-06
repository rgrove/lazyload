LazyLoad
========

LazyLoad is a tiny (only 818 bytes minified and gzipped), dependency-free
JavaScript library that makes it super easy to load external JavaScript and CSS
files on demand. It's ideal for quickly and unobtrusively loading large external
scripts and stylesheets either lazily after the rest of the page has finished
loading or on demand as needed.

In addition to CSS support, this version of LazyLoad also adds support for
parallel loading of multiple resources in browsers that support it. To load
multiple resources in parallel, simply pass an array of URLs in a single
LazyLoad call.

Downloads
---------

  * [lazyload.js](http://pieisgood.org/files/lazyload-2.0.0/lazyload.js) (full source)
  * [lazyload-min.js](http://pieisgood.org/files/lazyload-2.0.0/lazyload-min.js) (minified source)
  * Archive: [tgz](http://github.com/rgrove/lazyload/tarball/release-2.0.0) | [zip](http://github.com/rgrove/lazyload/zipball/release-2.0.0)

Usage
-----

Using LazyLoad is simple. Just call the appropriate method -- `css()` to load
CSS, `js()` to load JavaScript -- and pass in a URL or array of URLs to load.
You can also provide a callback function if you'd like to be notified when the
resources have finished loading, as well as an argument to pass to the callback
and a context in which to execute the callback.

    // Load a single JavaScript file and execute a callback when it finishes.
    LazyLoad.js('http://example.com/foo.js', function () {
      alert('foo.js has been loaded');
    });

    // Load multiple JS files and execute a callback when they've all finished.
    LazyLoad.js(['foo.js', 'bar.js', 'baz.js'], function () {
      alert('all files have been loaded');
    });

    // Load a CSS file and pass an argument to the callback function.
    LazyLoad.css('foo.css', function (arg) {
      alert(arg);
    }, 'foo.css has been loaded');

    // Load a CSS file and execute the callback in a different scope.
    LazyLoad.css('foo.css', function () {
      alert(this.foo); // displays 'bar'
    }, null, {foo: 'bar'});

Supported Browsers
------------------

  * Firefox 2+
  * Google Chrome (all versions)
  * Internet Explorer 6+
  * Opera 9+
  * Safari 3+
  * Mobile Safari (all versions)

Other browsers may work, but haven't been tested. It's a safe bet that anything
based on a recent version of Gecko or WebKit will probably work.

Caveats
-------

All browsers support parallel loading of CSS. However, only Firefox and Opera
currently support parallel script loading while preserving execution order. To
ensure that scripts are always executed in the correct order, LazyLoad will load
all scripts sequentially in browsers other than Firefox and Opera. Hopefully
other browsers will improve their parallel script loading behavior soon.

Sadly, Firefox doesn't provide any indication when a CSS file has finished
loading. In Firefox, CSS load callbacks will execute after a short delay, but
there's no way to automatically guarantee that the CSS has finished loading
before the callback is executed. Luckily, there's a fairly painless
[manual workaround](http://wonko.com/post/how-to-prevent-yui-get-race-conditions)
that you can use to detect when CSS has finished loading, but it's not possible
for LazyLoad to do it for you.

License
-------

Copyright (c) 2010 Ryan Grove (ryan@wonko.com).
All rights reserved.
 
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
 
  * Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
  * Neither the name of this project nor the names of its contributors may be
    used to endorse or promote products derived from this software without
    specific prior written permission.
 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
