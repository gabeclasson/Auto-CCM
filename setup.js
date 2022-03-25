/*
Author: Gabe Classon
This script is run on the CAS-ILE tab immediately as it loads. Its primary purpose is to detect when Try-Its are opened so that they can be injected with menusetup.js.
 */
var browser = browser || chrome; // To ensure compatability between Firefox and Chrome
// These mutation observers exist to deliver a final payload to each iFrame: code that allow Ctrl+' to deformat math.
var bodyChangeObserver = new MutationObserver(onBodyChange); // Observes the body of the page
var studentPanelChangeObserver = new MutationObserver(onStudentPanelChange); // Observes the student panel of the page to see when a course is opened
var tryItUpdatedObserver = new MutationObserver(onTryItUpdated); // Observes the try-it section of the page to see when a try-it is opened

// The body observer observes until the page fully loads, and then injects the studentPanelChangeObserver
bodyChangeObserver.observe(document.body, {
	attributes: false,
	childList: true,
	subtree: true
});

function onBodyChange() {
	var panels = document.getElementsByClassName("x-panel-body x-panel-body-default x-layout-fit x-panel-body-default");
	var studentPanel;
	for (var i = 0; i < panels.length; i++) {
		if (panels[i].id.includes("studentpanel")) {
			studentPanel = panels[i];
			console.log("Got panel");
			console.log(studentPanel);
		}
	}
	if (studentPanel != null) {
		studentPanelChangeObserver.observe(studentPanel, {
			attributes: false,
			childList: true,
			subtree: false
		});
		bodyChangeObserver.disconnect();
	}
}

// The studentPanelChangeObserver observes for when a user opens up a course, and then adds the Try-It updated observer for each course
function onStudentPanelChange(mutationList, observer) {
	console.log("Panel updated");
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			console.log(addedNodes);
			for (var i = 0; i < addedNodes.length; i++) {
				if (addedNodes[i].id.includes("coursepanel")) {
					// Observes for new Try-Its
					var tabpanel = addedNodes[i].querySelectorAll("[id^=tabpanel][id$=body]")[0];
					tryItUpdatedObserver.observe(tabpanel, {
						attributes: false,
						childList: true,
						subtree: false
					});
				}
			}
		}
	});
}

// The Try-it updated observer observes for when Try-Its are added and injects them with menusetup.js
function onTryItUpdated(mutationList, observer) {
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			console.log("Try It Updated");
			for (var i = 0; i < addedNodes.length; i++) {
				var frame1 = addedNodes[i].getElementsByTagName('iframe')[0];
				frame1.onload = function () {
					injectFrame(frame1);
				};
				console.log(frame1);
			}
		}
	});
}

/*
frame1: The frame to injectFrame
Injects frame1 with menusetup.js
 */
function injectFrame(frame1) {
	browser.runtime.sendMessage({
		className: "injectMenuSetup",
		frameUrl: frame1.src
	},
		function () {
		console.log("injectMenuSetupReceived");
	});
}

// Allows Ctrl+S pressed outside of a Try-It window to still cause the currently open Try-It to be saved.
function onDocumentKeyDown(e) {
	if (e.key == 's' && e.ctrlKey) {
		e.preventDefault();
		var currentFrame = document.querySelector("[id^='popuptabpanel']:not(.x-hide-offsets):not([id*='body'])").querySelector("iframe");
		var currentWindow = currentFrame.contentWindow;
		var keyDown = new KeyboardEvent("keydown", {
				"key": "s",
				"code": "KeyS",
				"location": 0,
				"ctrlKey": true,
				"shiftKey": false,
				"altKey": false,
				"metaKey": false,
				"repeat": false,
				"isComposing": false,
				"charCode": 83,
				"keyCode": 83,
				"which": 83
			});
		currentWindow.dispatchEvent(keyDown);
	}
}

document.addEventListener("keydown", onDocumentKeyDown)

// Gets the current active tab (that is, the little tab button) 
function activeTab() {
	var allStudentPanels = document.querySelectorAll(("[id^=coursepanel][id$=body]"));
	var activePanel;
	for (var k = 0; k < allStudentPanels.length; k++) {
		if (allStudentPanels[k].parentElement.classList.contains("x-hide-offsets")) {
			continue;
		} else {
			activePanel = allStudentPanels[k];
			break;
		}
	}
	return activePanel.getElementsByClassName("x-tab-active")[0]; 
}

// Here, we deal with closing the default close dialog when there are no unsaved changes

let closeDialogCreatedObserver = new MutationObserver(onBodyChildAdded); 
let closeDialogFocusedObserver = new MutationObserver(onCloseDialogChange); 
let tabsWithUnsavedWork = []; 

// Observes the body's children in the hopes of catching the child that is the close dialog
function onBodyChildAdded(mutationList, observer) {
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			for (var i = 0; i < addedNodes.length; i++) {
				if (addedNodes[i].classList != null 
					&& addedNodes[i].classList.contains("x-message-box")
					&& addedNodes[i].textContent.includes("Are you sure")
					) {
						console.debug("Got close dialog"); 
						// We've got the close dialog in addedNodes[i]
						closeDialogFocusedObserver.observe(addedNodes[i], {
							attributes: true,
							attributeFilter: [ "class" ], 
							childList: false,
							subtree: false
						});
						manageCloseDialog(addedNodes[i]); 
				}
			}
		}
	});
}

// Observes for changes to the close dialog's visibility status
function onCloseDialogChange(mutationList, observer) {
	mutationList.forEach((mutation) => {
		if (mutation.attributeName == "class" 
			&& !mutation.target.classList.contains("x-hide-offsets")) {
				manageCloseDialog(mutation.target); 
		}
	});
}

// When the close dialog pops up, this function handles whether or not
// it is automatically closed because the try-it contains no unsaved work. 
function manageCloseDialog(closeDialog) {
	console.debug("Manage close dialog"); 
	if (!tabsWithUnsavedWork.includes(activeTab().id)) {
		// If the tab does not have unsaved work, close the dialog & the Try-It.
		var buttons = closeDialog.getElementsByClassName("x-btn");
		for (var w = 0; w < buttons.length; w++) {
			if (buttons[w].textContent.includes("Yes")) {
				buttons[w].click();
				return;
			}
		}
	}
}

closeDialogCreatedObserver.observe(document.body, {
	attributes: false,
	childList: true,
	subtree: false
});

// Checks to see if the user wants to use the classic Auto CCM theme, and implements it if they do.
browser.runtime.sendMessage({
	className: "classicThemeMain"
},
	function (response) {
	console.log("classicThemeMainReceived");
});
