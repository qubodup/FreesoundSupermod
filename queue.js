// Copyright (c) 2014 Iwan Gabovitch. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO
// highlight active user on tardy mod pages and sounds page
// queue post target can't be reloaded comfortably, redirect the first time top sound is not active
// queue redirect to other page if last moderation happened on other page, since pagination is ignored after submit

$(window).load(function(){ // window load

// first sounds needs to be selected
// was a temporary bug
// $('#assigned-tickets-table-wrapper table tr:nth-child(1) td:nth-child(1) a')[0].click();

// constants
var AUTOPLAY = true;
var TODAY = new Date();

// avoids auto-playing first sound when page is loaded
var firstSoundLoad = true;
var soundIsReady = false;

if (document.title == "404 Not Found" || document.title == "Freesound.org - 500 Server Error") {
  $("body").css("background-color", "pink");
  location.reload();
} else { // no error

// translucent images for easy highlighting of selected sound ticket and its user, as bold font would make the columns' width jump, causing usability nightmare
var urlBgDark = chrome.extension.getURL('bgdark.png');
var urlBgLight = chrome.extension.getURL('bglight.png');

// style additions
$("<style type='text/css'>\
body {background: none;}\
br { clear: none !important; }\
#header, h1, h4, #moderation_options_, #footer_wrapper { display: none; }\
#container, #ticket_menu { background: none; margin: 0 !important; padding: 0 !important;}\
#container { width: auto !important; }\
ul { padding-bottom: 0px; }\
#assigned-tickets-table-wrapper {margin-top: -19px;}\
#moderation-decision-form li { margin-right: 5px; font-size: 10px; }\
#moderation-queue-left, #moderation-queue-right, #user-annotations-section { margin: 0 !important; padding: 0 !important; }\
#moderation-queue-left {width: 39%;}\
#moderation-queue-right {width: 34%;}\
#moderation-queue textarea { height: 18px; width: 90%; }\
#moderation-queue-right { margin: 0 .5% !important;}\
#moderation-ticket-link-new { margin: 10px; float: right; }\
#id_moderator_only { width: 24px; }\
.small_player { float: none !important; width: auto !important; height: auto !important;}\
.player.small { width: 100%; height: 35px; }\
.player.small .background { background-size: 100% 35px; }\
#moderation-ticket-link p {margin-bottom: 0;}\
#assigned-tickets-table, #moderation-queue-left h4 { float: right; }\
#assigned-tickets-table { margin-bottom: 2px; }\
#assigned-tickets-table-wrapper { height: auto !important; }\
#ticket_menu { text-align: center; }\
#ticket_menu ul { display: inline-block; padding: 0; }\
.message-list-message { margin: 0; }\
#id_message { width: 98%; a }\
#user-annotations-section { width: 24.5%; margin-top: -19px !important; float: left; word-break: break-all }\
.user-annotations-info img { float: right !important; }\
.user-annotations-info p { float: none !important; }\
.user-annotations-info { margin-top: -37px; }\
table { border: none; }\
tr.rowAcc.alternate-row-odd { background-color: #dfffdf; }\
tr.rowAcc.alternate-row-even { background-color: #cfffcf; }\
tr.rowDfr.alternate-row-odd {background-color: #ffdfdf;}\
tr.rowDfr.alternate-row-even {background-color: #ffcfcf;}\
td { background-color: transparent !important; color: inherit !important; padding: 5px 4px 3px 4px !important; border-right: none; border-bottom: 1px solid transparent; white-space: nowrap; text-overflow: ellipsis;}\
td.decNot { background-color: #CCCCCC !important; }\
td.decAcc { background-color: #63E75C !important; }\
td.decDfr { background-color: #FFFFA3 !important; }\
td.decDel { background-color: #FF0000 !important; }\
td.decSpm { background-color: #FF8A8A !important; }\
.loaded { color: black; background-image: url('" + urlBgDark + "'); }\
.loading { color: grey; background-image: url('" + urlBgLight + "'); }\
.batch-controls, .pagination { text-align: right; margin-right: 8px;; clear: both; }\
.pagination li { float: none !important; display: inline; }\
.batch-controls { margin: 0; line-height: 12px; }\
.user-annotations-wrapper, form { padding: 4px; border: none; background: #eff;}\
.sound_title, .sound_filename, .sound_description {float: none !important;}\
.sound_title, .sound_filename, .sound_description, .sound_tags { width: auto !important; }\
.sample_player { width: 100% !important; }\
.sample_player_small { width: auto; margin-bottom: 0;}\
#decisions {list-style: none; padding-left: 0;}\
.number_of_results { display: inline-block; }\
button { margin: 5px; ]\
 </style>").appendTo("head");

// Process is: sound is "selected" by click on onclick link in table, then the sound is "being loaded" (can be slow) and when done, the sound is in "loaded" state

// there is a list of decisions
// keys are also used as HTML input IDs and sound ticket decision classes
decisions = {
  nothing: {
    title: "Do nothing",
    cssClass: "decNot",
    action: "nothing",
    message: ""
  },
  accept: {
    title: "Accept",
    cssClass: "decAcc",
    action: "accept",
    message: ""
  },
  acceptDetails: {
    title: "Accept, details",
    cssClass: "decAcc",
    action: "accept",
    message: "Hello and thank you for your upload!\n\nPlease include in the description, how it was created. What software, which recording device, where were samples taken from? Date, time and location are also great for field recordings.\n\nTo find the edit page:\n1. Click on your sound TITLE at the top left on this page.\n2. Follow the EDIT SOUND INFORMATION link in the bottom right sidebar.\n\nThanks!"
  },
  deferDetails: {
    title: "Defer, details",
    cssClass: "decDfr",
    action: "defer",
    message: "Hello and thank you for your upload!\n\nPlease include in the description, how it was created. What software, which recording device, where were samples taken from? Date, time and location are also great for field recordings.\n\nTo find the edit page:\n1. Click on your sound TITLE at the top left on this page.\n2. Follow the EDIT SOUND INFORMATION link in the bottom right sidebar.\n\nThanks!"
  },
  deferEnglish: {
    title: "Defer, English",
    cssClass: "decDfr",
    action: "defer",
    message: "Hello and thank you for your upload!\n\nPlease add an English language description of the sound and how it was created.\n\nTo find the edit page:\n1. Click on your sound TITLE at the top left on this page.\n2. Follow the EDIT SOUND INFORMATION link in the bottom right sidebar.\n\nThanks!"
  },
  deferSampleSynth: {
    title: "Defer, sample synth",
    cssClass: "decDfr",
    action: "defer",
    message: "Hello and thank you for your upload!\n\nCan you please clarify whether this sound is sample-based?\n\nYou can see more details about why we ask for this information in YOU SAMPLED A SYNTHESISER of the FAQ http://freesound.org/help/faq/#sounds-4 .\n\nThanks!"
  },
  deferVoice: {
    title: "Defer, permission",
    cssClass: "decDfr",
    action: "defer",
    message: "Hello and thank you for your upload!\n\nPlease clarify: did the performer or voice actor/singer/speaker give permission to record and upload their voice to Freesound?\n\nThanks!"
  },
  deferSpam: {
    title: "Defer, spam",
    cssClass: "decSpm",
    action: "spam",
    message: "spam"
  },
  deleteProduced: {
    title: "Delete produced",
    cssClass: "decDel",
    action: "delete",
    message: "Hello and thank you for your upload!\n\nFreesound does not host produced music tracks, audiobooks or podcasts. Please see http://freesound.org/help/faq/#other-0 for suggestions on what sites can be used for music. Also consider http://opengameart.org for game music.\n\nThanks for your understanding!"
  },
  deleteRip: {
    title: "Delete illegal",
    cssClass: "decDel",
    action: "delete",
    message: "Hello and thank you for your upload!\n\nFreesound only hosts files that are not copyright infringing. Audio taken from copyright protected video, games, software, electronic sample-based toys, audio, compositions or voice recordings made without permission of the speakers are subject to copyright of their owners. Please do not upload other people’s copyrighted works without explicit permission from the copyright holders.\n\nThanks for your understanding!"
  }
}

/////////////////////////////////////////////////////////////////////
// all that needs to be done after sound is loaded: visuals, user mod...
function setupDecisionsUser() {

  // move ticket link for easier access
  $("#moderation-ticket-link-new").remove();
  $("#moderation-ticket-link p a").attr('id', 'moderation-ticket-link-new');
  $("#moderation-ticket-link p a").appendTo($("div#moderation-form form div:nth-child(3)"));
  //$("#moderation-ticket-link").remove();

  // add decision selection in user column
  var decisionsHTML = "";
  for (var key in decisions) {
    if (decisions[key].message == "") {
      var message = "[No message]";
    } else {
      var message = "Message: " + decisions[key].message;
    }

    // extend decisions dialog html code
    decisionsHTML = decisionsHTML + ("<li><input name='decisions' type='radio' id='" + key + "'/><label for='" + key + "' title='" + message + "' >" + decisions[key].title + "</label></li>");
  }

  // inject decision dialog
  $(".user-annotations-info").append("\
    <p><strong>User decisions:</strong></p>\
    <ul id='decisions'>" + decisionsHTML + "</ul>\
  ");

  // get username from user column
  var username = $(".user-annotations-info p a:first").text();

  // load already made decision
  chrome.storage.local.get('decisionsUsers', function(data) {
    var decisionsUsers = data.decisionsUsers;

    // create object if it does not exist yet
    if (typeof decisionsUsers == "undefined") {decisionsUsers = {};}

    // if current user has a decision
    if (username in decisionsUsers) {

      // set decision
      $("#" + decisionsUsers[username]).prop('checked', true);

    }
  });

  /////////////////////////////////////////////////////////
  // highlight active sound and active user in sound ticket column and play sound

  // highlight user
  $('#assigned-tickets-table-wrapper table tbody tr').each(function (i, row) {

    // remove highlights on all sounds and users
    $(this).removeClass("loading loaded");
    $(this).children("td:nth-child(3)").removeClass("loaded");
    $(this).children("td:nth-child(1)").removeClass("loaded");

    // add highlight if the user is right
    if ( username.indexOf($(this).children("td:nth-child(3)").text()) > -1 ){
      $(this).children("td:nth-child(3)").addClass("loaded");
    }
  });

  // add loaded class to currently selected
  $("tr.mod-selected-row").addClass("loaded");
  $("tr.mod-selected-row td:nth-child(1)").addClass("loaded");

  /////////////////////////////////////////////////
  // bind radio buttons to local storage operations
  $('#decisions li input').each(function (i, radio) {

    $(radio).bind('click', function() {

      // get decision key (hidden in radio button's id)
      var decision = $(radio).attr("id");
      chrome.storage.local.get('decisionsUsers', function(data) {

        var decisionsUsers = data.decisionsUsers;

        // create object if it does not exist yet
        if (jQuery.isEmptyObject(decisionsUsers)) { decisionsUsers = {}; };
        decisionsUsers[username] = decision;

        //
        chrome.storage.local.set( { "decisionsUsers": decisionsUsers }, function (result) {
          // remove classes of user's sounds
          // update user's sounds decision indicator
          $('#assigned-tickets-table-wrapper table tbody tr').each(function (i, row) {
            var userNameField = $(this).children("td:nth-child(3)");

            // get username from user column
            var username = $(".user-annotations-info p a").first().text();

            if (userNameField.text() == username) {
              $(userNameField).removeClass("decNot decAcc decDfr decDel decSpm");
              $(userNameField).addClass(decisions[decision].cssClass);
              $(userNameField).attr("data-user-decision", decision);
              $(userNameField).attr("title", decisions[decision].title);
            }
          });
        })
      });
    })
  })

} // end function setupDecisionsUser()

// update ticket decisions according to storage
function updateDecisionsTickets(decisionsTickets) {
  // remove classes of user's sounds
  // update user's sounds decision indicator
  $('#assigned-tickets-table-wrapper table tbody tr').each(function (i, row) {

    // save sound title field for readable code later
    var soundTitleField = $(this).children("td:nth-child(1)");

    // get ticket id 
    var ticket = $(this).find("td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

    // apply style
    $(soundTitleField).removeClass("decNot decAcc decDfr decDel decSpm");

    if (typeof decisionsTickets[ticket] != "undefined") {
      $(soundTitleField).addClass(decisions[decisionsTickets[ticket]].cssClass);
      $(soundTitleField).attr("title", decisions[decisionsTickets[ticket]].title);
    }
  });
}

// observe when user moderation widget is loaded, since otherwise elements might not be ready
// http://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    // when new nodes are added
    if (mutation.addedNodes) {
      if ($(mutation.addedNodes).hasClass("user-annotations-wrapper")) {
        setupDecisionsUser();
        if (firstSoundLoad) {
          autoModerate();
        }
        firstSoundLoad = false;
      } else if ($(mutation.addedNodes).hasClass("sample_player_small")) {
        soundIsReady = true;
      }
    }
  })
})
observer.observe($("#moderation-queue")[0], {
    childList: true
  , subtree: true
  , attributes: false
  , characterData: false
})

