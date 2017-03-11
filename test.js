var soda = require('soda-js');
var fs = require('fs');
var consumer = new soda.Consumer('data.sfgov.org');

consumer.query()
  .withDataset('75rg-imyz')
  .limit(5)
  /* .where({ namelast: 'SMITH' })
  	 .order('namelast') */
  .getRows()
    .on('success', function(rows) { console.log(rows); 
    								fs.writeFile("./data/75rg-imyz.json", JSON.stringify(rows), function(err) {
    								if(err) {
    								    return console.log(err);
    							   } });})
    .on('error', function(error) { console.error(error); });
