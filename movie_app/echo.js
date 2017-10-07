var express = require("express");
var $ = require("jquery")
var app = express();
var empty = require('is-empty');
var methodOverride = require("method-override");
var expressSanitizer = require("express-sanitizer");

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(expressSanitizer());
app.use(methodOverride("_method"));
var mysql = require('mysql'); //connect to mysql database

app.use(express.static("public"));
app.set("view engine", "ejs");

var db_config ;

var con;

function handleDisconnect() {
    db_config = {
        host: "us-cdbr-iron-east-05.cleardb.net",
        user: "b619a13048e9f7",
        password: "f8eb3cec",
        database: "heroku_b56503d115070c6",
        multipleStatements: true
    }

    con = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    con.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        }
        else { // connnection idle timeout (the wait_timeout
            handleDisconnect(); // server variable configures this)
        }
    });
}

handleDisconnect();

// var con = mysql.createConnection(db_config);

// con.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
// });

app.get("/", function(req, res) {
    res.render("index");
});


app.get("/movies/new", function(req, res) {
    var sql = "select director_name from director";
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        var director = result;
        console.log(director[0]);
        var sql2 = "select actor_name from actor;";
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql + " succeeded");
            var actor = result;
            res.render("newmovie", { director: director, actor: actor });
        });

    });
});

app.post("/movies", function(req, res) {
    var body = req.body;
    console.log(req.body);
    console.log("===========")
    console.log(req.body);
    var sql1 = "select id from movie order by id desc limit 1;select id from actor order by id desc limit 1;select id from director order by id desc limit 1";
    console.log(sql1);
    con.query(sql1, function(err, result) {
        if (err) throw err;
        console.log("query " + sql1 + " succeeded");
        var id = result[0][0].id + 1;
        var id1 = result[1][0].id + 1;
        var id2 = result[2][0].id + 1;
        console.log(result);
        console.log(id);
        console.log("actor id:" + id1);
        var sql2 = "INSERT INTO movie(id,title,year,score,link,director_id) VALUES (" + id + ",'" + body.Title + "'," + body.Year + "," + body.Score + ",'" + body.Link + "'," +
            id2 + ");";
        console.log(sql2);
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql2 + " succeeded");
            var sql3 = "INSERT INTO director(id,director_name,directo_facebook_likes) VALUES (" + id + ",'" + body.Director + "'," + body.Director_facebook + ");";
            console.log(sql3);
            con.query(sql3, function(err, result) {
                if (err) throw err;
                console.log("query " + sql3 + " succeeded");
                var sql4 = "INSERT INTO actor(id,actor_name,facebook_likes) VALUES (" + id1 + ",'" + body.Actor1 + "'," + body.Actor1_facebook + ");" +
                    "INSERT INTO actor(id,actor_name,facebook_likes) VALUES (" + (id1 + 1) + ",'" + body.Actor2 + "'," + body.Actor2_facebook + ");" +
                    "INSERT INTO actor(id,actor_name,facebook_likes) VALUES (" + (id1 + 2) + ",'" + body.Actor3 + "'," + body.Actor3_facebook + ");" +
                    "INSERT INTO movie_actor_relation(actor_id,movie_id) VALUES (" + id1 + "," + id + ");" +
                    "INSERT INTO movie_actor_relation(actor_id,movie_id) VALUES (" + (id1 + 1) + "," + id + ");" +
                    "INSERT INTO movie_actor_relation(actor_id,movie_id) VALUES (" + (id1 + 2) + "," + id + ");";
                console.log(sql4);
                con.query(sql4, function(err, result) {
                    if (err) throw err;
                    console.log("query " + sql4 + " succeeded");
                    res.redirect("/movies");
                });
            });
        });
    });
});

app.get("/movies", function(req, res) {
    var cur_number = 1;
    var cur_items = 50;
    var order_item = "movie.id";
    var order = "asc";
    var page = { number: cur_number, items_per_page: cur_items, order_item: order_item, order: order };
    var selected = ["movie.id", "movie.title", "movie.year", "movie.score", "movie.link", "director.director_name", "group_concat(actor.actor_name order by actor.id) as list"];
    var new_select = [];
    var select_string = "";
    console.log(selected);
    console.log(req.query);
    console.log(req.body);
    if (!empty(req.query)) {
        if (req.query.page != undefined) {
            cur_number = req.query.page;
            page.number = cur_number;
        }
        if (req.query.order != undefined) {
            order = req.query.order;
            page.order = order;
        }
        if (req.query.order_item != undefined) {
            order_item = req.query.order_item;
            page.order_item = order_item;
        }
        if (req.query.number == "chosen") {
            new_select.push("movie.id");
        }
        if (req.query.title == "chosen") {
            new_select.push("movie.title,movie.link");
        }
        if (req.query.year == "chosen") {
            new_select.push("movie.year");
        }
        if (req.query.rank == "chosen") {
            new_select.push("movie.score");
        }
        if (req.query.director == "chosen") {
            new_select.push("director.director_name");
        }
        if (req.query.actor == "chosen") {
            new_select.push("group_concat(actor.actor_name order by actor.id) as list");
        }
    }
    console.log(new_select);
    if (!empty(new_select)) {
        selected = new_select.slice();
    }
    select_string = selected.join();
    console.log(select_string);
    var sql = "select " + select_string + " from movie left join director on movie.director_id = director.id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id order by " + order_item + " " + order;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result[0]);
        res.render("movies", { page: page, result: result });
    });
});