// display user decisions in sounds column
// display sound ticket decisions in sounds column

// get user decisions
chrome.storage.local.get('decisionsUsers', function(data) {
  var decisionsUsers = data.decisionsUsers;

  // create object if it does not exist yet
  if (jQuery.isEmptyObject(decisionsUsers)) { decisionsUsers = {}; };

  // for each sound ticket
  $('#assigned-tickets-table-wrapper table tbody tr').each(function (i, row) {

    // get ticket id 
    var ticket = $(this).find("td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

    // insert quick ticket links and checkbox for applying user handling
    $(this).find("td:nth-child(1)").after("<td><input title='check to apply user decision' type='checkbox'></input>");

    // get status ("Accepted" or "Deferred"), trim for safety(?)
    var status = $(this).children("td:nth-child(5)").text().trim();

    // make status strings compact
    // turn status indicators into ticket links to save additional space
    // add classes according to status
    if ( status == "Accepted" ) {
      $(this).children("td:nth-child(5)").html("<a target='_blank' href='http://freesound.org/tickets/" + ticket + "/' title='Accepted ticket'>A</a>");
      $(this).addClass('rowAcc');
    } else if ( status == "Deferred" ) {
      $(this).children("td:nth-child(5)").html("<a target='_blank' href='http://freesound.org/tickets/" + ticket + "/' title='Deferred ticket'>D</a>");
      $(this).addClass('rowDfr');
    }

    // convert date to days, to save space and sanity
    var sound_date_array = $(row).children("td:nth-child(4)").text().split("/");
    var sound_date = new Date(sound_date_array[2], sound_date_array[1] - 1, sound_date_array[0]);
    var sound_days = Math.floor((TODAY - sound_date) / 1000 / 60 / 60 / 24);
    $(this).children("td:nth-child(4)").text(sound_days + "d");

    // read username from HTML
    var userNameField = $(this).children("td:nth-child(3)");
    var username = userNameField.text();

    // update user name decision indicator

    // if user was decided upon
    if (username in decisionsUsers) {

      // save decision class to variable
      var cssClass = decisions[decisionsUsers[username]].cssClass;

      // save decision to variable
      var decision = decisionsUsers[username];

      // apply class
      $(userNameField).removeClass("decNot decAcc decDfr decDel decSpm");
      $(userNameField).addClass(cssClass);

      // apply user decision data
      $(userNameField).attr("data-user-decision", decision);
      $(userNameField).attr("title", decisions[decision].title);
    }
    // make ticket decision checkbox interactive
    $(this).children("td:nth-child(2)").on('click', 'input', function(){

      $(row).children("td:nth-child(2)").find("input");

      // get decision of the sound's user
      var decisionUser = $(row).children("td:nth-child(3)").attr("data-user-decision");

      // superfluous, see above?
      // get ticket id 
      //var ticket = $(this).parent("tr").children("td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

      // get ticket decisions
      chrome.storage.local.get('decisionsTickets', function(data) {
        var decisionsTickets = data.decisionsTickets;

        // create object if it does not exist yet
        if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };
        decisionsTickets[ticket] = decision;

        // depending on whether checkbox is checked or unchecked
        if ($(row).children('td:nth-child(2)').find('input').prop('checked') && decisionUser) {

          // add new sound ticket decision object
          decisionsTickets[ticket] = decisionUser;

        } else if (typeof decisionsTickets[ticket] != "undefined") {

          // remove new sound ticket decision object
          delete decisionsTickets[ticket]

        } else {

          $(row).children('td:nth-child(2)').find('input').prop('checked', false);

        }

        // save changed ticket decisions and update
        chrome.storage.local.set( { "decisionsTickets": decisionsTickets }, updateDecisionsTickets(decisionsTickets));
      });
    })

  });
}); // end get user decisions


