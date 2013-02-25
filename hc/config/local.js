var config = module.exports = {

		auth: {
			    twitter: {
			      consumerkey : "LEMDKdQ4NXGOddvSjJOtBQ",
			      consumersecret : "44dQ4l0dlLyXAYjf09m4pLTUPt1J9sysFeXmhKJDA",
			      callback : "http://localhost:8080/v1/authfb/callback"
			    },
			    facebook: {
			      clientid : "447241648681212",
			      clientsecret : "0425c311c7896527fa7cab47731ee8c1",
			      callback : "http://localhost:8080/v1/authfb/callback"
			    }
		},
		session : {
		    secret : "chito pogi"
		}
};
module.exports.local = function(req,res,next){

	req.local = config;
	return next();
};