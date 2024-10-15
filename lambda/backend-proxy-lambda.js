const http = require('http');  // For handling HTTP requests
const https = require('https'); // For handling HTTPS requests
const url = require('url');

// Mapping of path to backend URLs
const mapping = {
  "repo": "http://router.robotlab-x.com:80",
  "repo2": "https://repo.myrobotlab.org",
  "google": "https://www.google.com",
  "ip": "https://api.ipify.org",  
  "build": "https://build.myrobotlab.org:8443"
};
 
exports.handler = async (event) => {
  try {

    console.info('Received event:', JSON.stringify(event, null, 2));

    // Extract the app name (e.g., repo or build) from the path
    const pathParts = event.path.split('/')
    const appName = pathParts[1];  // appName will be 'repo' or 'build'
    const targetUrl = mapping[appName];

    console.info(`path: ${event.path}`);
    console.info(`pathParts: ${pathParts}`);
    console.info(`appName: ${appName}`);
    console.info(`targetUrl: ${targetUrl}`);

    if (!targetUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" }),
      };
    }

    // Remove the stage and appName parts from the path
    const strippedPath = '/' + pathParts.slice(2).join('/');  // Remove the "prod" and "appName" parts

    console.info(`Stripped path: ${strippedPath}`);

    // Parse the target URL and determine if it's HTTP or HTTPS
    const parsedUrl = url.parse(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;  // Use correct protocol (HTTP/HTTPS)
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: strippedPath,  // Use the stripped path
      method: event.httpMethod,
      headers: event.headers,
      rejectUnauthorized: false, // Optional: Disable SSL cert validation (only in dev environments)
    };

    const fullUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}${strippedPath}`;
    console.log(`Requesting ${options.method} ${fullUrl}`);    

    // Forward the request to the target backend
    return await new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data,
            headers: res.headers,
          });
        });
      });

      req.on('error', (e) => {
        // Properly format the error for logging and response
        const errorMessage = `Request failed: ${e.message}`;
        console.error(errorMessage, e);
        reject({
          statusCode: 500,
          body: JSON.stringify({ message: errorMessage, error: e.message }),
        });
      });

      req.end();
    });
  } catch (err) {
    // Ensure that all errors are properly formatted as JSON or strings
    const errorMessage = `Unexpected error: ${JSON.stringify(err)}`;
    console.error(errorMessage, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An unexpected error occurred", error: errorMessage }),
    };
  }
};
