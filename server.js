//imports the http, fs and url module

const http = require('http'),
    fs = require('fs'),
    url = require('url');

    //createServer() function and another function that has two arguments request and response

http.createServer((request, response) => {
    let addr = request.url,
    q = url.parse(addr, true),
    filePath = '';

    //appendFile method of the fs module, arguments, file name, the new information and error handling function, new Date function grabs the current time
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestatmp: ' + new Date() + '\n\n', (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added to log.');
        }
    });

    if (q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else{
        filePath = 'index.html';
    }

    fs.readFile( filePath, (err, data) => {
        if (err){
            throw err;
        }

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
}).listen(8080);

console.log('My test server is running on Port 8080.');