// display ticket decisions in sounds column
chrome.storage.local.get('decisionsTickets', function(data) {
  var decisionsTickets = data.decisionsTickets;

  // create object if it does not exist yet
  if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };

  $('#assigned-tickets-table-wrapper table tbody tr').each(function (i, row) {

    // get ticket id from html
    var ticket = $(this).find("td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

    // save sound title field for readable code later
    var soundTitleField = $(this).children("td:nth-child(1)");

    // update sound ticket decision indicator
    if (typeof decisionsTickets[ticket] != "undefined") {
      var cssClass = decisions[decisionsTickets[ticket]].cssClass;
      var title = decisions[decisionsTickets[ticket]].title;
      $(soundTitleField).removeClass("decNot decAcc decDfr decDel decSpm");
      $(soundTitleField).addClass(cssClass);
      $(soundTitleField).attr('title', title);
      $(this).children("td:nth-child(2)").find("input").prop('checked', true);
    }

  });
});

// delays too much plus doesn't adapt to selecting other sounds
//$(".user-annotations-info").appendTo("#current_sound");
//$("#user-annotations-section").appendTo("#moderation-form-wrapper");
// for 3 column design
$("#user-annotations-section").appendTo("#moderation-queue");
$("#moderation-form").prependTo("#moderation-form-wrapper");
// to make background reach bottom after we hide clearing breaks
//$("br").first().remove();
$("#moderation-queue").append("<div style='clear: both;'></div>");

