/*
Author: Gabe Classon
This script is injected into Try-Its when they load. It sets up the Auto CCM menu, among various other things.
 */
var browser = browser || chrome; // Ensure compatability between browsers
// Various booleans to define the state of a Try-It/the user's preferences. These are only declarations and default values; they may be changed later.
var hasChanged = false; // Has the document changed? (Is there potentially unsaved work?)
var detectUnsavedChanges = true; // Should unsaved changes be active detected?
var unsavedIndicator = true; // Should a red unsaved work indicator next to the status bar be shown?
var smartClosingDialog = true; // Should warning dialogs only show if a user may have unsaved work? 
var suppressClosingDialogWindow = false; // Should all warning dialogs about the closing of the main tab be suppressed? 
var suppressClosingDialogCourse = false; // Should all warning dialogs about leaving a course for the dashboard be suppressed? 
var suppressClosingDialogTryIt = false; // Should all warning dialogs about the closing of individual Try-Its be suppressed? 
var spellCheck = true; // Should spellcheck be turned on?

/*
url: The root path for this chrome extension
color: A string color representing what color the background should be.
Creates the Auto CCM menu that is at the top of each Try-It with the given background color.
 */
function createMouseMenu(url, color) {
	var imageWidth = 25; // The width of each menu icon
	var totalWidth = (imageWidth + 1) * 6 + 1; // The total width of the menu
	var div = document.createElement("div"); // The primary container
	div.style = "white-space: nowrap; position: absolute; top:0;z-index: 99;margin-right: calc(50% - " + totalWidth / 2 + "px);margin-left: calc(50% - " + totalWidth / 2 + "px);margin-top: 0px;width: auto;height: auto;font-family: sans-serif; color: white; opacity: 1; transition: opacity 600 ms ease 0s; background-color: " + color;
	// The various buttons of the Auto CCM menu, created using the helper function createButton
	var formatButton = createButton(url, "formatButton", "formaticon.svg", "Format (Ctrl+M)", simulateControlM, false);
	div.appendChild(formatButton);
	var deformatButton = createButton(url, "deformatButton", "deformaticon.svg", "Deformat (Ctrl+')", controlApostrophe, false);
	div.appendChild(deformatButton);
	var skipButton = createButton(url, "skipButton", "skipicon.svg", "Skip Selection (Ctrl+,)", null, false);
	div.appendChild(skipButton);
	var returnButton = createButton(url, "returnButton", "returnicon.svg", "Return to Selection (Ctrl+.)", null, false);
	div.appendChild(returnButton);
	var multiformatButton = createButton(url, "multiformatButton", "multiformaticon.svg", "Format All (Ctrl+;)", null, false);
	div.appendChild(multiformatButton);
	div.appendChild(multiformatButton);
	var stopButton = createButton(url, "stopButton", "starticon.svg", "Start Auto CCM (Ctrl+/)", startAutoCCM, true);
	div.appendChild(stopButton);
	// Several buttons should be disabled by default
	skipButton.disabled = true;
	returnButton.disabled = true;
	multiformatButton.disabled = true;
	// The primary stylesheet used by the Auto CCM menu as well as other facets of Auto CCM in the Try-It
	var style = document.createElement("style"); // style for buttons
	style.id = "menuSetupStyle";
	style.textContent =
		`
						.buttonBackground {
							background-color: ${color}; 
						}
						
						.mouseButton {
							border: none; /* Remove borders */
							color: white; /* White text */
							padding:0px;
							text-align: center;
							font-size: 11px; /* Set a font size */
						}
						
						.mouseButton .buttonBackground {
							cursor: pointer; /* Mouse pointer on hover */
						}

							/* Darker background on mouse-over */
						.mouseButton:hover .buttonBackground {
							filter: brightness(90%);
						}
						
						.mouseButton:active .buttonBackground {
							filter: brightness(75%);
						}
						
						.mouseButton:disabled .buttonBackground {
							filter: brightness(75%);
							cursor: not-allowed;
						}
						
						
						.mouseButtonImage {
						width:${imageWidth}px;
						height:${imageWidth}px;
						}
						
						.unsavedDot{
							background: #fd2939;
							 border-radius: 50em;
							 display: inline-block;
							 height: 10px;
							 width: 10px;
							 margin-left: 3px;
						}
						
						.closebtn {
							margin-left: 15px;
							color: white;
							font-weight: bold;
							float: right;
							font-size: 22px;
							line-height: 20px;
							cursor: pointer;
							transition: 0.3s;
						}
						
						.floatingAlertInside {
							font-size: 16px; 
							font-weight:bold;
						}
						
						.floatingAlertContainer {
							width: calc(100% - 2*30px); 
							margin-top: 10px; 
							padding: 30px; 
							font-family: sans-serif; 
							color: white; 
							opacity: 1;
						}
						`;
	if (document.head != null && document.body != null) {
		document.body.insertBefore(div, document.body.children[0])
		document.head.appendChild(style);
	}
}

