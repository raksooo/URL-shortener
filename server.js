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

var CREATE = 'CREATE TABLE IF NOT EXISTS urlshortener (short varchar(16) PRIMARY KEY, link varchar(500), ip varchar(16), date datetime, clicks int);',
    SELECT = 'SELECT * FROM urlshortener WHERE short=?;',
    INSERT = 'INSERT INTO urlshortener (short, link, ip, date, clicks) VALUES (?, ?, ?, DATE_FORMAT(NOW(),\'%Y-%m-%d %H:%i\'), 0);',
    LOOKUP = 'SELECT short FROM urlshortener WHERE link=?;',
    ALLOWED = 'SELECT COUNT(short) as n FROM urlshortener WHERE ip = ? AND date = DATE_FORMAT(NOW(), \'%Y-%m-%d %H:%i\');';

var connection = mysql.createPool({
    host     : 'localhost',
    user     : secret.details.user,
    password : secret.details.password,
    database : secret.details.database
});
connection.query(CREATE);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/static/index.html");
});

app.get("/:shortened", function(req, res) {
    findLink(req.params.shortened, function(link) {
        if (link !== undefined) {
            res.redirect(link);
        } else {
            res.sendFile(__dirname + "/static/index.html");
        }
    });
});

app.post("/", function(req, res) {
    if (req.body.link === "") {
        res.end();
    } else {
        shorten(req.body.link, req.headers['x-forwarded-for'], function(shortened) {
            if (shortened) {
                res.send('http://' + req.hostname + '/' + shortened);
            } else {
                res.send('Wait a minute!')
            }
        });
    }
});

function findLink(shortened, callback) {
    connection.query(SELECT, [shortened], function(err, rows, fields) {
        if (rows && rows.length > 0) {
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

function shortenIfAllowed(ip, callback) {
    connection.query(ALLOWED, [ip], function(err, rows, fields) {
        if (rows[0].n <= 6) {
            generateShortWrapper(callback);
        } else {
            callback(undefined);
        }
    });
}

function shorten(link, ip, callback) {
    link = link.toLowerCase();
    if (link.indexOf('http') !== 0) {
        link = 'http://' + link;
    }
    connection.query(LOOKUP, [link], function(err, rows, fields) {
        if (rows.length > 0) {
            callback(rows[0].short);
        } else {
            shortenIfAllowed(ip, function(shortened) {
                connection.query(INSERT, [shortened, link, ip]);
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
