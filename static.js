/* !
 * serve-static
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

let encodeUrl = require('encodeurl');
let escapeHtml = require('escape-html');
let parseUrl = require('parseurl');
let resolve = require('path').resolve;
let send = require('send');
let url = require('url');

/**
 * Module exports.
 * @public
 */

module.exports = serveStatic;
module.exports.mime = send.mime;

/**
 * @param {string} root
 * @param {object} [options]
 * @return {function}
 * @public
 */

function serveStatic(root, options) {
    if (!root) {
        throw new TypeError('root path required');
    }

    if (typeof root !== 'string') {
        throw new TypeError('root path must be a string');
    }

    // copy options object
    let opts = Object.create(options || null);

    // fall-though
    let fallthrough = opts.fallthrough !== false;

    // default redirect
    let redirect = opts.redirect !== false;

    // headers listener
    let setHeaders = opts.setHeaders;

    if (setHeaders && typeof setHeaders !== 'function') {
        throw new TypeError('option setHeaders must be function');
    }

    // setup options for send
    opts.maxage = opts.maxage || opts.maxAge || 0;
    opts.root = resolve(root);

    // construct directory listener
    let onDirectory = redirect
        ? createRedirectDirectoryListener()
        : createNotFoundDirectoryListener();

    return function serveStatic(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (fallthrough) {
                return next();
            }

            // method not allowed
            res.statusCode = 405;
            res.setHeader('Allow', 'GET, HEAD');
            res.setHeader('Content-Length', '0');
            res.end();
            return;
        }

        let forwardError = !fallthrough;
        let originalUrl = parseUrl.original(req);
        let path = parseUrl(req).pathname;

        // make sure redirect occurs at mount
        if (path === '/' && originalUrl.pathname.substr(-1) !== '/') {
            path = '';
        }

        // create send stream
        let stream = send(req, path, opts);

        // add directory handler
        stream.on('directory', onDirectory);

        // add headers listener
        if (setHeaders) {
            stream.on('headers', setHeaders);
        }

        // add file listener for fallthrough
        if (fallthrough) {
            stream.on('file', () => {
                // once file is determined, always forward error
                forwardError = true;
            });
        }

        // forward errors
        stream.on('error', (err) => {
            if (forwardError || !(err.statusCode < 500)) {
                next(err);
                return;
            }

            next();
        });
        stream.pipe(res);
    };
}

/**
 * Collapse all leading slashes into a single slash
 * @private
 */
function collapseLeadingSlashes(str) {
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) !== 0x2f /* / */) {
            break;
        }
    }

    return i > 1 ? '/' + str.substr(i) : str;
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument(title, body) {
    return (
        '<!DOCTYPE html>\n' +
        '<html lang="en">\n' +
        '<head>\n' +
        '<meta charset="utf-8">\n' +
        '<title>' +
        title +
        '</title>\n' +
        '</head>\n' +
        '<body>\n' +
        '<pre>' +
        body +
        '</pre>\n' +
        '</body>\n' +
        '</html>\n'
    );
}

/**
 * Create a directory listener that just 404s.
 * @private
 */

function createNotFoundDirectoryListener() {
    return function notFound() {
        this.error(404);
    };
}

/**
 * Create a directory listener that performs a redirect.
 * @private
 */

function createRedirectDirectoryListener() {
    return function redirect(res) {
        if (this.hasTrailingSlash()) {
            this.error(404);
            return;
        }

        // get original URL
        let originalUrl = parseUrl.original(this.req);

        // append trailing slash
        originalUrl.path = null;
        originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + '/');

        // reformat the URL
        let loc = encodeUrl(url.format(originalUrl));
        let doc = createHtmlDocument(
            'Redirecting',
            'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>'
        );

        // send redirect response
        res.statusCode = 301;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Length', Buffer.byteLength(doc));
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Location', loc);
        res.end(doc);
    };
}
