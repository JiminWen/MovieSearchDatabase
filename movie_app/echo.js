var express = require("express");
var app = express();

var mysql = require('mysql');//connect to mysql database
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

app.get("/",function(req, res){
    var sql = "select * from movie";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("query succeeded");
        res.render("movie", {result: result});    
    });
});
    
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("ip: " + process.env.IP);
    console.log("Server has started!!!");
});