/*
url: The root url for this extension
id: The id for this button
iconname: The name for this particular icon ex: "starticon.svg"
title: The text that should appear when the button is hovered over
onclickFunction: The function that should be run when the button is clicked
isEnd: Whether this button is the end of the menu (the rightmost button)
return: A DOM object that represents a single button of the Auto CCM menu
 */
function createButton(url, id, iconname, title, onclickFunction, isEnd) {
	var img = document.createElement("img");
	img.src = url + "icons/" + iconname;
	img.className = "mouseButtonImage";
	var buttonA = document.createElement("button");
	buttonA.className = "mouseButton";
	buttonA.id = id;
	buttonA.title = title;
	buttonA.onclick = onclickFunction;
	var background = document.createElement("div");
	background.className = "buttonBackground";
	background.appendChild(img);
	buttonA.appendChild(background);
	if (isEnd) {
		buttonA.style.border = "1px solid white";
	} else {
		buttonA.style.borderLeft = "1px solid white";
		buttonA.style.borderTop = "1px solid white";
		buttonA.style.borderBottom = "1px solid white";
	}
	return buttonA;
}

/*
Simulates the keypress of Ctrl+M
 */
function simulateControlM() {
	var keyDown = new KeyboardEvent("keydown", {
			"key": "m",
			"code": "KeyM",
			"location": 0,
			"ctrlKey": true,
			"shiftKey": false,
			"altKey": false,
			"metaKey": false,
			"repeat": false,
			"isComposing": false,
			"charCode": 109,
			"keyCode": 77,
			"which": 77
		});
	var keyPress = new KeyboardEvent("keypress", {
			"key": "m",
			"code": "KeyM",
			"location": 0,
			"ctrlKey": true,
			"shiftKey": false,
			"altKey": false,
			"metaKey": false,
			"repeat": false,
			"isComposing": false,
			"charCode": 109,
			"keyCode": 77,
			"which": 77
		});
	var keyUp = new KeyboardEvent("keyup", {
			"key": "m",
			"code": "KeyM",
			"location": 0,
			"ctrlKey": true,
			"shiftKey": false,
			"altKey": false,
			"metaKey": false,
			"repeat": false,
			"isComposing": false,
			"charCode": 109,
			"keyCode": 77,
			"which": 77
		});
	console.log(window.getSelection());
	if (window.getSelection != null) {
		var anchorNode = window.getSelection().anchorNode;
		console.log(anchorNode);
		if (anchorNode != null) {
			var dispatchNode = anchorNode.parentElement.closest("li.TextCell");
			dispatchNode.dispatchEvent(keyDown);
			dispatchNode.dispatchEvent(keyPress);
			dispatchNode.dispatchEvent(keyUp);
		}
	}
}

// Deformats selected cells
function controlApostrophe() {
	var selectedNodes = getSelectedNodes(window);
	var previousNode = null;
	for (var i = 0; i < selectedNodes.length; i++) {
		console.log(selectedNodes[i]);
		if (selectedNodes[i].classList != null && selectedNodes[i].classList.contains("Inline")) {
			var newNode = document.createTextNode(selectedNodes[i].textContent);
			selectedNodes[i].replaceWith(newNode);
			selectedNodes[i] = newNode;
		}
		try {
			selectedNodes[i].parentNode.normalize();
		} catch (e) {}
	}
}

