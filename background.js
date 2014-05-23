// Copyright (c) 2014 Iwan Gabovitch. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  console.log(sender.tab ?
              "from a content script:" + sender.tab.url :
              "from the extension");

  if (request == "save") {

    // save settings
    // http://stackoverflow.com/questions/23160600/chrome-extension-local-storage-how-to-export
    chrome.storage.local.get(null, function(data) { // null implies all items
      // Convert object to a string.
      var result = JSON.stringify(data);

      // Save as file
      var url = 'data:application/json;base64,' + btoa(result);
      chrome.downloads.download({url: url, filename: "SupermodSettings.json"});
    });

  }
});