app.get("/actors", function(req, res) {
    var cur_number = 1;
    var cur_items = 50;
    var order_item = "actor.id";
    var order = "asc";
    var page = { number: cur_number, items_per_page: cur_items, order_item: order_item, order: order };
    var selected = ["actor.id", "actor.actor_name", "actor.facebook_likes", "group_concat(movie.title order by movie.id) as movies", "group_concat(director.director_name order by director.id) as directors"];
    var new_select = [];
    var select_string = "";
    console.log(req.query);
    if (!empty(req.query)) {
        if (req.query.page != undefined) {
            cur_number = req.query.page;
            page.number = cur_number;
        }
        if (req.query.order != undefined) {
            order = req.query.order;
            page.order = order;
        }
        if (req.query.order != undefined) {
            order = req.query.order;
            page.order = order;
        }
        if (req.query.order_item != undefined) {
            order_item = req.query.order_item;
            page.order_item = order_item;
        }
        if (req.query.number == "chosen") {
            new_select.push("actor.id");
        }
        if (req.query.name == "chosen") {
            new_select.push("actor.actor_name");
        }
        if (req.query.facebook_likes == "chosen") {
            new_select.push("actor.facebook_likes");
        }
        if (req.query.movie_attended == "chosen") {
            new_select.push("group_concat(movie.title order by movie.id) as movies");
        }
        if (req.query.director == "chosen") {
            new_select.push("group_concat(director.director_name order by director.id) as directors");
        }
    }
    console.log(new_select);
    if (!empty(new_select)) {
        selected = new_select.slice();
    }
    select_string = selected.join();
    console.log(select_string);
    var sql = "select " + select_string + " from actor " +
        "inner join movie_actor_relation on actor.id=movie_actor_relation.actor_id " +
        "inner join movie on movie_actor_relation.movie_id = movie.id " +
        "inner join director on movie.director_id=director.id group by actor.id order by " + order_item + " " + order;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result[0]);
        res.render("actors", { page: page, result: result });
    });
});

app.get("/directors", function(req, res) {
    var cur_number = 1;
    var cur_items = 50;
    var order_item = "director.id";
    var order = "asc";
    var page = { number: cur_number, items_per_page: cur_items, order_item: order_item, order: order };
    var selected = ["director.id", "director.director_name", "director.directo_facebook_likes", "group_concat(movie.title order by movie.id) as movies", "group_concat(actor.actor_name order by actor.id) as actors"];
    var new_select = [];
    var select_string = "";
    console.log(req.query);
    if (!empty(req.query)) {
        if (req.query.page != undefined) {
            cur_number = req.query.page;
            page.number = cur_number;
        }
        if (req.query.order != undefined) {
            order = req.query.order;
            page.order = order;
        }
        if (req.query.order != undefined) {
            order = req.query.order;
            page.order = order;
        }
        if (req.query.order_item != undefined) {
            order_item = req.query.order_item;
            page.order_item = order_item;
        }
        if (req.query.number == "chosen") {
            new_select.push("director.id");
        }
        if (req.query.name == "chosen") {
            new_select.push("director.director_name");
        }
        if (req.query.facebook_likes == "chosen") {
            new_select.push("director.directo_facebook_likes");
        }
        if (req.query.movies == "chosen") {
            new_select.push("group_concat(movie.title order by movie.id) as movies");
        }
        if (req.query.actors == "chosen") {
            new_select.push("group_concat(actor.actor_name order by actor.id) as actors");
        }
    }
    console.log(new_select);
    if (!empty(new_select)) {
        selected = new_select.slice();
    }
    select_string = selected.join();
    console.log(select_string);
    var sql = "select " + select_string +
        " from director inner join movie on director.id=movie.director_id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id " +
        "group by director.id order by " + order_item + " " + order;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result[0]);
        res.render("directors", { page: page, result: result });
    });
});

app.get("/movies/:id", function(req, res) {
    console.log(req.params);
    var sql = "select movie.id,movie.title,movie.year,movie.score,movie.link,director.director_name,group_concat(actor.actor_name order by actor.id) as list " +
        "from movie inner join director on movie.director_id = director.id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id having movie.id=" + req.params.id;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result);
        res.render("movie", { result: result });
    });
});

app.get("/actors/:id", function(req, res) {
    console.log(req.params);
    var sql = "select actor.id, actor.actor_name, actor.facebook_likes, " +
        "group_concat(movie.title order by movie.id) as movies, " +
        "group_concat(director.director_name order by director.id) as directors from actor " +
        "inner join movie_actor_relation on actor.id=movie_actor_relation.actor_id " +
        "inner join movie on movie_actor_relation.movie_id = movie.id " +
        "inner join director on movie.director_id=director.id group by actor.id having actor.id=" + req.params.id + ";";
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result);
        res.render("actor", { result: result });
    });
});

