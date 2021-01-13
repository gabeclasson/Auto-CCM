var chrome;
var browser = browser || chrome;
// Creates shortcuts for various sites
browser.runtime.onInstalled.addListener(function () {
	browser.contextMenus.create({
		"id": "how2use",
		"title": "How to Use Auto CCM",
		"contexts": ["page_action"]
	});
	browser.contextMenus.create({
		"id": "courseware",
		"title": "CAS-ILE",
		"contexts": ["page_action"]
	});
	browser.contextMenus.create({
		"id": "doc",
		"title": "Mathematica Documentation",
		"contexts": ["page_action"]
	});
});

// Allows site shortcuts to be clicked, bringing the user to a new tab
browser.contextMenus.onClicked.addListener(function (info, tab) {
	if (info.menuItemId === "how2use") {
		browser.tabs.create({
			url: "https://ospiro.com/products-services/auto-ccm/"
		});
	} else if (info.menuItemId === "courseware") {
		browser.tabs.create({
			url: "https://courseware.illinois.edu"
		});
	} else if (info.menuItemId === "doc") {
		browser.tabs.create({
			url: "https://reference.wolfram.com/language/"
		});
	}
});

browser.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
	console.log("ALERTALERT! " + request.className);
	if (request.className == "getSyncStorage") {
		browser.storage.sync.get({
			spellCheck: true,
			unsavedIndicator: true,
			warningDialog: true,
			blocklist: [],
			allowlist: [],
			menubackgroundcolor: "#1E90FF"
		}, function (items) {
			console.log(browser.runtime.getURL(""));
			sendResponse({
				items: items,
				url: browser.runtime.getURL("")
			});
		});
	} else if (request.className == "mockButtonEnable") {
		browser.tabs.executeScript(
			sender.tab.id, {
			file: "mockbuttonenable.js"
		});
		sendResponse();
	} else if (request.className == "mockButtonDisable") {
		browser.tabs.executeScript(
			sender.tab.id, {
			file: "mockbuttondisable.js"
		});
		sendResponse();
	} else if (request.className == "injectMenuSetup") {
		var tabId = sender.tab.id;
		var frameUrl = request.frameUrl;
		browser.webNavigation.getAllFrames({
			tabId
		},
			function (details) {
			for (var k = 0; k < details.length; k++) {
				if (details[k].url == frameUrl) {
					browser.tabs.executeScript(
						tabId, {
						file: "menusetup.js",
						frameId: details[k].frameId
					});
					break;
				}
			}
		});
		sendResponse();
	} else if (request.className == "injectAutoCtrlM") {
		var tabId = sender.tab.id;
		var frameId = sender.frameId;
		browser.tabs.executeScript(
			tabId, {
			file: "autoctrlm.js",
			frameId: frameId
		});
		sendResponse();
	} else if (request.className == "getUrl") {
		sendResponse(browser.runtime.getURL(""));
	} else {
		return true;
	}
	return true;
});
