var chat_object = require('../../../models/chat.object.js');

module.exports = function(req,res){
	
	req.user.gender = req.body['gender-m'] || req.body['gender-f'] || req.user.gender;
	req.user.code_name = req.body.username;
	chat_object.accomodateVisitor(req.client,JSON.stringify(req.user),function(room){
		console.log(room);
		if(room){
			res.render('chat',{users:req.user, room:room});
		}
		else{
			res.render('option');
		}
	});
	
};