app.get("/directors/:id", function(req, res) {
    console.log(req.params);
    var sql = "select director.id, director.director_name, director.directo_facebook_likes, group_concat(movie.title order by movie.id) as movies," +
        " group_concat(actor.actor_name order by actor.id) as actors " +
        "from director inner join movie on director.id=movie.director_id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id " +
        "group by director.id having director.id=" + req.params.id + ";";
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result);
        res.render("director", { result: result });
    });
});

app.get("/movies/:id/edit", function(req, res) {
    console.log(req.params);
    var sql = "select movie.id,movie.title,movie.year,movie.score,movie.link,director.director_name,group_concat(actor.actor_name order by actor.id) as list " +
        "from movie inner join director on movie.director_id = director.id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id having movie.id=" + req.params.id;
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        console.log(result[0]);
        var movie = result;
        var sql2 = "select actor_name from actor";
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql2 + " succeeded");
            console.log(result[0]);
            var actor = result;
            var sql3 = "select director_name from director";
            con.query(sql3, function(err, result) {
                if (err) throw err;
                console.log("query " + sql3 + " succeeded");
                var director = result;
                console.log(director[0]);
                res.render("movieUpdate", { movie: movie, actor: actor, director: director });
            });
        });
    });
});

app.get("/actors/:id/edit", function(req, res) {
    console.log(req.params);
    var sql = "select actor.id, actor.actor_name, actor.facebook_likes, " +
        "group_concat(movie.title order by movie.id) as movies, " +
        "group_concat(director.director_name order by director.id) as directors from actor " +
        "inner join movie_actor_relation on actor.id=movie_actor_relation.actor_id " +
        "inner join movie on movie_actor_relation.movie_id = movie.id " +
        "inner join director on movie.director_id=director.id group by actor.id having actor.id=" + req.params.id + ";";
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        var actor = result;
        console.log(actor[0]);
        var sql2 = "select title from movie;";
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql2 + " succeeded");
            var movie = result;
            console.log(movie[0]);
            res.render("actorUpdate", { movie: movie, actor: actor });
        });
    });
});

app.get("/directors/:id/edit", function(req, res) {
    var id = req.params.id;
    console.log(req.params);
    var sql = "select director.id, director.director_name, director.directo_facebook_likes, group_concat(movie.title order by movie.id) as movies," +
        " group_concat(actor.actor_name order by actor.id) as actors " +
        "from director inner join movie on director.id=movie.director_id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id " +
        "group by director.id having director.id=" + id + " ";
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        var director = result;
        console.log(director[0]);
        var sql2 = "select title from movie;";
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql2 + " succeeded")
            var movie = result;
            console.log(director[0]);
            res.render("directorUpdate", { movie: movie, director: director });
        });
    });
});

app.delete("/movies/:id", function(req, res) {
    var id = req.params.id;
    let director_id;
    var sql1 = "select director_id from movie where id=" + id + ";";
    con.query(sql1, function(err, result) {
        if (err) throw err;
        console.log("query " + sql1 + " succeeded");
        console.log(result);
        director_id = result[0].director_id;
        console.log(director_id);
        var sql2 = "delete from director where id=" + director_id + ";";
        console.log(sql2);
        con.query(sql2, function(err, result) {
            if (err) throw err;
            console.log("query " + sql2 + " succeeded");
            res.send("/movies");
        });

    });

});

app.delete("/actors/:id", function(req, res) {
    var id = req.params.id;
    var sql = "delete from actor where id=" + id + ";";
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        res.send("/actors");
    });
});

app.delete("/directors/:id", function(req, res) {
    var id = req.params.id;
    var sql = "delete from director where id=" + id + ";";
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        res.send('/directors');
    });
});


app.put("/movies/:id", function(req, res) {
    var id = req.params.id;
    var body = req.body;
    console.log(req.body);
    console.log(id);
    var sql = "update movie set title='" + body.Title + "', year=" + body.Year + ",score=" + body.Score + ",link='" + body.Link +
        "',director_id=" + " (select id from director where director_name='" + body.director1 + "' limit 1) where id=" + id;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        res.redirect("/movies/" + id);
    });
});

app.put("/actors/:id", function(req, res) {
    var id = req.params.id;
    var body = req.body;
    console.log(req.body);
    console.log(id);
    var sql = "update actor set actor_name='" + body.name + "', facebook_likes=" + body.facebook_likes + " where id=" + id + ";update movie_actor_relation set movie_id=(select id from movie where title = '" + body.movie + "' limit 1) where " +
        "actor_id=" + id;
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        res.redirect("/actors/" + id);
    });
});

app.put("/directors/:id", function(req, res) {
    var id = req.params.id;
    var body = req.body;
    console.log(req.body);
    console.log(id);
    var sql = "update director set director_name='" + body.name + "', directo_facebook_likes=" + body.facebook_likes + " where id=" + id + ";";
    console.log(sql);
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("query " + sql + " succeeded");
        res.redirect("/directors/" + id);
    });
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("ip: " + process.env.IP);
    console.log("Server has started!!!");
});
