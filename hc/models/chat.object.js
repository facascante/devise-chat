

function getRooms(client,fn){
	client.smembers("hc:partner:rooms", function(err, rooms) {
		if (!err && rooms) fn(rooms);
		else fn([]);
	});
}
exports.removeAllRecord = function(client){
	client.keys('hc:*', function(err, keys) {
	    if(keys.length) client.del(keys);
	    console.log('Deletion of all redis reference ', err || "Done!");
	});
}

function removeRoom(client,room,fn){
	client.srem('hc:partner:rooms', room,function(err,replies){
		fn(replies);
	});
}

function removeRoomVisitor(client,room,visitor,fn){
	client.srem("hc:room:"+room+":visitor", visitor,function(err,replies){
		fn(replies);
	});
}
function getRoomVisitors(client,room,fn){
	client.smembers("hc:room:"+room+":visitor", function(err, visitors) {
		if (!err && visitors) fn(visitors);
		else fn([]);
	});
}

function setRoom(client,room,fn){
	client.sadd('hc:partner:rooms', room,function(err,replies){
		fn(replies);
	});
}

function setRoomVisitor(client,room,visitor,fn){
	client.sadd("hc:room:"+room+":visitor", visitor,function(err,replies){
		fn(replies);
	});
}

function checkVisitorifExist(client,visitor,fn){
	getRooms(client,function(rooms){
		var i=0;
		rooms.forEach(function(room){
			getRoomVisitors(client,room,function(visitors){
				visitors.forEach(function(user){
					if(JSON.parse(user).id == JSON.parse(visitor).id ){
						fn(room); return;
					}
				});
				i++;
			});
		});
		if(i >= rooms.length){
			fn(false); return;
		}
	});
}
function setVisitorSocket(client,room,visitor,socket_id,fn){
	client.sadd("hc:sockets:"+visitor+":"+room,socket_id,function(err,replies){
		fn(replies);
	});
}

function removeVisitorSocket(client,room,visitor,socket_id,fn){
	client.srem("hc:sockets:"+visitor+":"+room,socket_id,function(err,replies){
		fn(replies);
	});
}

function setSocketList(client,socket_id,fn){
	client.sadd("hc:sockets:",socket_id,function(err,replies){
		fn(replies);
	});
}

function removeSocketList(client,socket_id,fn){
	client.srem("hc:sockets:",socket_id,function(err,replies){
		fn(replies);
	});
}

function setRoomOnlineList(client,room,visitor,fn){
	client.sadd("hc:rooms:"+room+":online",visitor,function(err,replies){
		fn(replies);
	});
}

function removeRoomOnlineList(client,room,visitor,fn){
	client.srem("hc:rooms:"+room+":online",visitor,function(err,replies){
		fn(replies);
	});
}

function incRoomOnlineCount(client,room){
	client.hincrby("hc:rooms:"+room+":info",'online',1);
}

function decRoomOnlineCount(client,room){
	client.hincrby("hc:rooms:"+room+":info",'online',-1);
}

function getVisitorStatus(client,visitor,fn){
	client.get("hc:users:"+visitor+":status",function(err,replies){
		fn(replies);
	});
}
function newVisitorNotification(io,room,visitor,provider,status){
	io.sockets.in(room).emit('new user',{
		nickname : visitor,
		provider : provider,
		status : status || "available"
	});
}

function leaveVisitorNotification(io,room,visitor,provider){
	io.sockets.in(room).emit('user leave', {
        nickname: visitor,
        provider: provider
    });
}

function MessageListener(io,socket,room,visitor,gender,provider){
	socket.on('my msg', function(data) {
	    var no_empty = data.msg.replace("\n","");
	    if(no_empty.length > 0) {
	      io.sockets.in(room).emit('new msg', {
	        nickname: visitor,
	        gender:gender,
	        provider: provider,
	        msg: data.msg
	      });
	    }   
	});
}

function disconnectVisitor(client,io,room,visitor,provider,socket_id){
	removeVisitorSocket(client,room,visitor,socket_id,function(reply){
		if(reply){
			removeSocketList(client,socket_id,function(reply){;});
			removeRoomOnlineList(client,room,visitor,function(reply){
				if(reply){
					decRoomOnlineCount(client,room);
					leaveVisitorNotification(io,room,visitor,provider);
				}
			});
		};
	});
};

function connectVisitor(client,io,room,visitor,provider,socket_id){
	setVisitorSocket(client,room,visitor,socket_id,function(reply){
		if(reply){
			setSocketList(client,socket_id,function(reply){;});
			setRoomOnlineList(client,room,visitor,function(reply){
				if(reply){
					incRoomOnlineCount(client,room);
					getVisitorStatus(client,visitor,function(status){
						newVisitorNotification(io,room,visitor,provider,status);
					});
				};
			});
		};
	});
};

exports.initializeChat = function(client,io){
	
	io.sockets.on('connection', function (socket) {
		
		var hs = socket.handshake,
			visitor = hs.hatchcatch.user.username,
			gender = hs.hatchcatch.user.gender,
			provider = hs.hatchcatch.user.provider,
			room = hs.hatchcatch.room;
		socket.join(room);
		connectVisitor(client,io,room,visitor,provider,socket.id);
		MessageListener(io,socket,room,visitor,gender,provider);
		socket.on('disconnect', function() {
			disconnectVisitor(client,io,room,visitor,provider,socket.id);
		});
	});
};

exports.accomodateVisitor  = function(client,visitor,fn){
	
	checkVisitorifExist(client,visitor,function(reply){
		console.log("checkVisitorifExist :" + reply);
		if(reply){
			fn( reply ); return;
		}
		else{
			getRooms(client,function(rooms){
				console.log("getRooms :" + rooms);
				if(rooms.length){
					rooms.forEach(function(room){
						getRoomVisitors(client,room,function(visitors){
							console.log("getRoomVisitors :" + visitors);
							if(visitors.length == 0){
								setRoomVisitor(client,room,visitor,function(replies){
									console.log("setRoomVisitor :" +room + replies);
									fn( room ); return;
								});
							}
							else if(visitors.length == 1){
								if(JSON.parse(visitors[0]).gender != visitor.gender){
									setRoomVisitor(client,room,visitor,function(replies){
										console.log("setRoomVisitor :" +room + replies);
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
								console.log("setRoomVisitor :" +room + replies);
								fn( room ); return;
							});
						});
					}
				}
				else{
					var room = "room-1";
					setRoom(client,room,function(replies){
						setRoomVisitor(client,room,visitor,function(replies){
							console.log("setRoomVisitor :" +room + replies);
							fn( room ); return;
						});
					});
				}
			});
		}
	});
};

exports.removeVisitor = function(client,room,visitor,fn){
	removeRoom(client,room,function(reply){
		removeRoomVisitor(client,room,visitor,function(reply){
			fn(reply);
		});
	});
};
