var version = {};
version.v1 = {
		page : require('./v1/_page.js'),
		api : require('./v1/_api.js'),
};

module.exports = {
		login : function(req,res){
			var instance = version[req.params.version];
			execute(instance, res, instance.page.login(req, res));
		},
		option : function(req,res){
			var instance = version[req.params.version];
			execute(instance, res, instance.page.option(req, res));
		},
		chat : function(req,res){
			var instance = version[req.params.version];
			execute(instance, res, instance.page.chat(req, res));
		}
};

function execute(instance, res, next) {
	if(!(typeof instance == 'undefined')){
		next;
	}
	else{
		res.json(404,{code:-996, message:"Invalid version"});
	}
}