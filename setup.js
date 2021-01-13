var chrome;
var browser = browser || chrome;
// These mutation observers exist to deliver a final payload to each iFrame: code that allow Ctrl+' to deformat math.
var bodyChangeObserver = new MutationObserver(onBodyChange); // Observes the body of the page
var studentPanelChangeObserver = new MutationObserver(onStudentPanelChange); // Observes the student panel of the page to see when a course is opened
var tryItUpdatedObserver = new MutationObserver(onTryItUpdated); // Observes the try-it section of the page to see when a try-it is opened
var tabAddedObserver = new MutationObserver(onTabAdded);

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
	studentPanelChangeObserver.observe(studentPanel, {
		attributes: false,
		childList: true,
		subtree: false
	});
	bodyChangeObserver.disconnect();
}

function onStudentPanelChange(mutationList, observer) {
	console.log("Panel updated");
	mutationList.forEach((mutation) => {
		if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
			var addedNodes = mutation.addedNodes;
			console.log(addedNodes);
			for (var i = 0; i < addedNodes.length; i++) {
				if (addedNodes[i].id.includes("coursepanel")) {
					var tabpanel = addedNodes[i].querySelectorAll("[id^=tabpanel][id$=body]")[0];
					tryItUpdatedObserver.observe(tabpanel, {
						attributes: false,
						childList: true,
						subtree: false
					});
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

function injectFrame(frame1) {
	browser.runtime.sendMessage({
		className: "injectMenuSetup",
		frameUrl: frame1.src
	},
		function () {
		console.log("injectMenuSetupReceived");
	});
}

function mockButtonSetup(closeButton) {
	var mockButton = document.createElement("span");
	mockButton.className = "x-tab-close-btn";
	mockButton.id = "mockButton";
	mockButton.tabindex = "0";
	mockButton.style.visibility = "hidden";
	closeButton.parentElement.appendChild(mockButton);
	mockButton.addEventListener("click", function (e) {
		if (confirm("Are you sure you want to close this Try-It? You may have unsaved work. Click 'OK' to leave; click 'Cancel' to return to the Try-It.")) {
			mockButton.style.visibility = "hidden";
			closeButton.click();
		}
	});
}

// Deals with Ctrl+S keys pressed outside of Try-It windows
function onDocumentKeyDown(e) {
	if (e.key == 's' && e.ctrlKey) {
		e.preventDefault();
		var currentFrame = document.querySelector("[id^='popuptabpanel']:not(.x-hide-offsets):not([id*='body'])").querySelector("iframe");
		console.log(currentFrame);
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
// remove this later
window.addEventListener("beforeunload", function (e) {
	var frames = document.getElementsByTagName("iframe");
	for (var o = 0; o < frames.length; o++) {
		if (frames[o].contentWindow.hasChanged === true) {
			event.returnValue = "string";
		}
	}
});
