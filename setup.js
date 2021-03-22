/*
Author: Gabe Classon
This script is run on the CAS-ILE tab immediately as it loads. Its primary purpose is to detect when Try-Its are opened so that they can be injected with menusetup.js.
 */
var browser = browser || chrome; // To ensure compatability between Firefox and Chrome
// These mutation observers exist to deliver a final payload to each iFrame: code that allow Ctrl+' to deformat math.
var bodyChangeObserver = new MutationObserver(onBodyChange); // Observes the body of the page
var studentPanelChangeObserver = new MutationObserver(onStudentPanelChange); // Observes the student panel of the page to see when a course is opened
var tryItUpdatedObserver = new MutationObserver(onTryItUpdated); // Observes the try-it section of the page to see when a try-it is opened
var tabAddedObserver = new MutationObserver(onTabAdded);
var defaultCloseDialogCreationObserver = new MutationObserver(createDefaultCloseDialog);
var defaultCloseDialogUpdateObserver = new MutationObserver(updateDefaultCloseDialog);

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
					// Observes for new tabs in the tab bar
					var tabBar = addedNodes[i].querySelectorAll("[id^=tabbar][id$=targetEl]")[0];
					tabAddedObserver.observe(tabBar, {
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

// The tab added observer waits for tabs to be added to the tab bar (this occurs whenever a Try-It is opened). Then, it adds a mockbutton for each one. See mockbuttonenable.js for more info.
function onTabAdded(mutationList, observer) {
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			console.log("Tab added");
			for (var i = 0; i < addedNodes.length; i++) {
				var closeButton = addedNodes[0].getElementsByClassName("x-tab-close-btn")[0];
				mockButtonSetup(closeButton);
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

/*
closeButton: the close button for a particular Try-It
Creates and sets up the mock button for a particular Try-It (See mockbuttonenable.js for more info)
 */
function mockButtonSetup(closeButton) {
	var mockButton = document.createElement("span");
	mockButton.className = "x-tab-close-btn mockButton";
	mockButton.id = "mockButton";
	mockButton.tabindex = "0";
	mockButton.style.visibility = "hidden";
	closeButton.parentElement.appendChild(mockButton);
	mockButton.addEventListener("click", function (e) {
		if (confirm("Are you sure you want to close this Try-It? You may have unsaved work. Click 'OK' to leave; click 'Cancel' to return to the Try-It.")) {
			mockButton.style.visibility = "hidden";
			closeButton.click();
			// The following code will click "close" on a default close dialog (if it exists).
			/*
			var xWindowClosableList = document.querySelectorAll(".x-window-closable");
			var defaultCloseDialog;
			for (var k = 0; k < xWindowClosableList.length; k++) {
			if (xWindowClosableList[k].textContent.includes("Are you sure")) {
			defaultCloseDialog = xWindowClosableList[k];
			break;
			}
			}
			if (defaultCloseDialog != null) {
			var buttonList = defaultCloseDialog.querySelectorAll("a[role = button]");
			for (var d = 0; d < buttonList.length; d++) {
			if (buttonList[d].textContent.includes("Yes")) {
			buttonList[d].click();
			break;
			}
			}
			}
			 */
		}
	});
	// Add a stylesheet for the mockbutton
	var style = document.createElement("style");
	style.textContent =
		`
	.mockButton:hover {
		opacity: 1;
	}
	
	.mockButton {
		opacity: 0;
	}
	`;
	style.id = "mockButtonStyle";
	document.head.appendChild(style);
}

browser.runtime.sendMessage({
	className: "getSyncStorage"
},
	function (response) {
	var items = response.items;
	var warningDialog = items.warningDialog;
	if (warningDialog) {
		defaultCloseDialogCreationObserver.observe(document.body, {
			attributes: false,
			childList: true,
			subtree: false
		});
	}
});

/*
Watches for the creation of the defualt close dialog window
 */
function createDefaultCloseDialog(mutationList, observer) {
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			console.log(addedNodes);
			for (var i = 0; i < addedNodes.length; i++) {
				if (addedNodes[i].classList.contains("x-window-closable") && addedNodes[i].textContent.includes("Are you sure")) {
					addedNodes[i].visibility = "hidden";
					defaultCloseDialogUpdateObserver.observe(addedNodes[i], {
						attributes: true,
						attributeFilter: ["class"],
						attributeOldValue: true
					});
					clickYesOnDialog(addedNodes[i]);
					observer.disconnect();
					return;
				}
			}
		}
	});
}

/*
Confirms the default close dialog built into CAS-ILE, closing a given Try-It.
 */
function updateDefaultCloseDialog(mutationList, observer) {
	for (var g = 0; g < mutationList.length; g++) {
		if (mutationList[g].type == "attributes" && mutationList[g].attributeName == "class") {
			if (!mutationList[g].target.classList.contains("x-hide-offsets")) {
				clickYesOnDialog(mutationList[g].target);
			}
		}
	}
}

/*
dialog: A dialog element with a "yes" button to confirm (in the form of a DOM a element
Confirms the dialog by clicking "Yes"
 */
function clickYesOnDialog(dialog) {
	var buttonList = dialog.querySelectorAll("a[role = button]");
	for (var d = 0; d < buttonList.length; d++) {
		if (buttonList[d].textContent.includes("Yes")) {
			buttonList[d].click();
			break;
		}
	}
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

// Checks to see if the user wants to use the classic Auto CCM theme, and implements it if they do.
browser.runtime.sendMessage({
	className: "classicThemeMain"
},
	function (response) {
	console.log("classicThemeMainReceived");
});
