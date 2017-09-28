const imdb = require('imdb-api');
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var titles = [];
var title;

app.get('/', function(req, res){

  //All the web scraping magic will happen here
  var url = 'http://www.imdb.com/search/title?count=100&groups=top_1000&sort=user_rating&view=advanced';
  request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            // Finally, we'll define the variables we're going to capture

            
            $('.lister-item-header').filter(function(){
                

           // Let's store the data we filter into a variable so we can easily see what's going on.

                var data = $(this);

           // In examining the DOM we notice that the title rests within the first child element of the header tag. 
           // Utilizing jQuery we can easily navigate and get the text by writing the following code:
                
            title = data.children().eq(1).text();
                

            imdb.get(title, {apiKey: 'd299ec6d', timeout: 3000}).then(console.log).catch(console.log); 
            })
        }

        
    })
})



app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!!!");
});


exports = module.exports = app;