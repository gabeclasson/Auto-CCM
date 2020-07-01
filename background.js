// Creates shortcuts for various sites
chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
      "id": "how2use",
      "title": "How to Use Auto CCM",
      "contexts": ["page_action"]
    });
	chrome.contextMenus.create({
      "id": "courseware",
      "title": "CAS-ILE",
      "contexts": ["page_action"]
    });
	chrome.contextMenus.create({
      "id": "doc",
      "title": "Mathematica Documentation",
      "contexts": ["page_action"]
    });
  });
  
// Allows site shortcuts to be clicked, bringing the user to a new tab
chrome.contextMenus.onClicked.addListener(function (info, tab){
	if (info.menuItemId === "how2use"){
		chrome.tabs.create({  
			url: "https://ospiro.com/products-services/auto-ccm/"
		});
	}
	else if (info.menuItemId === "courseware"){
		chrome.tabs.create({  
			url: "https://courseware.illinois.edu"
		});
	}
	else if (info.menuItemId === "doc"){
		chrome.tabs.create({  
			url: "https://reference.wolfram.com/language/"
		});
	}
});

// Allow the extension to be run on courseware
chrome.tabs.onActivated.addListener(function (tabs) { 
	chrome.tabs.get(tabs.tabId, function (tab){
		if (tab.url.includes("courseware.illinois.edu")){
			chrome.pageAction.show(tabs.tabId);
		}
	});
});

// Allow the extension to be run on courseware
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	if (tab.url.includes("courseware.illinois.edu")){
		chrome.pageAction.show(tabId);
	}
});

// When the icon is clicked, run the extension
chrome.pageAction.onClicked.addListener(function(tab) {
   chrome.tabs.executeScript(null, {file: "autoctrlm.js"});
}
);