// Saves the open Try-It
function controlS() {
	var buttons = document.getElementsByClassName("x-btn-text");
	for (var w = 0; w < buttons.length; w++) {
		if (buttons[w].textContent == "Save") {
			buttons[w].click();
			return;
		}
	}
	console.log("Failed to find save button");
}

// A keyup listener that will deformat math when Ctrl+' is pressed
function onDocumentKeyUp(e) {
	if (e.key == "'" && e.ctrlKey) {
		controlApostrophe();
	} else if (!document.isOpen && e.key == "/" && e.ctrlKey) {
		startAutoCCM();
	}
}

// A keydown listener to prevent Ctrl+S from saving the page
function onDocumentKeyDown(e) {
	if (e.key == "s" && e.ctrlKey) {
		e.preventDefault();
		controlS();
	}
}

// Starts Auto CCM by instructing the background script to inject autoctrlm.js into the Try-It iframe.
function startAutoCCM() {
	browser.runtime.sendMessage({
		className: "injectAutoCtrlM"
	},
		function () {
		console.log("injectAutoCtrlMReceived");
	});
}

/*
A helper function that gives the next node in a line of text
node: A node
return: The next node in a line of text
 */
function nextNode(node) {
	if (node.hasChildNodes()) {
		return node.firstChild;
	} else {
		while (node && !node.nextSibling) {
			node = node.parentNode;
		}
		if (!node) {
			return null;
		}
		return node.nextSibling;
	}
}

/*
range: A range of selection
return: The nodes of that range that constitute the most basic selected notes, with no overlappping or duplicates
 */
function getRangeSelectedNodes(range) {
	var node = range.startContainer;
	var endNode = range.endContainer;

	// Special case for a range that is contained within a single node
	if (node == endNode) {
		return [node];
	}

	var rangeNodes = [];
	while (node && node != endNode) {
		rangeNodes.push(node = nextNode(node));
	}

	node = range.startContainer;
	while (node && node != range.commonAncestorContainer) {
		rangeNodes.unshift(node);
		node = node.parentNode;
	}

	return rangeNodes;
}

/*
win: The window
return: An ordered list of the most basic (i.e. the lowest on the tree) nodes that are selected, with no overlapping or duplicates
 */
function getSelectedNodes(win) {
	if (win.getSelection) {
		var sel = win.getSelection();
		if (!sel.isCollapsed) {
			return getRangeSelectedNodes(sel.getRangeAt(0));
		}
	}
	return [];
}

/*
Updates the changed state to onOff
onOff: The value of hasChanged to setActive
 */
function setChangedState(onOff) {
	if (onOff != hasChanged) { // only change the state if the state has actually changed
		if (unsavedIndicator) { // Update the unsaved indicator to reflect whether there is potentially unsaved work
			if (onOff) {
				document.getElementById("unsavedIcon").style.visibility = "visible";
			} else {
				document.getElementById("unsavedIcon").style.visibility = "hidden";
			}
		}
		if (smartClosingDialog && (!suppressClosingDialogTryIt || !suppressClosingDialogWindow || !suppressClosingDialogCourse)) { 
			// Notify the parent tab as to whether there is potentially unsaved work
			// (Important to stop unnecessary warning dialogs)
			if (onOff) {
				notifyNotebookUnsavedWork();
			} else {
				notifyNotebookSavedWork();
			}
		}
	}
	hasChanged = onOff;
}

// Changes hasChanged to false when a user saves
function saveOnClick() {
	setChangedState(false);
}

// Changes hasChanged to false and stops monitoring for changes when a user hands in a Try-It
function handInOnClick() {
	setChangedState(false);
	unsavedIndicator = false;
	suppressClosingDialogTryIt = true;
	detectUnsavedChanges = false;
	if (!spellCheck) {
		notebookChangeObserver.disconnect();
	}
	bodyChangeObserver.disconnect();
}

