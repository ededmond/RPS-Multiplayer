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
$("#sign-in").submit(function(e) {
    e.preventDefault();
    var name = $("#name").val();
    firebase.auth().signInAnonymously().catch(function(error) {
        console.log(error.code);
    });
});
//user signed in
firebase.auth().onAuthStateChanged(function(user) {
    $("body").addClass("black");
    if (user) {
      // User is signed in.
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      console.log(user);
    } else {
      console.log("didn't work");
    }
});
var count = 0;
$("#push").on("click",function() {
    database.ref("/counter").set({
        newValue : count
    })
    count++;
});

  // When first loaded or when the connections list changes...
connectionsRef.on("value", function(snapshot) {
  
    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.
    numConnected = snapshot.numChildren();
    $("#watchers").text("Players waiting = " + (numConnected - 2));
    
});