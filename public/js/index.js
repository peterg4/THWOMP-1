var jq = jQuery.noConflict();

function getKnobValues(){
  var knob_values = [];
  for(var i = 0; i < 12; i++) {
    knob_values[i] = knobs[i].getValue();
  }
  return knob_values;
}

// Randomly choose title
function getTitle(scope){
  var thwomp = {};
  jq.ajax({
    url: "json/hw.json",
    async: false,
    dataType: 'json',
    success: function(result) {
      jq.each(result,function(){
        json = this;
        var h = this.h[Math.floor(Math.random() * this.h.length)];
        var w = this.w[Math.floor(Math.random() * this.w.length)];
        thwomp = "The " +h + " " + w  + " and Obscure Music Picker!";
      });
    }
  });
  return thwomp;
}

var dial_settings = []
var knobs = [];
for(var i = 0; i < 12; i++){
	var pureknob = new PureKnob();
	var knob = pureknob.createKnob(120, 120);
	// Set properties.
	knob.setProperty('angleStart', -0.75 * Math.PI);
	knob.setProperty('angleEnd', 0.75 * Math.PI);
	knob.setProperty('colorFG', '#88ff88');
  knob.setProperty('trackWidth', 0.4);
  if(i == 0) {
    knob.setProperty('valMin', 0);
    knob.setProperty('valMax', 24);
  } else if(i==6){
    knob.setProperty('valMin', -60);
    knob.setProperty('valMax', 0);
  } else if(i==2){
    knob.setProperty('valMin', 0);
    knob.setProperty('valMax', 220);
  }else {
    knob.setProperty('valMin', 0);
    knob.setProperty('valMax', 100);
  }
	// Set initial value.
  knob.setValue(50);
  knobs.push(knob);

	// Create element node.
	var node = knob.node();

  // Add it to the DOM.
  var elem1 = document.getElementById('dial'+(i+1));
  try{elem1.appendChild(node);
    dial_settings.push(50);
  } catch{
    //
  }
  
}

// Convert ms to Hours/Minutes
function msToHMS( ms ) {
  var seconds = ms / 1000; // 1- Convert to seconds
  var hours = parseInt( seconds / 3600 ); // 2- Extract hours
  seconds = seconds % 3600;
  var minutes = parseInt( seconds / 60 ); // 3- Extract minutes
  seconds = seconds % 60; // 4- Keep only seconds not extracted to minutes
  if(hours)
    return ( hours+" hr "+minutes+" min ");
  else
    return ( minutes+":"+parseInt(seconds) );
}

function time() {
  var d = new Date();
  jq(".clock").html(d.toLocaleTimeString());
}
setInterval(time, 1000);

var app = angular.module("myApp", []);

