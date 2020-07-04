// Creates shortcuts for various sites
chrome.runtime.onInstalled.addListener(function () {
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
chrome.contextMenus.onClicked.addListener(function (info, tab) {
	if (info.menuItemId === "how2use") {
		chrome.tabs.create({
			url: "https://ospiro.com/products-services/auto-ccm/"
		});
	} else if (info.menuItemId === "courseware") {
		chrome.tabs.create({
			url: "https://courseware.illinois.edu"
		});
	} else if (info.menuItemId === "doc") {
		chrome.tabs.create({
			url: "https://reference.wolfram.com/language/"
		});
	}
});
