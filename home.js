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

// style additions
$("<style type='text/css'>\
input { margin-left: .5em } \
label { display: inline !important; padding-left: .5em; margin-right: .5em; }\
.decNot { background-color: #CCCCCC !important; }\
.decAcc { background-color: #63E75C !important; }\
.decAcD { background-color: #79CD40 !important; }\
.decDfr { background-color: #FFFFA3 !important; }\
.decDel { background-color: #FF0000 !important; }\
.decSpm { background-color: #FF8A8A !important; }\
td { background: none !important; }\
textarea { width: 100%; height: 8em;}\
#settings-save { margin-right: 10px; }\
</style>").appendTo("head");

function showSettings() {

  // clear
  $('#modSettings').remove();

  // HTML automatic moderation settings with description
  // save/load settings dialog
  // no is default, for safety
  $("#container h2").after('<div id="modSettings"><h3>Automatic moderation settings</h3><form id="automod">Automatically moderate sound queue \
  <input name="auto" type="radio" id="autoyes" value="yes" />\
  <label for="autoyes">Yes</label>\
  <input id="autono" name="auto" type="radio" value="no" />\
  <label for="autono">No</label>\
  </form>\
  <p>When this is on, the topmost active sound ticket on the "your sound queue" page will be automatically moderated, if it has a decision assigned to it and then the page will be reloaded, continuing with the next sound ticket in line.</p>\
  <h3>Backup or restore settings</h3>\
  <p>This allows to save/restore settings and decision on other computer or after clearing browser data or an extension update.</p>\
  <p><button id="settings-save">Save</button>\
  <input type="file" id="settings-file" /><button id="settings-load">Load</button>\
  <button id="settings-compare">Compare</button><br />\
  Compare shows lists sounds that are in local storage but not in the selected file, for debugging, in case the extension screwed up. Make a backup in case you press "load" by accident.</p>');

  // radio button interaction
  // http://stackoverflow.com/questions/4938876/jquery-find-id-of-clicked-button
  $("#automod input").click(function(){
    if (this.id == "autoyes") {
      var modAuto = true;
    } else {
      var modAuto = false;
    }
    chrome.storage.local.set({'modAuto':modAuto});

    // in case click reactions get delayed
    $('#' + this.id).prop('checked', true);
  });

  // set modAuto setting
  // check local storage
  chrome.storage.local.get('modAuto', function(data) {
    if (chrome.runtime.lastError) {
      console.log("reading storage error");
      console.log(chrome.runtime.lastError);
      return chrome.runtime.lastError;
    }
    var modAuto = data.modAuto
    // restore
    if (modAuto) {
      $('#autoyes').prop('checked', true);
    } else {
      $('#autono').prop('checked', true);
    }
    return
  });

  // bind save/load buttons
  $('#settings-save').bind('click', function() {

    // send message to background page, so chrome.downloads is accessible
    chrome.runtime.sendMessage("save");

  })
  $('#settings-load').bind('click', function(evt) {

    var files = $("#settings-file")[0].files;

    if (!files.length) {
      alert('Please select a file!');
    } else {

      // read file
      // http://stackoverflow.com/questions/4100927/chrome-filereader
      var reader = new FileReader()

      reader.onload = function(e) {

        var settings = $.parseJSON(e.target.result)

        // write settings
        //chrome.storage.local.set(settings)
        chrome.storage.local.set(settings, function() {

          // refresh decisions and settings
          showSettings()
          showDecisions()

        })


      }

      reader.onerror = function(stuff) {
        console.log("error", stuff)
        console.log (stuff.getMessage())
      }

      reader.readAsText(files[0]) //readAsdataURL

    }

  })

  // lists decisions that are are new compared to the chosen old file
  $('#settings-compare').bind('click', function(evt) {

    // clear
    $('#modCompare').remove();

    var files = $("#settings-file")[0].files;

    if (!files.length) {
      alert('Please select a file!');
    } else {

      // read file
      // http://stackoverflow.com/questions/4100927/chrome-filereader
      var reader = new FileReader()

      reader.onload = function(e) {

        var settings = $.parseJSON(e.target.result)

        // write settings
        //chrome.storage.local.set(settings)
        chrome.storage.local.get('decisionsTickets', function(data) {
          var decisionsTickets = data.decisionsTickets;

          // create object if it does not exist yet
          if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };

          // variables
          var trAccept = "";
          var trNonAccept = "";

          // for each sound ticket decision
          for (var ticket in decisionsTickets ) {

            // variables
            var decision = decisionsTickets[ticket];
            var cssClass = decisionsMin[decision].cssClass;
            var title = decisionsMin[decision].title;
            var html = '<tr class="' + cssClass + '"><td>' + title + '</td><td><a href="/tickets/' + ticket + '/">' + ticket + '</a></td></tr>\n';

            var match = (decisionsTickets[ticket] == settings.decisionsTickets[ticket]);
          
            if (!match) {
              if (decisionsTickets[ticket] != "accept" && decisionsTickets[ticket] != "acceptDetails" ) {
                trNonAccept = trNonAccept + html;

              } else {
                trAccept = trAccept + html;
              }
            }

          }
          
          // show decision comparison
          $("#container").append('<div id="modCompare">\
          <h3>Non-accepted new tickets</h3>\
          <table><th>Decision</th><th>Ticket</th>\
          ' + trNonAccept + '</table>\
          <h3>Accepted new tickets</h3>\
          <table><th>Decision</th><th>Ticket</th>\
          ' + trAccept + '</table>\
          </div>');

        })


      }

      reader.onerror = function(stuff) {
        console.log("error", stuff)
        console.log (stuff.getMessage())
      }

      reader.readAsText(files[0]) //readAsdataURL

    }

  })

} // end function showSettings()

