var express = require('express');

express()
.use(express.vhost('localhost', require('./hc')))
.listen(80,function(){
	 console.log("----------------AS READY----------------");
});