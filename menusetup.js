var browser = browser || chrome;
var hasChanged = false;
var detectUnsavedChanges = true;
var unsavedIndicator = true;
var warningDialog = true;
var spellCheck = true;

function createMouseMenu(url, color) {
	var imageWidth = 25;
	var totalWidth = (imageWidth + 1) * 6 + 1;
	var div = document.createElement("div");
	div.style = "white-space: nowrap; position: absolute; top:0;z-index: 99;margin-right: calc(50% - " + totalWidth / 2 + "px);margin-left: calc(50% - " + totalWidth / 2 + "px);margin-top: 0px;width: auto;height: auto;font-family: sans-serif; color: white; opacity: 1; transition: opacity 600 ms ease 0s; background-color: " + color;
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
	skipButton.disabled = true;
	returnButton.disabled = true;
	multiformatButton.disabled = true;
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
							background: #ed2939;
							 border-radius: 50em;
							 display: inline-block;
							 height: 8px;
							 width: 8px;
							 margin-right: 3px;
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

// Saves the Try-It
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

// The final payload: a keyup listener that will deformat math with Ctrl+'
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

function startAutoCCM() {
	browser.runtime.sendMessage({
		className: "injectAutoCtrlM"
	},
		function () {
		console.log("injectAutoCtrlMReceived");
	});
	/*
	var script = document.createElement("script");
	script.src = url + "autoctrlm.js";
	script.className = "AutoCCM";
	document.body.appendChild(script);
	 */
}

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

function getRangeSelectedNodes(range) {
	var node = range.startContainer;
	var endNode = range.endContainer;

	// Special case for a range that is contained within a single node
	if (node == endNode) {
		return [node];
	}

	// Iterate nodes until we hit the end container
	var rangeNodes = [];
	while (node && node != endNode) {
		rangeNodes.push(node = nextNode(node));
	}

	// Add partially selected nodes at the start of the range
	node = range.startContainer;
	while (node && node != range.commonAncestorContainer) {
		rangeNodes.unshift(node);
		node = node.parentNode;
	}

	return rangeNodes;
}

function getSelectedNodes(win) {
	if (win.getSelection) {
		var sel = win.getSelection();
		if (!sel.isCollapsed) {
			return getRangeSelectedNodes(sel.getRangeAt(0));
		}
	}
	return [];
}

function setChangedState(onOff) {
	if (onOff != hasChanged) {
		if (unsavedIndicator) {
			if (onOff) {
				document.getElementById("unsavedIcon").style.visibility = "visible";
			} else {
				document.getElementById("unsavedIcon").style.visibility = "hidden";
			}
		}
		if (warningDialog) {
			if (onOff) {
				mockButtonEnable();
			} else {
				mockButtonDisable();
			}
		}
	}
	hasChanged = onOff;
}

function saveOnClick() {
	setChangedState(false);
}

function handInOnClick() {
	setChangedState(false);
	unsavedIndicator = false;
	warningDialog = false;
	detectUnsavedChanges = false;
	if (!spellCheck) {
		notebookChangeObserver.disconnect();
	}
	bodyChangeObserver.disconnect();
}

var notebookChangeObserver = new MutationObserver(onNotebookChange);
function onNotebookChange(mutationsList, observer) {
	for (var g = 0; g < mutationsList.length; g++) {
		if (mutationsList[g].type == "childList" || mutationsList[g].type == "subtree") {
			for (var h = 0; h < mutationsList[g].addedNodes.length; h++) {
				console.log(mutationsList[g].addedNodes[h]);
				var classList = mutationsList[g].addedNodes[h].classList;
				if (detectUnsavedChanges && (classList == null || (!classList.contains("CellMenu")))) {
					setChangedState(true);
				}
				if (spellCheck && classList != null && classList.contains("UserText")) {
					var studentTextCells = mutationsList[g].addedNodes[h].getElementsByClassName("Student Text UserText");
					if (studentTextCells != null && studentTextCells.length > 0) {
						studentTextCells[0].spellcheck = "true";
					}
				}
			}
			if (detectUnsavedChanges) {
				for (var h = 0; h < mutationsList[g].removedNodes.length; h++) {
					var classList = mutationsList[g].removedNodes[h].classList;
					if (classList == null || (!classList.contains("CellMenu"))) {
						setChangedState(true);
					}
				}
			}
		} else if (detectUnsavedChanges && mutationsList[g].type == "characterData") {
			setChangedState(true);
		}
		else if (spellCheck && mutationsList[g].type == "attributes" && mutationsList[g].attributeName == "class") {
			if (mutationsList[g].target.spellcheck && mutationsList[g].target.classList.contains("Input")) {
				mutationsList[g].target.spellcheck = false;
			}
			else if (!mutationsList[g].target.spellcheck && mutationsList[g].target.classList.contains("UserText") && mutationsList[g].target.classList.contains("Student") && mutationsList[g].target.classList.contains("Text")) {
				mutationsList[g].target.spellcheck = true;
			}
		}
	}
}

function observeNotebookChanges() {
	var noteBookObserveOptions = {
		attributes: false,
		attributeOldValue: false,
		childList: true,
		subtree: true,
		characterData: false
	};
	if (unsavedIndicator || warningDialog) {
		noteBookObserveOptions.characterData = true;
	}
	if (spellCheck) {
		noteBookObserveOptions.attributes = true;
		noteBookObserveOptions.attributeFilter = ["class"];
		noteBookObserveOptions.attributeOldValue = true;
	}
	 // Observes the notebook
	notebookChangeObserver.observe(document.getElementById("Notebook").getElementsByClassName("Notebook")[0], noteBookObserveOptions);
}

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

function unsavedIndicatorSetup() {
	var unsavedDot = document.createElement("span");
	unsavedDot.className = "unsavedDot";
	unsavedDot.title = "You may have unsaved work.";
	unsavedIcon = document.createElement("td");
	unsavedIcon.appendChild(unsavedDot);
	unsavedIcon.style.visibility = "hidden";
	unsavedIcon.id = "unsavedIcon";
	document.getElementsByClassName("x-toolbar-right-row")[0].prepend(unsavedIcon);
}

function warningDialogSetup() {
	window.addEventListener("beforeunload", function (e) {
		if (hasChanged === true) {
			event.returnValue = "string";
		}
	});
}

function mockButtonEnable() {
	browser.runtime.sendMessage({
		className: "mockButtonEnable"
	},
		function () {
		console.log("mockButtonEnableReceived");
	});
}

function mockButtonDisable() {
	browser.runtime.sendMessage({
		className: "mockButtonDisable"
	},
		function () {
		console.log("mockButtonDisableReceived");
	});
}

// Do various things that required the sync storage
browser.runtime.sendMessage({
	className: "getSyncStorage"
},
	function (response) {
	var items = response.items;
	var url = response.url;
	createMouseMenu(url, items.menubackgroundcolor);
	spellCheck = items.spellCheck;
	unsavedIndicator = items.unsavedIndicator;
	warningDialog = items.warningDialog;
	detectUnsavedChanges = unsavedIndicator || warningDialog;
	if (items.spellCheck) {
		var allStudents = document.getElementById("Notebook").getElementsByClassName("Notebook")[0].getElementsByClassName("Text Student"); // Every student cell, or text cell, in the document
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
		warningDialog = false;
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
		if (warningDialog) {
			warningDialogSetup();
		}
		if (detectUnsavedChanges) {
			saveButton.addEventListener("click", saveOnClick);
			setChangedState(false);
		}
		if (unsavedIndicator || warningDialog || spellCheck) {
			observeNotebookChanges();
			observeBodyChanges();
		}
	}
});

window.addEventListener('keyup', onDocumentKeyUp);
window.addEventListener('keydown', onDocumentKeyDown, true);