// A mutation observer to observe changes in the notebook
var notebookChangeObserver = new MutationObserver(onNotebookChange);
function onNotebookChange(mutationsList, observer) {
	for (var g = 0; g < mutationsList.length; g++) {
		if (mutationsList[g].type == "childList" || mutationsList[g].type == "subtree") { // Added or deleted nodes
			for (var h = 0; h < mutationsList[g].addedNodes.length; h++) {
				console.log(mutationsList[g].addedNodes[h]);
				var classList = mutationsList[g].addedNodes[h].classList;
				if (detectUnsavedChanges && (classList == null || (!classList.contains("CellMenu")))) { // if you're detecting changes and something changes...
					setChangedState(true); // ...set hasChanged to true
				}
				if (spellCheck && classList != null && classList.contains("UserText")) { // if you have enabled spellcheck and a user text cell has just be created...
					var studentTextCells = mutationsList[g].addedNodes[h].getElementsByClassName("Student Text UserText");
					if (studentTextCells != null && studentTextCells.length > 0) {
						studentTextCells[0].spellcheck = "true"; //...enable spellcheck for the user text cell
					}
				}
			}
			if (detectUnsavedChanges) { // Remove nodes also reflect work that must be saved
				for (var h = 0; h < mutationsList[g].removedNodes.length; h++) {
					var classList = mutationsList[g].removedNodes[h].classList;
					if (classList == null || (!classList.contains("CellMenu"))) {
						setChangedState(true);
					}
				}
			}
		} else if (detectUnsavedChanges && mutationsList[g].type == "characterData") {
			setChangedState(true); // Whenever something is typed, hasChanged should be true
		}
		// when a text cell becomes and input cell and vice versa, spellcheck must be changed as appropriate.
		else if (spellCheck && mutationsList[g].type == "attributes" && mutationsList[g].attributeName == "class") {
			if (mutationsList[g].target.spellcheck && mutationsList[g].target.classList.contains("Input")) {
				mutationsList[g].target.spellcheck = false;
			} else if (!mutationsList[g].target.spellcheck && mutationsList[g].target.classList.contains("UserText") && mutationsList[g].target.classList.contains("Student") && mutationsList[g].target.classList.contains("Text")) {
				mutationsList[g].target.spellcheck = true;
			}
		}
	}
}

// Begins observing for notebook changes
function observeNotebookChanges() {
	var noteBookObserveOptions = {
		attributes: false,
		attributeOldValue: false,
		childList: true,
		subtree: true,
		characterData: false
	};
	if (detectUnsavedChanges) { // only observe for changes in the text content of the notebook if the user's options require it
		noteBookObserveOptions.characterData = true;
	}
	if (spellCheck) { // only observe for attributes if spellcheck is one
		noteBookObserveOptions.attributes = true;
		noteBookObserveOptions.attributeFilter = ["class"];
		noteBookObserveOptions.attributeOldValue = true;
	}
	// Observes the notebook
	notebookChangeObserver.observe(document.getElementById("Notebook").getElementsByClassName("Notebook")[0], noteBookObserveOptions);
}

// Observes for when the user hands in a Try-It
var bodyChangeObserver = new MutationObserver(onBodyChange);
function onBodyChange(mutationsList, observer) {
	for (var g = 0; g < mutationsList.length; g++) {
		if (mutationsList[g].type == "childList") {
			for (var h = 0; h < mutationsList[g].addedNodes.length; h++) {
				var classList = mutationsList[g].addedNodes[h].classList;
				if (detectUnsavedChanges && classList.contains("x-window-dlg")) {
					console.log(mutationsList[g].addedNodes[h]);
					var buttons = mutationsList[g].addedNodes[h].getElementsByTagName("button");
					if (buttons != null) {
						for (var j = 0; j < buttons.length; j++) {
							console.log("DIALOGCHECK");
							if (buttons[j].textContent == "Yes") {
								console.log(buttons[j]);
								buttons[j].addEventListener("click", handInOnClick);
							}
						}
					}
				}
			}
		}
	}
}

