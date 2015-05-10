var secret = require("./secret");
var fs = require('fs');
var mysql = require("mysql");
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

var shortenedLength = 4;

var chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "_"];

var connection = mysql.createPool({
    host     : 'localhost',
    user     : secret.details.user,
    password : secret.details.password,
    database : secret.details.database
});

app.get("/", function(request, response) {
    serveForm(function(index) {
        response.end(index);
    });
});

app.get("/:shortened", function(request, response) {
    findLink(request.params.shortened, function(link) {
        if (link !== undefined) {
            response.redirect(link);
        } else {
            serveForm(function(index) {
                response.end(index);
            });
        }
    });
});

app.post("/", function(request, response) {
    response.send('http://is.rascal.sexy/' + shorten(request.body.link));
});

function serveForm(callback) {
    fs.readFile(__dirname + '/index.html', function(err, index) {
        callback(index);
    });
}

function findLink(shortened, callback) {
    connection.query('SELECT link FROM shortenedlinks WHERE short=?;', [shortened], function(err, rows, fields) {
        if (rows.length > 0) {
            callback(rows[0].link);
        } else {
            callback(undefined);
        }
    });
}

function generateShort() {
    var shortened = "";
    while (shortened.length < shortenedLength) {
        var random = Math.floor(Math.random() * (chars.length - 1));
        shortened += chars[random];
    }

    return shortened;
}

function shorten(link) {
    var shortened = generateShort();
    connection.query('INSERT INTO shortenedlinks (short, link) VALUES (?, ?);', [shortened, link]);
    return shortened;
}

var server = app.listen(8888, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
