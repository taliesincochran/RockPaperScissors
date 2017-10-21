
// $(document).ready(function () {
	// Initialize Firebase
	var config = {
	    apiKey: "AIzaSyDC9fOUtOSA0pIHr5YiGbNzU5nRMtXexL0",
	    authDomain: "rockpaperscissors-61f1d.firebaseapp.com",
	    databaseURL: "https://rockpaperscissors-61f1d.firebaseio.com",
	    projectId: "rockpaperscissors-61f1d",
	    storageBucket: "",
	    messagingSenderId: "478164757566"
	};
	firebase.initializeApp(config);
	var database = firebase.database();
	var connectionsRef = database.ref("/connections");
	var connectedRef = database.ref(".info/connected");
	var lPRef;
	var rPRef;
	var lPsnap;
	var rPsnap;
	// gets value of all connected on connect and removes on disconnect
	connectedRef.on("value", function(snap) {
	  if (snap.val()) {
	    var connected = connectionsRef.push(true);
	    connected.onDisconnect().remove();
	  }
	});
	var chatRef= database.ref('/chat');
	chatRef.set('');
	//Sees if there are players and how many and returns to modal if there are already two
	var con;
	$(".choice").on("click", function() {
		console.log("you selected" ,$(this).attr("data-choice"));
		game.lP.choice = $(this).attr('data-choice');
		game.updateFirebase();
		game.hideButtons();
		game.lP.turn = 2;
		console.log(game.lP.choice);
		$(".localPlayerChoice").removeClass('hidden');
		if(game.rP.choice !== 0) {
			game.compare();
		}
	})
	$("#messageInput").keyup(function(event){
    if(event.keyCode == 13){
        $("#chatSubmit").click();
    }
	});
	var game = {
		'rpsArr': ['rock','paper','scissors'],
		//local player
		'lP' : {
			'id': null,
			'name': null,
			'wins': 0,
			'losses': 0,
			'turn': 1,
			'choice': 0,
		},
		//remote player
		'rP' : {
			'id': null,
			'name': null,
			'wins': 0,
			'losses':0,
			'turn':1,
			'choice': 0,
		},
		"lPdefined": false,
		"rPdefined": false,
		"on" : false,
		'results': '',	
		'update' : {
			"remote": function(ref) {
				console.log("remote", ref);					
				$(".remotePlayerName").text(game.rP.name);
				$(".remotePlayerID").text(game.rP.id);
				$(".remotePlayerWins").text(game.rP.wins);
				$('.remotePlayerLosses').text(game.rP.losses);
			},
			'local': function(ref) {
				console.log('local', ref);
				$(".localPlayerName").text(game.lP.name);
				$(".localPlayerID").text(game.lP.id);
				$(".localPlayerWins").text(game.lP.wins);
				$('.localPlayerLosses').text(game.lP.losses);
			},
			'results': function (lRef , rRef) {
				console.log('results',  lRef , rRef)
				$('.localPlayerChoice').text(game.lP.choice);
				$('.remotePlayerChoice').text(game.rP.choice);
				$(".remotePlayerWins").text(game.rP.wins);
				$('.remotePlayerLosses').text(game.rP.losses);
				$('.localPlayerWins').text(game.lP.wins);
				$('.localPlayerLosses').text(game.lP.losses);

			},
		},
		'startGame': function() {
			$("#startModal").modal("show");
		    //click button to hide modal an submit name
		    $("#submitNewPlayer").on("click", function (event) {
		        event.preventDefault();   
		        //get the value of the name and store it in localPlayer.name
	            game.lP.name = $("#newPlayerName").val().trim();
	            $(".localPlayerName").text(game.lP.name);
	            $('.error').text("Waiting on remote player.");
	            $(".remotePlayerName").text("Waiting on remote player.")
				game.listener();
		   
		    })
		},
		updateFirebase: function() {
			console.log('firebase updated');
			lPRef.set(game.lP);
		},

		'showButtons': function() {
			$(".choice").removeClass('hidden');

		},
		'hideButtons': function() {
			$(".choice").addClass('hidden');
		},
		'chat': function() {
			chatRef.orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot) {
				var newChat = snapshot.val();
				var newDiv= $("<div>");
				var newName = $('<span>');
				newName.text(newChat.name).appendTo(newDiv);
				var newSpacer = $("<span>");
				newSpacer.text(" says: ").appendTo(newDiv);
				var newMessage = $("<span>");
				newMessage.text(newChat.message).appendTo(newDiv);
				$('#chatBox').append(newDiv);
				var textarea = document.getElementById('chatBox');
				textarea.scrollTop = textarea.scrollHeight;
			});
			$("#chatSubmit").on("click", function() {
				var chatMessage = $("#messageInput").val();
				$('#messageInput').val('');
				chatRef.push({
					"name": game.lP.name,
					"message": chatMessage,
					dateAdded: firebase.database.ServerValue.TIMESTAMP,
				});
			});
		},
		'listener' : function () {
			database.ref("/connections").on('value', function(snapshot) {
				con = snapshot.val();
				if(con.hasOwnProperty('player' + game.rP.id)) {
					rPRef = connectionsRef.child("player" + game.rP.id);
					rPsnap = con['player' + game.rP.id];
					setTimeout(function() {console.log('updating remote'); game.rP = rPsnap;}, 10);
					setTimeout(function() {game.update.remote(rPsnap)}, 20);
				}				
				//checks if player has id already
				if(game.lP.id === null) {
					if(!con.hasOwnProperty('player1')) {
						console.log('Local player set to player1');
						game.lP.id = '1';
						var lP = con["player1"];
						game.rP.id = '2';	
						lPRef = connectionsRef.child('/player1');
						console.log('lPRef' , lPRef);
						lPRef.onDisconnect().remove();
						lPRef.set(game.lP);
						lPsnap = con['player' + game.lP.id];
						setTimeout(function() {game.update.local(lPsnap)}, 10);
						game.lPdefined = true;
						if(con.hasOwnProperty('player2')) {
							console.log('rp defined');
							game.rPdefined = true;	
								
							setTimeout(
								function() {
									console.log('updating remote');
									game.rP = rPsnap
								}
								,10);
							console.log('rPRef' , rPRef);
							setTimeout(function() {game.update.remote(rPsnap)}, 20);
						}
					} 
					else if (!con.hasOwnProperty('player2')) {
						console.log('Local player set to player2');
						game.lP.id ='2';
						var lP = con["player2"];
						game.rP.id = '1';
						lPRef = connectionsRef.child('player' + game.lP.id);
						console.log('lPRef' , lPRef);
						lPRef.onDisconnect().remove();
						lPRef.set(game.lP);	
						game.lPdefined = true;
						console.log(con['player'+ game.lP.id]);
						lPsnap = con['player' + game.lP.id];
						setTimeout(function() {game.update.local(lPsnap)}, 10);
						if(con.hasOwnProperty('player1')) {
							console.log('rp defined');
							game.rPdefined = true;	
							rPRef = connectionsRef.child("player" + game.rP.id);	
							rPsnap = con['player' + game.rP.id];	
							setTimeout(function() {console.log('updating remote'); game.rP = rPsnap;},10
						);
							console.log('rPRef' , rPRef);
							game.update.remote(rPsnap)	;
						}
					} 
					else {
						console.log('Too many players');
						game.lP.id = null;
						$("#startModal").modal('show');
				    	$(".error").text("There are too many players, try again later.");		
					}
				}
				//If the player has an Id, the remote players info is set and the database has a referance for both players
				if (game.lPdefined && game.rP.name === null && con.hasOwnProperty('player' + game.rP.id)) {
					console.log('rp defined');
					game.rPdefined = true;	
						
					setTimeout(function() {console.log('updating remote'); game.rP = rPsnap;}, 10);
					setTimeout(function() {game.update.remote(rPsnap);}, 20)
					console.log('rPRef' , rPRef);
					game.update.remote(rPsnap)	;
				}
				//This is when the game starts, both players are defined on the server and locally
				if(game.lPdefined && game.rPdefined && game.lP.turn === 1) {
					console.log('game on');
					game.on = true;
					game.showButtons();					
					$(".choice").removeClass('disabled');
					$(".choice").removeClass('disabled');
				}
				//if the local player has made a choice and the remote has not
				if (game.on && con.hasOwnProperty('player' + game.rP.id)  && game.lP.choice !== 0 && game.lP.turn === 2) {
					if (rPsnap.choice === 0 && rPsnap.turn === 1) {
						$(".error").text('waiting on remote');
						setTimeout(function() {console.log('updating remote'); game.rP = rPsnap;}, 10);
						setTimeout(function() {game.update.remote(rPsnap)}, 20);	
					}
					
				}
				//this fires compare if the remote player has made a choice after the local player has made a choice
				if(game.on && con.hasOwnProperty('player' + game.rP.id)  && game.lP.turn === 2 && game.lP.choice !== 0) {
					if(rPsnap.choice !== 0) {
						$(".error").empty();
						game.rP = rPsnap	
						setTimeout(function() {console.log('updating remote'); game.rP = rPsnap;}, 10);
						setTimeout(function() {game.update.remote(rPsnap);}, 20);
						game.compare()	
					}					
				} 
			})
		},
		'compared': false,
		'evaluated':false,
		'compare' : function () {
			if(game.lP.turn === 2 && !game.compared) {
				game.compared = true;
				$(".remotePlayerChoice").removeClass('hidden');
				console.log('compare');
				game.lP.turn=3;
				if (game.rP.choice === game.lP.choice) {				
		            $("#resultsDisplay").removeClass('hidden').html("Local Player chose: "+ game.lP.choice + "<br>Remote Player chose: " + game.rP.choice + "<br> It's a tie!");
		            setTimeout(game.startNextRound, 2000);	            
		        } else if (game.rP.choice === "rock") {
		            game.wins(game.lP.choice,"rock","paper","scissors");
		        } else if (game.rP.choice === "paper") {
		           game.wins(game.lP.choice,"paper","scissors","rock");
		        } else if (game.rP.choice === "scissors") {
		            game.wins(game.lP.choice,"scissors","rock","paper");
		        } else if (game.rP.choice === null || game.lP.choice === null) {
		        	console.log('something went wrong')
		        }
		        setTimeout(function(){game.update.results(lPsnap, rPsnap)}, 10);
		    	setTimeout(function(){lPRef.set(game.lP);},20)
		    }   
	    },
	    wins : function (playerChoice, rps1, rps2, rps3) {
		    if(game.lP.turn === 3 && !game.evaluated) {
		    	game.evaluated = true;
		    	console.log('wins evaluating' , rps1, rps2);
			    if (playerChoice === rps2) {
			        $("#resultsDisplay").removeClass('hidden').html("You chose: "+ game.lP.choice + "<br>Remote Player chose: " + game.rP.choice + "<br>You win!");
			        game.lP.wins++;
			        console.log('wins plus one');
			        // game.rP.losses++;
			        $("#localPlayerWins").text(game.lP.wins);
			        console.log('you win');
			        setTimeout(game.startNextRound, 2000);
			    } else if (playerChoice === rps3) {
			    	game.lP.losses++;
			    	// game.rP.wins++;
			    	console.log('you lose');
			        $("#resultsDisplay").removeClass('hidden').html("You chose: "+ game.lP.choice + "<br>Remote Player chose: " + game.rP.choice + "<br>" + game.rP.name + " wins!");
			        $("#remotePlayerWins").text(game.rP.wins);
			        setTimeout(game.startNextRound, 2000);
			    } else {console.log("error in wins")}
			}
		},
		startNextRound: function() {
			console.log('start new called');
			if(game.lP.turn === 3) {
				console.log('start new executed');
				$('#resultsDisplay').addClass('hidden');
				$(".localPlayerChoice").addClass('hidden');
				$(".remotePlayerChoice").removeClass('hidden');
				game.showButtons();
				$('remotePlayerChoice').text('');
				console.log('start new turn');
				game.lP.turn = 1;
				game.lP.choice = 0;
				game.rP.choice = 0;
				game.evaluated = false;
				game.compared = false;
				game.update.results();
				lPRef.set(game.lP);
			}
		}
	}
	game.startGame();
	game.chat();
// })