// add numbers to minimal ui
var soundCountMine = $("#moderation-queue-left h4").text().split("(")[1].split(")")[0];
var soundCountNobodys = $(".new_tickets_count div").text();
$("#ticket_menu ul li:nth-child(3)").append(" (" + soundCountMine + ")");
$("#ticket_menu ul li:nth-child(2)").append(" (" + soundCountNobodys + ")");

// minimize navigation by reducing string lengths
$("#ticket_menu ul li:nth-child(1) a").text("Moderation");
$("#ticket_menu ul li:nth-child(3) a").text("Queue");
$("#ticket_menu ul li:nth-child(4) a").text("Guide");
$("#ticket_menu ul li:nth-child(1)").prepend("<li><a href='/'>Freesound</a></li>");

// minimize pagination a little bit because I don't know
$(".pagination li:nth-child(1).previous-page a").text("pre");
$(".pagination li:nth-child(1).disabled-previous-next").text("pre");

// add user decision buttons under sound tickets column
$("#assigned-tickets-table").after("<p class='batch-controls'>Decisions:\
<button title='Apply user decisions to active sound tickets seen above. Note that existing sound ticket decisions will be overwritten if the user decision has been changed since the last time' id='batch-apply'>apply all</button>\
<button title='Apply user decisions to active sound tickets seen above. Note that existing sound ticket decisions will NOT be overwritten.' id='batch-new'>apply new</button>\
<button title='Remove user decisions from active sound tickets seen above.' id='batch-remove'>remove</button></p>");

