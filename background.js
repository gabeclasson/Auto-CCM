function openAboutPage(info, tab){
	chrome.tabs.create({  
    url: "https://ospiro.com/products-services/auto-ccm/"
  });
}

chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
      "id": "how2use",
      "title": "How to Use Auto CCM",
      "contexts": ["page_action"]
    });
	chrome.contextMenus.onClicked.addListener(openAboutPage);
  });


chrome.tabs.onActivated.addListener(function (tabs) { 
	chrome.tabs.get(tabs.tabId, function (tab){
		if (tab.url.includes("courseware.illinois.edu")){
			chrome.pageAction.show(tabs.tabId);
		}
	});
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	if (tab.url.includes("courseware.illinois.edu")){
		chrome.pageAction.show(tabId);
	}
});

chrome.pageAction.onClicked.addListener(function(tab) {
   chrome.tabs.executeScript(null, {file: "autoctrlm.js"});
}
);