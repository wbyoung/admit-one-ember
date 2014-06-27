'use strict';

var extractAuthorizationHeader = function(xhr) {
  var authorization = xhr.getResponseHeader('Authorization');
  var tokenMatch = authorization && authorization.match(/\s*token\s+(.*)\s*/i);
  var token = tokenMatch && tokenMatch[1];
  var invalidated = authorization && !!authorization.match(/\s*invalidated\s*/i);
  return [token, invalidated];
};

export { extractAuthorizationHeader };
