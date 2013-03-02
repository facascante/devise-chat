var chat_object = require('../../../models/chat.object.js');
var io = require('socket.io/node_modules/socket.io-client');

module.exports = function(req,res){
	var socket = io.connect("http://localhost:8080");
	res.cookie('server',"chito");
	chat_object.getRoomVisitorsByGender(req.client,req.user.gender,function(chatmates){
		console.log(socket.emit('start game', {chatmates:chatmates,user:req.user}));
		res.json(200,"Complete");
	});
	
	
};
