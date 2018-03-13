var restify = require('restify'); 
var request = require("request");
var rp = require("request-promise");
var builder = require('botbuilder');  
var inMemoryStorage = new builder.MemoryBotStorage();
require('dotenv').config();

// Setup Restify Server 
var server = restify.createServer(); 
server.listen(process.env.port || process.env.PORT || 3978, 
function () {    
    console.log('%s listening to %s', server.name, server.url);  
});  
// chat connector for communicating with the Bot Framework Service 
var connector = new builder.ChatConnector({     
    appId: process.env.MICROSOFT_APP_ID,     
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
// Listen for messages from users  
server.post('/api/messages', connector.listen());  
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:') 
var bot = new builder.UniversalBot(connector, function (session) {  
   
	session.send("Sorry, I don't know how to help with: %s", session.message.text);
	session.send("Try using one of these workflows:");
	session.send("- 'asset info': for information regarding a certain asset tag");


}) .set('storage', inMemoryStorage);


bot.dialog('Asset Info', [
function (session) {
        session.send("Asset Information ");
        session.beginDialog('askForAssetTag');
    },
    function (session, results) {
    session.dialogData.assetTag = results.response;
	session.send("Retrieving Info on Asset: " + session.dialogData.assetTag);
	session.send(getAssetInfo(session, session.dialogData.assetTag));
    },
	function (session, results) {
	session.endDialog();
    }
]).triggerAction({
matches: /^asset info$/i,
});

// Dialog to ask for asset information
bot.dialog('askForAssetTag', [
    function (session) {
        builder.Prompts.text(session, "Please provide the asset tag in question");
    },
    function (session, results) {
		
        session.endDialogWithResult(results);
    }
]);



function getAssetInfo(session, asset){
	var options2;
	var assets;
	var info;
	
	var options = { 
	
	method: 'GET',
	url: 'http://snipe.warren.k12.in.us/api/v1/hardware?limit=5000',
	
	headers: 
		{
			'Authorization' : 'Bearer ' + process.env.SNIPE_IT_API_KEY,
			'Accept' : 'application/json',
			'User-Agent' : 'Request-Promise'
		},
		json: true
	};
	
	console.log("Querying Snipe IT for Asset: " + asset);
	rp(options).then(function(assets){
	//console.log("============================");
	//console.log(assets);
	//console.log("============================");
	
	
	//console.log(" ");
	var length = assets.total -1;
	console.log(length);
	//console.log(" ");
	for (i=0; i < length; i++) {
		var object = assets.rows[i];
		
		//console.log("NOT: " + object.asset_tag);
		if (object.asset_tag == asset) {
			console.log("============================");
			console.log("Asset: " + asset + "; ID: " + object.id);
			console.log("============================");
			
			session.send(getInfo(session,object.id));
			
		}
		
	}
	
	
	})
	.catch(function (err) {
		console.log("============================");
        console.log("PROMISE 1 ERROR: " + err);
		console.log("============================");
    });
	
}
function getInfo(session, id){
	var options2 = { 
	
				method: 'GET',
				url: 'http://snipe.warren.k12.in.us/api/v1/hardware/' +id,
	
				headers: 
				{
					'Authorization' : 'Bearer ' + process.env.SNIPE_IT_API_KEY,
					'Accept' : 'application/json',
					'User-Agent' : 'Request-Promise'
				},
				json: true
				
			};
			
			rp(options2).then(function (body) {
	
			var model;
			var serial;
			var assetStatus;
			var assignee;
			var manufacturer;
			
			if(body.manufacturer != null){
				manufacturer = body.manufacturer.name;
			}
			else{
				manufacturer = "Unknown Model";
			}
			if(body.model != null){
				model = body.model.name;
			}
			else{
				model = "Unknown Model";
			}
			
			if(body.serial != null){
				serial = body.serial;
			}
			else{
				serial = "Unknown Serial";
			}
			
			
			if(body.assigned_to != null){
				assignee = body.assigned_to.name;
			}
			else{
				assignee = "Not assigned";
			}
			
			if(body.category != null){
				category = body.category.name;
			}
			else{
				category = "No Category";
			}
			if(body.status_label != null){
				console.log(body.status_label);
				assetStatus = body.status_label.name;
			}
			else{
				assetStatus = "Unknown Status";
			}
				

	
			
			var info = 
				"Asset: " + body.asset_tag + "\n \n" +
				"Serial: " +  serial + "\n \n" +
				"Category: " + category + "\n \n" +
				"Manufacturer: " + manufacturer + "\n \n" +
				"Model: " + model + "\n \n" +
				"Status:" + assetStatus + "\n \n" +
				"Assigned to: " + assignee + "\n \n" 
			;
			session.send(info);
				
	
			})
			.catch(function (err) {
				console.log("============================");
				console.log("PROMISE 2 ERROR: " + err);
				console.log("============================");
			});

	

	
}


