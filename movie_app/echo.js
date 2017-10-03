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
var ip = process.env.IP;
var con = mysql.createConnection({
    host: ip,
    user: "jiminwen",
    password: "",
    database: "c9"
});

app.use(express.static("public"));
app.set("view engine", "ejs");

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/", function(req, res) {
    res.render("index");
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
    if (!empty(req.query)) {
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
    var sql = "select " + select_string + " from movie inner join director on movie.director_id = director.id " +
        "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id order by " + order_item + " " + order;

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
    console.log(req.query);
    if (!empty(req.query)) {
        order = req.query.order;
        order_item = req.query.order_item;
        page.order = order;
        page.order_item = order_item;
    }
    var sql = "select actor.id, actor.actor_name, actor.facebook_likes, " +
        "group_concat(movie.title order by movie.id) as movies, " +
        "group_concat(director.director_name order by director.id) as directors from actor " +
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
    if (!empty(req.query)) {
        order = req.query.order;
        order_item = req.query.order_item;
        page.order = order;
        page.order_item = order_item;
    }
    var sql = "select director.id, director.director_name, director.directo_facebook_likes, group_concat(movie.title order by movie.id) as movies," +
        " group_concat(actor.actor_name order by actor.id) as actors " +
        "from director inner join movie on director.id=movie.director_id " +
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
    res.render("actorUpdate");
});

app.get("/directors/:id/edit", function(req, res) {
    console.log(req.params);
    res.render("directorUpdate");
});


app.get("/movies/new", function(req, res) {
    res.render("newmovie");
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

let maxId;
app.post("/", function(req, res) {
    console.log(req.body);
    var findMaxMovieId = "select id from movie order by id desc limit 1";
    con.query(findMaxMovieId, function(err, result) {
        if (err) throw err;
        console.log("query " + findMaxMovieId + " succeeded");
        console.log(result);
        maxId = result[0].id + 1;
    });
    console.log("are you kidding");

    var insertMovie = "INSERT INTO movie(id,title,year,score,link,director_id) VALUES (" +
        parseInt(maxId) + "," + req.body.Title + "," + parseInt(req.body.Year) + "," +
        Number(req.body.Score) + "," + req.body.Link +
        ");";
    console.log(insertMovie);
    con.query(insertMovie, function(err, result) {
        if (err) throw err;
        console.log("query " + insertMovie + " succeeded");
    });
    res.render("index");
});

app.put("/movies/:id", function(req, res) {
    var id = req.params.id;
    console.log(req.body);
    console.log(id);
    res.redirect("/movies/"+id);
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("ip: " + process.env.IP);
    console.log("Server has started!!!");
});