function removeTickets(data2) {

  var ticketsBad = data2.data.ticketsBad;

  var newTickets = {};

  // get ticket decisions
  chrome.storage.local.get('decisionsTickets', function(data3) {
    var decisionsTickets = data3.decisionsTickets;

    // create object if it does not exist yet
    if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };

    // for each sound ticket decision
    for (var ticket in decisionsTickets ) {

      // nonmatching tickets that have values
      if (typeof decisionsTickets[ticket] != "undefined" && ticketsBad.indexOf(ticket) == -1 ) {

        // copy to new variable for writing later
        newTickets[ticket] = decisionsTickets[ticket]

      }

    }

    // write object
    // save changed ticket decisions and update
    chrome.storage.local.set( { "decisionsTickets": newTickets }, function() {

      showDecisions();

    })

  })

} // end function removeTickets()


function showDecisions() {

  // clear
  $('#modDecisions').remove();

  chrome.storage.local.get('decisionsTickets', function(data) {
    var decisionsTickets = data.decisionsTickets;

    // create object if it does not exist yet
    if (jQuery.isEmptyObject(decisionsTickets)) { decisionsTickets = {}; };
    decisionsTickets[ticket] = decision;

    // strings for output
    var trRegular = "";
    var trSpam = "";
    var txtSpam ="";

    // lists for button actions
    var ticketsSpam = [];
    var ticketsRegular = [];

    // for each sound ticket decision
    for (var ticket in decisionsTickets ) {

      // object keys don't get deleted
      // http://stackoverflow.com/questions/742623/deleting-objects-in-javascript
      if (typeof decisionsTickets[ticket] != "undefined") {

        // variables
        var decision = decisionsTickets[ticket];
        var cssClass = decisionsMin[decision].cssClass;
        var title = decisionsMin[decision].title;
        var html = '<tr class="' + cssClass + '"><td>' + title + '</td><td><a href="/tickets/' + ticket + '/">' + ticket + '</a></td></tr>\n';

        // depending on whether decision is spam or not spam
        if (decision == "deferSpam") {

          trSpam = trSpam + html;
          txtSpam = txtSpam + '\nhttp://freesound.org/tickets/' + ticket + '/';

          ticketsSpam.push(ticket);

        } else {

          trRegular = trRegular + html;

          ticketsRegular.push(ticket);

        }

      }

    }

    // show ticket decisions
    $("#container").append('<div id="modDecisions">\
    <h3>Spam automatic moderation sound ticket decisions</h3>\
    <table id="ticketsSpam"><th>Decision</th><th>Ticket</th>\
    ' + trSpam + '</table>\
    <button id="delSpam">Delete spam tickets</button>\
    <p>Please remember to report spammers to moderators via mailing list, before deleting their tickets. Convenience list for email below:</p>\
    <textarea>' + txtSpam + '</textarea>\
    <h3>Regular automatic moderation sound ticket decisions</h3>\
    <table id="ticketsRegular"><th>Decision</th><th>Ticket</th>\
    ' + trRegular + '</table>\
    <button id="delRegular">Delete regular tickets</button>\
    <p>Deleting sound ticket decisions might speed up automatic moderation slightly (not recommended).</p>\
    </div>');

    // bind delete actions
    // this will get the ticket decisions again and preserve anything that is not in the 'delete this' list, to avoid deleting things that are not visible at the moment, for example if user changes ticket decisions in another window
    $('#delSpam').bind('click', {ticketsBad: ticketsSpam}, removeTickets);
    $('#delRegular').bind('click', {ticketsBad: ticketsRegular}, removeTickets)

  });

} // end function showDecisions()

showSettings();
showDecisions();

})