// make the apply all link apply user decisions to sounds
$('.batch-controls button').bind('click', function(){

  thisButton = $(this);
  // get ticket decisions
  chrome.storage.local.get('decisionsTickets', function(data) {
    var decisionsTickets = data.decisionsTickets;

    // create object if it does not exist yet
    if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };

    // remember id for behavior later
    var linkId = $(thisButton).prop('id')

    // for each line
    $('#assigned-tickets-table tbody tr').each(function (i, row) {

      // get decision of the sound's user
      var decisionUser = $(row).children("td:nth-child(3)").attr("data-user-decision");
      // get ticket id 
      var ticket = $(row).find("td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

      // get ticket status
      var status = $(row).find("td:nth-child(5)").text();

      // if user has decision and apply button is pressed or new button is pressed and sound ticket has no decision, only do this for active sounds
      if (decisionUser && status == "A" && (linkId == "batch-apply" || (linkId == "batch-new" && !$(row).find("td:nth-child(2) input").is(':checked')))) {

        // set the checkbox to checked
        $(row).find("td:nth-child(2) input").prop('checked', true);

        // apply decision to ticket
        decisionsTickets[ticket] = decisionUser;

      // if user has decision and remove button is pressed
      } else if ( decisionUser && linkId == "batch-remove") {

        // if there is anything to remove
        if (typeof decisionsTickets[ticket] != "undefined") {

          // remove new sound ticket decision object
          delete decisionsTickets[ticket]

          // set the checkbox to not checked
          $(row).find("td:nth-child(2) input").prop('checked', false);

        }
      }

    })

    // save changed ticket decisions and update
    chrome.storage.local.set( { "decisionsTickets": decisionsTickets }, updateDecisionsTickets(decisionsTickets));
  });

})

