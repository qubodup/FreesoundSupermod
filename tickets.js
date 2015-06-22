// Copyright (c) 2014 Iwan Gabovitch. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// style additions
$("<style type='text/css'>\
.decNot { background-color: #CCCCCC !important; }\
.decAcc { background-color: #63E75C !important; }\
.decAcD { background-color: #79CD40 !important; }\
.decDfr { background-color: #FFFFA3 !important; }\
.decDel { background-color: #FF0000 !important; }\
.decSpm { background-color: #FF8A8A !important; }\
button { margin: 10px; }\
 </style>").appendTo("head");

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
    cssClass: "decAcD"
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

// indicate already processed sounds, helpful for quick checking of tickets

// get ticket controls initial values
// closed or deferred
var status = $('#id_tm-status').val();
// OK, PE or undefined
var state = $('#id_ss-state').val();

// change background color of form
if ( status == "deferred" && state == "PE" ) {
  $("#ticket-right form").addClass('decDfr');
} else if ( status == "closed" && state =="OK" ) {
  $("#ticket-right form").addClass('decAcc');
} else if ( status == "closed" && !state ) {
  $("#ticket-right form").addClass('decDel');
}

// get username of this ticket's sound's user
var usernameField = $("#ticket-details-left li:nth-child(1)");
var username = $(usernameField).children("a").text();

// add decisions indicators
// load user decision
chrome.storage.local.get('decisionsUsers', function(data) {
  var decisionsUsers = data.decisionsUsers;

  // create object if it does not exist yet
  if (typeof decisionsUsers == "undefined") {decisionsUsers = {};}

  // if current user has a decision
  if (username in decisionsUsers) {

    // add decision class and title
    usernameField.addClass(decisionsMin[decisionsUsers[username]].cssClass);
    usernameField.attr('title', decisionsMin[decisionsUsers[username]].title);

  }
});

// add pending sounds link
    usernameField.append('(<a href="/tickets/moderation/pending/' + username + '/">pending sounds</a>)');

// add buttons
$("#ticket-right form").after("<button class='decAcc' id='accept'>Accept</button>");
$("#accept").after("<button class='decDfr' id='defer'>Defer</button>");
$("#defer").after("<button class='decDel' id='delete'>Delete</button>");
$("#ticket-page-form form input[type=submit]").after("<button class='decSpm' style='float: right' id='spam'>Spam</button>");
$("#delete").after("<p>Accept sets to Closed/OK and sends.<br>Defer sets to Deferred/Pending and sends.<br>Delete sets to Closed/Delete and sends.</p>");
$("#spam").after("<p style='clear:both;'>Spam writes 'spam' text, enables 'Moderator only' and sends. The moderator then should defer the sound and send the url of this ticket to the moderator mailing list.</p>");
$("h3").eq(2).after("<button id='timeout'>Timeout</button><p>Timeout writes the message 'Please update. This file will timeout in 2 weeks.' and sends it.</p>")
// timeout warning button
$('#timeout').click(function() {
  $('#id_message').val('Please update. This file will timeout in 2 weeks.');

  // submit message form
  $('#ticket-page-form input[value="send"]').select().click();

  // disable all input while sending
  $("input").prop("disabled", true);
})

// accept add button press event
$('#accept').click(function() {
  $('#id_tm-status').val('closed').trigger("change");
  $('#id_ss-state').val('OK').trigger("change");
  $('#ticket-right input[value="send"]').select().click();

  // disable all input while sending
  $("input").prop("disabled", true);
});

// defer add button press event
$('#defer').click(function() {
  $('#id_tm-status').val('deferred').trigger("change");
  $('#id_ss-state').val('PE').trigger("change");
  $('#ticket-right input[value="send"]').select().click();

  // disable all input while sending
  $("input").prop("disabled", true);
});

// delete add button press event
$('#delete').click(function() {
  $('#id_tm-status').val('closed').trigger("change");
  $('#id_ss-state').val('DE').trigger("change");
  $('#ticket-right input[value="send"]').select().click();

  // disable all input while sending
  $("input").prop("disabled", true);
});

// spam add button press event
$('#spam').click(function() {

  // write spam message
  $('#id_message').val('spam');

  // check moderator only
  $('#id_moderator_only').attr('checked','checked');

  // submit message form
  $('#ticket-page-form input[value="send"]').select().click();

  // disable all input while sending
  $("input").prop("disabled", true);

});
