// Initialize Firebase
var numConnected = 0;
var config = {
    apiKey: "AIzaSyA-Ue7A9THyAaBPArJhjvxTYz_A5HbeSE8",
    authDomain: "rps-multiplayer-90217.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-90217.firebaseio.com",
    projectId: "rps-multiplayer-90217",
    storageBucket: "rps-multiplayer-90217.appspot.com",
    messagingSenderId: "728141503296"
};
firebase.initializeApp(config);
var database = firebase.database();
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");
connectedRef.on("value", function(snap) {
    // If they are connected..
    if (snap.val()) {
  
      // Add user to the connections list.
      var con = connectionsRef.push(true);
  
      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();
    }
});
var p1Name;
var p2Name;
var player = "n/a";
var myWins = 0;
var myLosses = 0;
var choice1;
var choice2;
var RPS = {
    rock : 1,
    paper : 2,
    scissors :3,
    1 : "rock",
    2 : "paper",
    3 : "scissors"
}
$("#sign-in").submit(function(e) {
    e.preventDefault();
    var name = $("#name").val().trim();
    $("#name").val("");
    if (name !== "") {
        sessionStorage.setItem("name",name);
        firebase.auth().signInAnonymously().catch(function(error) {
            console.log(error.code);
        });
    }
});
$("#sign-out").on("click",function() {
    database.ref(player).set({
        choice : "void"
    });
    sessionStorage.clear();
    firebase.auth().signOut().catch(function(error) {
        console.log(error.code);
    });
})

database.ref("/Player1/values").on("value",function(snapshot) {
    try {
        p1Name = snapshot.val().name;
        if (typeof p1Name === "undefined") {
            $("#player-1-name").text("Waiting for Player 1");
            return false;
        }
        $("#player-1-name").text(p1Name);
        $("#Player1-wins").text("wins: " + snapshot.val().wins);
        $("#Player1-losses").text("losses: " + snapshot.val().losses);
        var status = snapshot.val().status;
        $("#Player1-choice").text(status);
        if (player === "Player1") {
            myWins = snapshot.val().wins;
            myLosses = snapshot.val().losses;
            if (status === "thinking") {//need to make a turn
                $("#Player1-choices").attr("class",'choices');
            } else {
                $("#Player1-choices").addClass("hidden");
            }
        } 
    } catch (error) {
        $("#player-1-name").text("Waiting for Player 1");
    }
});
database.ref("/Player2/values").on("value",function(snapshot) {
    try {
        p2Name = snapshot.val().name;
        if (typeof p2Name === "undefined") {
            $("#player-2-name").text("Waiting for Player 2");
            return false;
        }
        $("#player-2-name").text(p2Name);
        $("#Player2-wins").text("wins: " + snapshot.val().wins);
        $("#Player2-losses").text("losses: " + snapshot.val().losses);
        var status = snapshot.val().status;
        $("#Player2-choice").text(status);
        if (player === "Player2") {
            myWins = snapshot.val().wins;
            myLosses = snapshot.val().losses;
            if (status === "thinking") {//need to make a turn
                $("#Player2-choices").attr("class",'choices');
            } else {
                $("#Player2-choices").addClass("hidden");
            }
        } 
    } catch (error) {
        $("#player-2-name").text("Waiting for Player 2");
    }
});
//user signed in
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        $("#sign-in").addClass("hidden");
        $("#sign-out").attr("class",'');
        
        database.ref("/Player1/"+user.uid).set({
            here : true
        }).then(function (snapshot) {
            if (p1Name !== sessionStorage.getItem("name")) { //new game
                database.ref("/Player1/values").set({
                    name : sessionStorage.getItem("name"),
                    wins : myWins,
                    losses : myLosses,
                    status : "thinking"
                });
                $("#Player1-choices").attr("class",'');
            }
            player = "Player1";
            //fixes a problem where authentication is called after first getting p1 values (we didn't know player was here yet)
            database.ref("/Player1/values").push(true);
        }, function (error) {
            //there's already a player1
            database.ref("/Player2/"+user.uid).set({
                here : true
            }).then(function(snapshot) {
                if (p2Name !== sessionStorage.getItem("name")) {//new game
                    database.ref("/Player2/values").set({
                        name : sessionStorage.getItem("name"),
                        wins : myWins,
                        losses : myLosses,
                        status : "thinking"
                    });
                    $("#Player2-choices").attr("class",'');
                }
                player = "Player2";
                //fixes a problem where authentication is called after first getting p1 values
                database.ref("/Player2/values").push(true);
            },function (error) {
                console.log(error2.code);
                //Already 2 players; shouldn't ever happen
                player = "";
            });
        });
            
      
    } else {
      $("#sign-in").attr("class",'');
      $("#sign-out").addClass("hidden");
    }
});
//make choice
$(".choice").on("click",function() {
    database.ref("/"+player+"/values").set({
        name : sessionStorage.getItem("name"),
        wins : myWins,
        losses : myLosses,
        status : "waiting"
    });
    $("#"+player+"-choices").addClass("hidden");
    database.ref("/choices/" + player).set( {
        choice : this.value
    }).then(function(snapshot) {
        //the following should call if both values are set.
        database.ref("/choices").on("value",function(snapshot) {
            try {
                var p1 = snapshot.val().Player1.choice;
                var p2 = snapshot.val().Player2.choice;
                var winner = rps(p1,p2);
                var equiv = {
                    Player1 : " beats ",
                    Player2 : " loses to ",
                    tie : " ties "
                }
                var condition = p1 + equiv[winner] + p2;
                database.ref("/winner").set( {
                    victor : winner,
                    method : condition
                });
            } catch (error) {
                console.log("didn't access database");
            }
        })
    })
})
//someone has won
database.ref("/winner").on("value",function(snapshot) {
    console.log("updating with winner");
    console.log(snapshot.val());
    var winner = snapshot.val().victor;
    var condition = snapshot.val().method;
    //so you can see the result
    $("#result").attr("class","above");
    if (winner == "tie") {
        $("#result").html("<h1>Tie!</h1><h2>Nobody Wins!</h2>");
    } else {
        $("#result").html("<h2>" + condition + "</h2>");
        var winHeader = $("<h1>");
        if (winner === player) {
            winHeader.text("You Win!");
            myWins++;
        } else {
            if (player === "n/a") {
                winHeader.text(winner + " wins!");
            } else {
                winHeader.text("You Lose!");
                myLosses++;
            }
        }
        $("#result").prepend(winHeader);
    }
    database.ref("/"+player+"/values").set( {
        name : sessionStorage.getItem("name"),
        wins : myWins,
        losses : myLosses,
        status : "thinking"
    }, function (error) {
        console.log("you are not a part of this game");
    })
    database.ref("/choices/"+player).remove();
    window.setTimeout(function() {
        $("#result").addClass("hidden");
    },3000) //after 3 seconds hide the result bar
})
function rps(c1,c2) {
    var p1 = RPS[c1];
    var p2 = RPS[c2];
    if (p1 === p2) {
        return "tie";
    }
    if (p1 === 1 && p2 === 3) { //rock beats paper
        return "Player1";
    }
    if (p2 === 1 && p1 === 3) { //rock beats paper
        return "Player2";
    }
    if (p1 < p2) {
        return "Player2";
    } else {
        return "Player1";
    }
}
  // When first loaded or when the connections list changes...
connectionsRef.on("value", function(snapshot) {
  
    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.
    numConnected = snapshot.numChildren();
    $("#watchers").text("Players waiting = " + (numConnected - 2));
    
});