// Copyright (c) 2014 Iwan Gabovitch. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

$(window).load(function(){

// style additions
$("<style type='text/css'>\
.yourTicket { background-color: rgb(197, 255, 144); }\
.moderation-unsure-ticket { padding: 4px; }\
</style>").appendTo("head");

// moderator name
var modName = $("#account_user").text();

// add tardy user/moderator colors
$(".moderation-unsure-ticket").each(function (i, row) {

  var ticketModName = $(this).text().split('assigned to ')[1].split(' | ')[0];

  if ( ticketModName == modName ) {
    $(this).addClass("yourTicket");
  }
})

});
