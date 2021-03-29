/*
Author: Gabe Classon
This script is the browser background script that allows communication between many essential APIs and the extension.  
*/
var browser = browser || chrome; // To ensure compatability between Firefox and Chrome

/*
Creates shortcuts (context menus) that appear when the the Auto CCM icon is clicked.
 */
browser.runtime.onInstalled.addListener(function () {
	// How to use Auto CCM
	browser.contextMenus.create({
		"id": "how2use",
		"title": "How to Use Auto CCM",
		"contexts": ["page_action"]
	});
	// Courseware (CAS-ILE)
	browser.contextMenus.create({
		"id": "courseware",
		"title": "CAS-ILE",
		"contexts": ["page_action"]
	});
	// Wolfram language documentation
	browser.contextMenus.create({
		"id": "doc",
		"title": "Mathematica Documentation",
		"contexts": ["page_action"]
	});
});

/*
Listens for when users click on the aforementioned shortcuts (context menus) to open up new tabs
that bring them to their desired site
 */
browser.contextMenus.onClicked.addListener(function (info, tab) {
	// How to use Auto CCM
	if (info.menuItemId === "how2use") {
		browser.tabs.create({
			url: "https://ospiro.com/products-services/auto-ccm/#how2use"
		});
		// Courseware (CAS-ILE)
	} else if (info.menuItemId === "courseware") {
		browser.tabs.create({
			url: "https://courseware.illinois.edu"
		});
		// Wolfram language documentation
	} else if (info.menuItemId === "doc") {
		browser.tabs.create({
			url: "https://reference.wolfram.com/language/"
		});
	}
});

/*
Listens for messages from the extension. Messages sent by the extension's content scripts to get the background page
to perform some action that it would not be possible or practical for the content scripts themselves to perform.
 */
browser.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
	console.log("You've got mail! " + request.className);
	/*
	Gets
	 */
	if (request.className == "getSyncStorage") {
		browser.storage.sync.get({
			spellCheck: true,
			unsavedIndicator: true,
			warningDialog: true,
			blocklist: [],
			allowlist: [],
			casileClassic: false,
			menubackgroundcolor: "#663333",
			textStyleMenu: true
		}, function (items) {
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
	} else if (request.className == "classicThemeTab") {
		var tabId = sender.tab.id;
		var frameId = sender.frameId;
		browser.storage.sync.get({
			casileClassic: false,
		}, function (items) {
			if (items.casileClassic) {
				browser.tabs.executeScript(
					tabId, {
					file: "classicThemeTab.js",
					frameId: frameId
				});
			}
		});
		sendResponse();
	} else if (request.className == "classicThemeMain") {
		browser.storage.sync.get({
			casileClassic: false,
		}, function (items) {
			if (items.casileClassic) {
				browser.tabs.executeScript(
					sender.tab.id, {
					file: "classicThemeMain.js"
				});
			}
		});
		sendResponse();
	} else {
		return true;
	}
	return true;
});