// Haven't found a pure MutationObserver solution for reliably stopping playback
// it appears that a separate function is needed to be 'quck enough' at stopping playback, before the element disappears
$('#assigned-tickets-table-wrapper table tr td:nth-child(1) a').bind('click', function(){

  // stop playing sound
  if(AUTOPLAY && $("#current_sound .toggle-alt").length > 0) {
    $("#current_sound .toggle-alt")[0].click();
  }
})

// get row objects
var rows = $('#assigned-tickets-table-wrapper table tr')

// sound playback and loading class are controlled by the click event
$(rows).find('td:nth-child(1) a').bind('click', function(){

  // ensures same sound doesn't get played instantly, as there otherwise would be no way to tell that a new element has been loaded, since it is identical to the previous one
  soundIsReady = false;

  // mark clicked row as loading, this class gets removed in MutationObserver later
  $(this).parent().parent().addClass("loading");

  var row = $(this).parent().parent().parent().children().index($(this).parent().parent());
  var rowId = $(this).attr("onclick").split('/display/')[0].split('/sounds/')[1];
  // 1. mark clicked as loading
  rows.eq(row).addClass("loading")
  var timer = 0;

  // continuous function
  var loadCheck = setInterval(function(){

    // gets currrently loaded sound ID
    var soundId = $("#moderation-queue-right #current_sound.sound_list_moderation .sample_player_small").attr('id');

    // when sound is loaded (and autoplay is set)
    if (soundId == rowId && AUTOPLAY && soundIsReady) {

      // play sound
      $("#current_sound .toggle")[0].click();

      // stop repeating
      clearInterval(loadCheck);

    }

    // repeat each .25s
    timer = timer + 250;

    // timeout after 5s
    if (timer > 5000) {
      // stop repeating
      clearInterval(loadCheck);
    }

  },250);

});

// automatic sound moderation
function autoModerate() {

  // get sound ticket decision
  chrome.storage.local.get('decisionsTickets', function(data) {
    var decisionsTickets = data.decisionsTickets;

    // create object if it does not exist yet
    if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };

    // moderate top sound only to avoid confusion & mistakes
    // get ticket id 
    var ticket = $("#assigned-tickets-table-wrapper table tbody tr td:nth-child(1) a").attr("onclick").toString().split("tickets/")[1].split("/')")[0];

    // sound ticket decision
    var decision = decisionsTickets[ticket];

    // if top sound has a decision
    if (typeof decision != "undefined" && decision != "nothing") {
      
      // make background pink when automatic action is ongoing
      $('#wrapper').css('background-color', 'pink');

      // get top line's username
      var username = $("tr:nth-child(1) td:nth-child(3)").text();

      // check whether top line is active
      var is_active = $("tr:nth-child(1) td:nth-child(5)").text().trim() == "A";

      // check whether the first sound ticket is selected
      var is_first = $("tr:nth-child(1)").hasClass("mod-selected-row");

      if (decision.action == "accept") {
        
        // accept
        $('#id_action_0').prop('checked', true);

      } else if (decision.action == "defer" || decision.action == "spam") {

        // defer
        $('#id_action_2').prop('checked', true);

        if (decision.action == "spam") {

          // check moderator only checkbox
          $('#id_moderator_only').prop('checked', true);

        }

      } else if (decision.action == "delete") {

        // delete
        $('#id_action_1').prop('checked', true);

      }

      // "press" submit
      // make sure first row is selected for safety

      // check modAuto setting in local storage
      chrome.storage.local.get('modAuto', function(data) {
        var modAuto = data.modAuto

        if (modAuto && is_first && is_active ) {

          // insert message
          var message = decision.message;
          $('#id_message').val(message);
          $('#id_message').css('height', '200px');

          // press button
          $('input[value="send"]').select().click();
          // needs jquery-ui, doesn't seem to be necessary
          //trigger($.Event( 'keydown', {which:$.ui.keyCode.ENTER, keyCode:$.ui.keyCode.ENTER})).click();

          // disable all input while sending
          $("input").prop("disabled", true);
        }
      });
    }

  });


} // end automatic sound moderation

} // no error

}); // window load
