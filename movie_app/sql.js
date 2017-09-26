var mysql = require('mysql');
var ip = process.env.IP;
console.log(ip);
var con = mysql.createConnection({
  host: ip,
  user: "jiminwen",
  password: ""
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

