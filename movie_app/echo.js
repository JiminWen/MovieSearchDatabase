var express = require("express");
var $ = require("jquery")
var app = express();
var empty = require('is-empty');

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

    app.get("/", function(req, res) {
        res.render("index");
    });


    var cur_number = 1;
    var cur_items = 50;
    var order_item = "movie.id";
    var order = "asc";
    var page = { number: cur_number, items_per_page: cur_items, order_item: order_item, order: order };
    app.get("/movies", function(req, res) {
        console.log(req.query);
        if (!empty(req.query)) {
            order = req.query.order;
            order_item = req.query.order_item;
            page.order = order;
            page.order_item = order_item;
        }
        // var sql = "select movie.id, movie.title, movie.year, movie.score, movie.link, director.director_name " +
        //     "from movie inner join director on movie.director_id = director.id order by " + order_item+ " " + order;
        // con.query(sql, function(err, result) {
        //     if (err) throw err;
        //     console.log("query " + sql + " succeeded");
        //     movie_query = result;
        // });
        // sql = "select movie.id, group_concat(actor.actor_name order by actor.id) as list from movie " +
        //     "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
        //     "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id order by " + order_item + " " + order;
        // con.query(sql, function(err, result) {
        //     if (err) throw err;
        //     console.log("query " + sql + " succeeded");
        //     actors = result;
        //     res.render("movies", { movie_query: movie_query, page: page, actors: actors });

        var sql = "select movie.id, movie.title, movie.year, movie.score, movie.link, director.director_name, " +
            "group_concat(actor.actor_name order by actor.id) as list from movie " +
            "inner join director on movie.director_id = director.id " +
            "inner join movie_actor_relation on movie.id=movie_actor_relation.movie_id " +
            "inner join actor on movie_actor_relation.actor_id=actor.id group by movie.id order by " + order_item + " " + order;
        con.query(sql, function(err, result) {
            if (err) throw err;
            console.log("query " + sql + " succeeded");
            console.log(result.length);
            res.render("movies", { page: page, result: result });
        });
    });
});


var cur_number = 1;
var cur_items = 50;
var order_item = "actor.id";
var order = "asc";
var page = { number: cur_number, items_per_page: cur_items, order_item: order_item, order: order };
app.get("/actors", function(req, res) {
    console.log(req.query);
    if (!empty(req.query)) {
        order = req.query.order;
        order_item = req.query.order_item;
        page.order = order;
        page.order_item = order_item;
    }
    var sql = "select actor.id, actor.actor_name, actor.facebook_likes, " +
        "group_concat(movie.title order by movie.id) as movies, "+
        "group_concat(director.director_name order by director.id) as directors from actor "+
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
   res.render("directors"); 
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("ip: " + process.env.IP);
    console.log("Server has started!!!");
});
