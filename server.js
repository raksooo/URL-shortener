var secret = require("./secret"),
    mysql = require("mysql"),
    bodyParser = require('body-parser'),
    finalhandler = require('finalhandler'),
    serveStatic = require('serve-static'),
    express = require('express'),
    app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/static", serveStatic(__dirname + "/static/"));

var shortenedLength = 2;

var chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "_"];

var SELECT = 'SELECT link FROM shortenedlinks WHERE short=?;',
    INSERT = 'INSERT INTO shortenedlinks (short, link) VALUES (?, ?);',
    LOOKUP = 'SELECT short FROM shortenedlinks WHERE link=?;';

var connection = mysql.createPool({
    host     : 'localhost',
    user     : secret.details.user,
    password : secret.details.password,
    database : secret.details.database
});

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/static/index.html");
});

app.get("/:shortened", function(request, response) {
    findLink(request.params.shortened, function(link) {
        if (link !== undefined) {
            response.redirect(link);
        } else {
            response.sendFile(__dirname + "/static/index.html");
        }
    });
});

app.post("/", function(request, response) {
    shorten(request.body.link, function(shortened) {
        response.send('http://' + request.hostname + '/' + shortened);
    });
});

function findLink(shortened, callback) {
    connection.query(SELECT, [shortened], function(err, rows, fields) {
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

function generateShortWrapper(callback) {
    var shortened = generateShort();
    connection.query(SELECT, [shortened], function(err, rows, fields) {
        if (rows.length > 0) {
            generateShortWrapper(callback);
        } else {
            callback(shortened);
        }
    });
}

function shorten(link, callback) {
    if (link.indexOf('http') !== 0) {
        link = 'http://' + link;
    }
    connection.query(LOOKUP, [link], function(err, rows, fields) {
        if (rows.length > 0) {
            callback(rows[0].short);
        } else {
            generateShortWrapper(function(shortened) {
                connection.query(INSERT, [shortened, link]);
                callback(shortened);
            });
        }
    });
}

var server = app.listen(8888, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
