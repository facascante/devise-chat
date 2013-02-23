var client = module.parent.exports.client;

function getRooms(client,fn){
	client.smembers("hc:partner:rooms", function(err, rooms) {
		if (!err && rooms) fn(rooms);
		else fn([]);
	});
}

function getRoomVisitors(client,room,fn){
	client.smembers("hc:room:"+room+":visitor", function(err, visitors) {
		if (!err && visitors) fn(visitors);
		else fn([]);
	});
}

function setRoom(client,room,fn){
	multi = client.multi();
	multi.sadd('hc:partner:rooms', room);
	multi.exec(function (err, replies) {
        fn(replies);
    });
}

function setRoomVisitor(client,room,visitor,fn){
	multi = client.multi();
	multi.sadd("hc:room:"+room+":visitor", visitor);
	multi.exec(function (err, replies) {
        fn(replies);
    });
}

function accomodateVisitor(client,visitor,fn){
	getRooms(client,function(rooms){
		if(rooms.length){
			rooms.forEach(function(room){
				getRoomVisitors(client,room,function(visitors){
					if(visitors.length == 0){
						setRoomVisitor(client,room,visitor,function(replies){
							fn( room ); return;
						});
					}
					else if(visitors.length == 1){
						if(visitors[0].gender != visitor.gender){
							setRoomVisitor(client,room,visitor,function(replies){
								fn( room ); return;
							});
						}
					}
					else{
						
					}
				});
			});
			if(rooms.length == 15){
				fn( false ); return;
			}
			else{
				var room = "room-"+ (rooms.length + 1);
				setRoom(client,room,function(replies){
					setRoomVisitor(client,room,visitor,function(replies){
						fn( room ); return;
					});
				});
			}
		}
		else{
			var room = "room-1";
			setRoom(client,room,function(replies){
				setRoomVisitor(client,room,visitor,function(replies){
					fn( room ); return;
				});
			});
		}
	});
}



module.exports = function(req,res){
	
	req.user.gender = req.body['gender-m'] || req.body['gender-f'] || req.user.gender;
	req.user.code_name = req.body.username;
	accomodateVisitor(client,req.user,function(room){
		console.log(room);
		if(room){
			res.render('chat',{users:req.user, room:room});
		}
		else{
			res.render('option');
		}
	});
	
};