app.controller("mainController", ['$scope','$http','$sce', function($scope, $http, $sce) {
  $scope.thwomp = getTitle();
  $scope.view = 0;
  $scope.weather_view = 0;
  $scope.userInfo;
  $scope.playlistName = "Please Log in";
  $scope.playlistCreator = "username";
  $scope.playlistImg = "https://cdn3.iconfinder.com/data/icons/smileys-people-smiley-essential/48/v-51-512.png";
  $scope.playlistDescription = "Playlist description";
  $scope.playlistDuration = "0 hr 0 min";
  $scope.songs = [];
  $scope.playlists = [];
  $scope.currid = "home";
  $scope.weather = [];
  $scope.dji = 0;
  $scope.test = "";
  $scope.arrow;
  $scope.top = [];
  $scope.arts= [];
  $scope.features = [];
  // Log in
  $scope.login = function(){
    $http.get("/authUrl/").then(function(data) {
      window.location = data.data.authUrl;
    })
    $scope.refreshPlaylist();
  }
  // Log out
  $scope.logout = function(){
    $http.get("/logout/");
    $scope.user();
  }
  $scope.playlist = function(songname){
    for(var i = 0; i < 12; i++) {
      dial_settings[i] = knobs[i].getValue();
    }
    console.log(dial_settings, songname);
  }
  // Get information about current user, store as object
  $scope.user = function(){
    $http.get("/userInfo/").then(function(data) {
      return data.data.user;
    }).then( function(result){
      $scope.userInfo = result;
      console.log(result);
    })
  }
  // Display user's playlist given playlist number
  $scope.refreshPlaylist = function(index) {
    console.log(index);
    $http.get("/playlists?index="+index).then(function(data) {
      // do something with the tracks
      console.log(data)
      $scope.playlists = [];
      $scope.songs = [];
      $scope.test = $sce.trustAsHtml('<iframe src="https://open.spotify.com/embed/playlist/'+data.data.songs[index].id+'" width="500" height="700" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>');
      for(var i = 0; i < data.data.songs.size; i++) {
        $scope.playlists.push(data.data.songs[i].name);
      }
      $scope.weather_view = 0;
      $scope.playlistName = data.data.songs.body.name;
      $scope.playlistCreator = data.data.songs.body.owner.display_name;
      if(data.data.songs.body.images.length > 0){
        $scope.playlistImg = data.data.songs.body.images[0].url;
      } else {
        $scope.playlistImg ="noimage.png";
      }
      $scope.playlistDescription = data.data.songs.body.description;
      var dur = 0;
      for(var i = 0; i < 20; i++) {
        var song = [];
        var curr = data.data.songs.body.tracks.items[i].track;
        song.push( curr.name);//title
        song.push( curr.artists[0].name);//artist
        song.push( curr.album.name); //album
        dur+=curr.duration_ms;
        song.push( msToHMS(curr.duration_ms)); //time(ms)
        song.push( $sce.trustAsHtml('<iframe src="https://open.spotify.com/embed/track/'+curr.id+'" width="80" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'));//to get the uri
        $scope.songs.push(song);
      }
      $scope.playlistDuration = msToHMS(dur);
    })
  }
  //weather output for navbar
  $scope.getWeather = function() {
    $http.get("/weather").then(function(data) {
      $scope.weather = [];
      $scope.weather.push(data.data.weather.main.temp);
      $scope.weather.push("http://openweathermap.org/img/wn/"+data.data.weather.weather[0].icon+".png");
      $scope.weather.push("http://openweathermap.org/img/wn/"+data.data.weather.weather[0].icon+"@2x.png");
      console.log(data.data.weather);
    })
  }
  $scope.getStocks = function() {
    $http.get("/stonks").then(function(data) {
      var count = 0;
      var current;
      var prev_close;
      for(var i in data.data.data) {
        if(count == 0){
          current = data.data.data[i]["4. close"];
        } else if(count == 1) {
          prev_close = data.data.data[i]["4. close"];
        } else {
          break;
        }
        count++;
      }
      var change = (current-prev_close)/(prev_close)
      console.log(change*100);
      $scope.dji = (change*100);
      if($scope.dji >= 0)
        $scope.arrow = 'arrow-green.png';
      else
        $scope.arrow = 'arrow-red.png';
    })
  }
  $scope.getStats = function() {
    $http.get("/stats").then(function(data) {
      console.log(data);
      $scope.top = [];
      $scope.arts = [];
      entry = [];
      for(var i = 0; i < 5;i++) {
        var obj = data.data.data.body.items;
        entry = [];
        entry.push(obj[i].name);
        entry.push(obj[i].artists[0].name);
        entry.push(obj[i].album.name);
        entry.push(msToHMS(obj[i].duration_ms));
        entry.push('{\'width\': \''+obj[i].popularity*6+'px\'}');
        if(obj[i].album.images.length >=2)
          entry.push(obj[i].album.images[2].url);
        else 
          entry.push('noimage.png');
        $scope.top.push(entry);
        var arts = data.data.data.body.previous;
        entry = [];
        entry.push(arts[i].name);
        entry.push(arts[i].genres[0]);
        entry.push(arts[i].followers.total);
        entry.push(arts[i].popularity);
        entry.push('{\'width\': \''+arts[i].popularity*6+'px\'}');
        if(arts[i].images.length >=2)
          entry.push(arts[i].images[2].url);
        else 
          entry.push('noimage.png');
        $scope.arts.push(entry);
      }
    })
    $http.get("/stats/detailed").then(function(data) {
      console.log(data.data.data[0].body);
      var averages = [0,0,0,0,0,0,0,0,0,0,0];
      var feat_cnt = 0;
      for(var i = 0; i < 5; i++) {
        var x = data.data.data[i].body;
        for(feat in x){
          console.log(x[feat]);
          if(feat_cnt <= 10)
            averages[feat_cnt] += (x[feat]/5);
          feat_cnt++;
        }
      }
      console.log(averages);
     
      $scope.features = ['{\'height\': \'100px\'}','{height: 1px}','{height:22px}','{height: 30px}'];
    })
  }
  //helper function for changing a knobs value 
  $scope.setKnob = function(i, val) {
    knobs[i].setValue(val);
    dial_settings[i] = val;
  }
  $scope.setKnobs = function() {
    //these are pretty close to average across all songs
    $scope.setKnob(0,14);
    $scope.setKnob(2, 120);
    $scope.setKnob(4, 5);
    $scope.setKnob(5, 15);
    $scope.setKnob(6, -5);
    $scope.setKnob(7, 76);
    $scope.setKnob(8, 5);
    $scope.setKnob(9, 60);
    $scope.setKnob(10, 70);
    $scope.setKnob(11, 10);
  }
  $scope.getUserPresetName = function (){
    document.getElementById('playlist-editor').style.display='none';
  }
  // POST user preferences
  $scope.saveUserPreset = async function(){
    var name = jq('#userPresetNameInput').val();
    jq('#userPresetNameModal').modal('hide');
    jq('#playlist-editor').modal('show');
    var knobs = getKnobValues();
    var data = {
      id: $scope.userInfo.id,
      name: name,
      key: knobs[0],
      key_confidence: knobs[1],
      tempo: knobs[2],
      tempo_confidence: knobs[3],
      instrumentalness: knobs[4],
      liveness: knobs[5],
      loudness: knobs[6],
      energy: knobs[7],
      speechiness: knobs[8],
      valence: knobs[9],
      danceability: knobs[10],
      acousticness: knobs[11]
    };
    var options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    };

    var response = await fetch('/newUserPreset', options);
    var responseData = await response.json();
  }
  $scope.changeActive = function(id) {
    document.getElementById($scope.currid).className = 'nav-link'; 
    document.getElementById(id).className = 'nav-link active';
    $scope.currid = id;
}
}]);
