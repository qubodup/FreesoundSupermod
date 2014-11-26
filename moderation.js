// Copyright (c) 2014 Iwan Gabovitch. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

$(window).load(function(){

// minimal decisions list
decisionsMin = {
  nothing: {
    title: "Do nothing",
    cssClass: "decNot"
  },
  accept: {
    title: "Accept",
    cssClass: "decAcc"
  },
  acceptDetails: {
    title: "Accept, details",
    cssClass: "decAcc"
  },
  deferDetails: {
    title: "Defer, details",
    cssClass: "decDfr"
  },
  deferEnglish: {
    title: "Defer, English",
    cssClass: "decDfr"
  },
  deferSampleSynth: {
    title: "Defer, sample synth",
    cssClass: "decDfr"
  },
  deferVoice: {
    title: "Defer, permission",
    cssClass: "decDfr"
  },
  deferSpam: {
    title: "Defer, spam",
    cssClass: "decSpm"
  },
  deleteProduced: {
    title: "Delete produced",
    cssClass: "decDel"
  },
  deleteRip: {
    title: "Delete illegal",
    cssClass: "decDel"
  }
}

// style additions
$("<style type='text/css'>\
input { margin-left: .5em } \
label { display: inline !important; padding-left: .5em; margin-right: .5em; }\
.decNot { background-color: #CCCCCC !important; }\
.decAcc { background-color: #63E75C !important; }\
.decDfr { background-color: #FFFFA3 !important; }\
.decDel { background-color: #FF0000 !important; }\
.decSpm { background-color: #FF8A8A !important; }\
</style>").appendTo("head");

// add decisions indicators
// load user decision
chrome.storage.local.get('decisionsUsers', function(data) {
  var decisionsUsers = data.decisionsUsers;

  // create object if it does not exist yet
  if (typeof decisionsUsers == "undefined") {decisionsUsers = {};}

  $('.moderation-user-list .moderation-user-list-user').each(function (i, row) {

    // get username
    var usernameField = $(this).find(".moderation-user-list-user-right p:nth-child(1) a:nth-child(1)");
    var username = usernameField.text();

    // if has a decision
    if (username in decisionsUsers) {

      // add decision class and title
      usernameField.addClass(decisionsMin[decisionsUsers[username]].cssClass);
      usernameField.attr('title', decisionsMin[decisionsUsers[username]].title);

    }
  });
});

// sorting by number of sounds
function sortByCount( selElem ) {
  var tmpAry = new Array();
  for ( var i = 0; i < selElem.length; i++ ) {
    tmpAry[i] = new Array();
    var tmp = $(selElem[i]).html().split("<br>")[1].split(" new sounds")[0].split(">")[1];
    tmpAry[i][0] = parseInt(tmp);
    tmpAry[i][1] = selElem[i];
  }
  tmpAry.sort(function(a,b){var x=a[0];var y=b[0]; return y-x;});
  selElem = [];
  for ( var i = 0; i < tmpAry.length; i++ ) {
    //console.log(i, tmpAry[i][0]);
    var op = tmpAry[i][1];
    selElem.push(op);
  }

  $(".moderation-user-list").html(selElem).after('<div style="clear:both"></div>');

  // text
  $("#container h3").first().text("Users with most new sounds");

  // save to local storage
  chrome.storage.local.set({'modSort':'count'});
};
   
// sorting by date
function sortByDate( selElem ) {

  $(".moderation-user-list").html(selElem).after('<div style="clear:both"></div>');

  // text
  $("#container h3").first().text("Users with oldest new sounds");

  // save to local storage
  chrome.storage.local.set({'modSort':'date'});

};

// sorting by username
function sortByName( selElem ) {

  var tmpAry = new Array();
  for ( var i = 0; i < selElem.length; i++ ) {
    tmpAry[i] = new Array();
    var tmp = $("a", selElem[i]).first().text().toLowerCase();
    tmpAry[i] = [tmp, selElem[i]];
  }
  // http://stackoverflow.com/questions/8996963/
  tmpAry.sort(function(a,b){
    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  });
  selElem = [];
  for ( var i = 0; i < tmpAry.length; i++ ) {
    //console.log(i, tmpAry[i][0]);
    var op = tmpAry[i][1];
    selElem.push(op);
  }

  $(".moderation-user-list").html(selElem).after('<div style="clear:both"></div>');

  // text
  $("#container h3").first().text("Users by name");

  // save to local storage
  chrome.storage.local.set({'modSort':'name'});

};

// assign all sounds to self by creating iframe for each assign page
// might break browser
function assignAll( selElem ) {
  for ( var i = 0; i < selElem.length; i++ ) {
    var tmp = $("a", selElem[i]).last().attr('href');
    $("#container h3").eq(1).after('<iframe style="width:100%;height:25px;" src="' + tmp + '" /></iframe>');

  }
  $('#assignall').after("<p>Wait until all slim iframes above have content loaded and then reload this page.</p>");
  $('#assignall').remove();
}

// backup user 'list' for date sorting
var userlist = $(".moderation-user-list .moderation-user-list-user");

// HTML sorting interface
// date is the default server side sorting
$("#container h2").after('<form>Sort by \
<input checked="checked" name="sort" type="radio" id="radiodate" value="date" />\
<label for="radiodate">Date</label>\
<input id="radiocount" name="sort" type="radio" value="count" />\
<label for="radiocount">Count</label>\
<input id="radioname" name="sort" type="radio" value="count" />\
<label for="radioname">Username</label>\
</form>');

// HTML assign all interface
$("#container h3").eq(1).before('<h3>Assign all</h3>\
<p>Warning: this will create one iframe for each user that has sounds in the queue and might slow down or crash your browser.</p>\
<button id="assignall">Assign all</button>');

// radio button interaction
$("#radiodate").bind('click', function(){
  sortByDate( userlist );
});

$("#radiocount").bind('click', function(){
  sortByCount( userlist );
});

$("#radioname").bind('click', function(){
  sortByName( userlist );
});

// assign all interaction
$("#assignall").bind('click', function(){
  assignAll( userlist );
});

// check local storage
chrome.storage.local.get('modSort', function(data) {
  if (chrome.runtime.lastError) {
    console.log("reading storage error");
    console.log(chrome.runtime.lastError);
    return chrome.runtime.lastError;
  }
  var modSort = data.modSort
  // restore
  if (modSort == "count") {
    sortByCount(userlist);
    $('#radiocount').prop('checked', true);
  } else if(modSort == "name") {
    sortByName(userlist);
    $('#radioname').prop('checked', true);
  }
  return
});

})