function observeBodyChanges() {
	console.log("Observe body changes");
	var bodyObserveOptions = {
		attributes: false,
		attributeOldValue: false,
		childList: true,
		subtree: false,
		characterData: false
	};
	// Observes the body
	bodyChangeObserver.observe(document.body, bodyObserveOptions);
}

// Creates the red unsaved indicator that lies next to the save button if there may be unsaved work
function unsavedIndicatorSetup() {
	var unsavedDot = document.createElement("span");
	unsavedDot.className = "unsavedDot";
	unsavedDot.title = "You may have unsaved work.";
	unsavedIcon = document.createElement("td");
	unsavedIcon.appendChild(unsavedDot);
	unsavedIcon.style.visibility = "hidden";
	unsavedIcon.id = "unsavedIcon";
	document.getElementsByClassName("x-toolbar-left-row")[0].appendChild(unsavedIcon);
}

// Notifies the global page that there is unsaved work (see notifyNotebookUnsavedWork.js for more info)
function notifyNotebookUnsavedWork() {
	browser.runtime.sendMessage({
		className: "notifyNotebookUnsavedWork"
	},
		function () {
		console.log("notifyNotebookUnsavedWorkReceived");
	});
}

// Notifies the global page that there is no unsaved work  (see notifyNotebookSavedWork.js for more info)
function notifyNotebookSavedWork() {
	browser.runtime.sendMessage({
		className: "notifyNotebookSavedWork"
	},
		function () {
		console.log("notifyNotebookSavedWorkReceived");
	});
}

// Do various things that require the sync storage
browser.runtime.sendMessage({
	className: "getSyncStorage"
},
	function (response) {
	var items = response.items;
	var url = response.url;
	createMouseMenu(url, items.menubackgroundcolor);
	spellCheck = items.spellCheck;
	unsavedIndicator = items.unsavedIndicator;
	suppressClosingDialogTryIt = items.suppressClosingDialogTryIt;
	suppressClosingDialogWindow = items.suppressClosingDialogWindow;
	suppressClosingDialogCourse = items.suppressClosingDialogCourse;
	smartClosingDialog = items.smartClosingDialog;
	detectUnsavedChanges = unsavedIndicator || (smartClosingDialog && (!suppressClosingDialogTryIt || !suppressClosingDialogWindow || !suppressClosingDialogCourse))

	if (items.spellCheck) {
		// Turn on spellcheck for every existing student cell or text cell in the document
		var allStudents = document.getElementById("Notebook").getElementsByClassName("Notebook")[0].getElementsByClassName("Text Student");
		for (var k = 0; k < allStudents.length; k++) {
			allStudents[k].spellcheck = "true";
		}
		window.allowlist = items.allowlist;
		window.blocklist = items.blocklist;
	}
	// Unsaved changes stuff
	// Find the save button
	var buttons = document.getElementsByClassName("x-btn-text");
	var saveButton;
	for (var k = 0; k < buttons.length; k++) {
		if (buttons[k].textContent.includes("Save")) {
			saveButton = buttons[k];
			break;
		}
	}
	if (saveButton == null || saveButton.offsetParent == null) {
		unsavedIndicator = false;
		suppressClosingDialogTryIt = true;
		detectUnsavedChanges = false;
		hasChanged = false;
	} else {
		if (unsavedIndicator) {
			unsavedIndicatorSetup();
		} else {
			var style = document.createElement("style");
			style.textContent =
				`#unsavedIcon {
						display: none;
					}`;
			document.head.appendChild(style);
		}
		if (detectUnsavedChanges) {
			saveButton.addEventListener("click", saveOnClick);
			setChangedState(false);
		}
		if (detectUnsavedChanges || spellCheck) {
			observeNotebookChanges();
			observeBodyChanges();
		}
	}
});

// Key press observers
window.addEventListener('keyup', onDocumentKeyUp);
window.addEventListener('keydown', onDocumentKeyDown, true);

// Apply the classic theme, if applicable
browser.runtime.sendMessage({
	className: "classicThemeTab"
},
	function (response) {
	console.log("classicThemeTabReceived");
});
