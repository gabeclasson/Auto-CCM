function createMouseMenu(url) {
	var imageWidth = 25;
	var totalWidth = (imageWidth + 1) * 6 + 1;
	var div = document.createElement("div");
	div.style = "white-space: nowrap; position: absolute; top:0;z-index: 99;margin-right: calc(50% - " + totalWidth / 2 + "px);margin-left: calc(50% - " + totalWidth / 2 + "px);margin-top: 0px;width: auto;height: auto;font-family: sans-serif; color: white; opacity: 1; transition: opacity 600 ms ease 0s; background-color: DodgerBlue";
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
	var stopButton = createButton(url, "stopButton", "starticon.svg", "Start Auto CCM (Ctrl+/)", startAutoCCM, true);
	div.appendChild(stopButton);
	skipButton.disabled = true;
	returnButton.disabled = true;
	multiformatButton.disabled = true;
	var style = document.createElement("style"); // style for buttons
	style.textContent =
		`.mouseButton {
							background-color: DodgerBlue; /* Blue background */
							border: none; /* Remove borders */
							color: white; /* White text */
							padding:0px;
							text-align: center;
							font-size: 11px; /* Set a font size */
							cursor: pointer; /* Mouse pointer on hover */
						}

							/* Darker background on mouse-over */
						.mouseButton:hover {
							background-color: RoyalBlue;
						}
						
						.mouseButton:hover img {
							filter: brightness(75%);
						}
						
						.mouseButton:disabled {
							background-color: RoyalBlue;
						}
						
						.mouseButton:disabled img {
							filter: brightness(75%);
						}
						
						.mouseButtonImage {
							width:` + imageWidth + `px;
							height:` + imageWidth + `px;
						}
						`;
	if (document.body != null) {
		document.body.insertBefore(div, document.body.childNodes[0]);
		document.body.insertBefore(style, div);
	}
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
			console.log(dispatchNode);
			dispatchNode.dispatchEvent(keyDown);
			dispatchNode.dispatchEvent(keyPress);
			dispatchNode.dispatchEvent(keyUp);
		}
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
	buttonA.appendChild(img);
	if (isEnd) {
		buttonA.style.border = "1px solid white";
	} else {
		buttonA.style.borderLeft = "1px solid white";
		buttonA.style.borderTop = "1px solid white";
		buttonA.style.borderBottom = "1px solid white";
	}
	return buttonA;
}

function controlApostrophe() {
	var selectedNodes = getSelectedNodes(window);
	for (var i = 0; i < selectedNodes.length; i++) {
		if (selectedNodes[i].classList != null && selectedNodes[i].classList.contains("Inline")) {
			selectedNodes[i].replaceWith(selectedNodes[i].textContent);
		}
	}
}

// The final payload: a keyup listener that will deformat math with Ctrl+'
function onDocumentKeyUp(e) {
	if (e.key == "'" && e.ctrlKey) {
		controlApostrophe();
	} else if (!document.isOpen && e.key == "/" && e.ctrlKey) {
		startAutoCCM();
	}
}

function startAutoCCM() {
	var script = document.createElement("script");
	script.src = url + "autoctrlm.js";
	script.className = "AutoCCM";
	document.body.appendChild(script);
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

var src = document.currentScript.getAttribute('src');
var srcSplit = src.split("/");
srcSplit[srcSplit.length - 1] = "";
var url = srcSplit.join("/");
createMouseMenu(url);
window.addEventListener('keyup', onDocumentKeyUp);
