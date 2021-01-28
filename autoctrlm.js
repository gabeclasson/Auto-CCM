/*
Author: Gabe Classon
This script is injected into Try-Its when the "Start" button in the Auto CCM menu is pressed. It initiates the automatic formatting process. 
*/
// user defined blocklist/allowlist
var blockList = window.blocklist;
var allowList = window.allowlist;
var blockListStr = "";
if (blockList != null && blockList.length > 0) {
	// The following regex allows only FULL MATCHES to be blocked. For example, if a user puts "3D" in their blocklist, only the match "3D" will be blocked; "3D[x]" will remain unblocked. The regex also turns the blocklist into a regex expression that will select the entire blocklist.
	blockListStr = "|(^" + blockList.join("$)|(^") + "$)";
}
var allowListStr = "";
if (allowList != null && allowList.length > 0) {
	// The following regex turns the allowlist into a regex expression that selects every entry on the allowlist. 
	allowListStr = "|(" + allowList.join(")|(") + ")";
}
// Building the regex selector: Auto CCM uses a very complicated regular expression to identify math. 
var number = "(\\w*[+-]?((\\d+(\\.\\d+)?)|(\\.\\d+))\\w*(\\.(?!\\s*([A-Za-z]|$)?))?)";
var miscmatch = "((?<!([A-Za-z])|([\"']))\\-?([Aa]\\s*\\.\\s*\\w|\\w\\s*\\.\\s*[Aa]|[△∇∂π]|Pi|[B-H]'?|[J-Z]'?|[b-h]'?|[j-z]'?" + allowListStr + ")(?!([A-Za-z])|([\"])))";
var definitebinaryoperator = "([+*^<>≤≥]|\\\\\\.|(@+)|(&&)|(<=)|(>=)|((?<!(^[\\s\\u200B]?|^[\\s\\u200B]?=))==?))";
var matchifadjacent = "(" + "([\\(\\s]*\\([\\(\\s]*)?[\\w\\d\\(\\)]*([\\(\\s]*\\([\\(\\s]*)?" + ")";
var possibleprefixoperators = "([\\-\\\\\\(])";
var possiblepostfixoperators = "([!\\)])";
var possiblebinaryoperators = "([\\/\\-\\.])";
// regex to identify what should not be selected specifically: dimensions like "3D", "2D", etc.; single letters or numbers surrounded in parentheses
var blockRegExpStr = "(^\\dD$)|(^\\([A-Za-z\\d]\\)$)|(^[A-Za-z\\d]\\)$)|(^\\([A-Za-z\\d]$)" + blockListStr; 
var blockRegExp = RegExp(blockRegExpStr, "g");
// Variables that track
var requestedFormatAll = false; // Has the user pressed Ctrl+; or clicked the "Format All" button? (This is stored because clicking it again will start formatting all math expressions.
var formatAll = false;

// Match is a custom class that is used to process square brackets and curly braces
if (typeof Match !== ' function') {
	window.Match = class {
		constructor(string, start, end, isSquare) {
			this.string = string;
			this.start = start;
			this.end = end;
			this.isSquare = isSquare;
		}
	}
}

//Takes a string and returns a sanitized version of that string, ready for RegExp
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/*
content: A string
length: The desired length of an excerpt.
return: An excerpt of the given string of the desired length
 */
function excerpt(content, length) {
	if (content.length > length) {
		return content.substring(0, length) + "...";
	}
	return content;
}

/*
content: A string or element, representing the content of the floating alert
color: A string representing the background color of the floating alert
displayTime: The number of milliseconds to display the floating alert
fadeTime: The number of milliseconds to fade out of the floating alert
showCloseButton: A boolean representing whether or not to show a close button
This will show a floating alert notifying the user of some piece of information
 */
function floatingAlert(content, color, displayTime, fadeTime, showCloseButton) {
	var div = document.createElement("div"); // div encapsulating the entire alert
	div.className = "floatingAlertContainer";
	var span1 = document.createElement("span"); // first span within the div; contains the close button
	span1.className = "closebtn";
	span1.onclick = function () {
		this.parentElement.style.display = 'none';
		this.parentNode.parentNode.removeChild(this.parentNode);
	}; // onclick will close div and delete it
	if (!showCloseButton) {
		span1.style.display = "none";
	}
	span1.textContent = "×";
	div.appendChild(span1);
	var span2 = document.createElement("span"); // second span within the div: contains the content of the alert
	span2.className = "floatingAlertInside";
	if (typeof content == "string") {
		span2.textContent = content;
	} else {
		span2.appendChild(content);
	}
	div.style = "transition: opacity " + fadeTime + "ms ease 0s; background-color: " + color;
	div.appendChild(span2);
	notesDiv.insertBefore(div, notesDiv.childNodes[0]);
	setTimeout(function () {
		div.style.opacity = 0;
	}, displayTime - fadeTime);
	setTimeout(function () {
		div.style.display = "none";
		div.parentNode.removeChild(div);
	}, displayTime);
}

// This array contains elements describing any instances where invalid square bracket or curly brace syntax may have affected performance.
var invalidBrackets = Array(0);

/*
textContent: A string to examine for matches: this should be a single line of innerStringCell
innerStringCell: The string cell from which textContent was extracted
return: Returns a match iterator that gives all the found instances of math within textContent.
 */
function getMatchesFromTextContent(textContent, innerStringCell) {
	console.log(innerStringCell);
	var counterSquare = 0; // Keeps track of the number square brackets: positive means an excess of open square brackets, negative an excess of closed square brackets
	var counterCurly = 0; // coutnerSquare but for curly braces
	var matches = []; // Represents the various matches of complete delimited strings
	var everNegative = false; // Represents whether any counter goes negative: this is a violation of syntax
	//loop through and gather all the information
	for (var i = 0; i < textContent.length; i++) {
		if (textContent.charAt(i) === "[") {
			counterSquare += 1;
			if (counterSquare === 1 && (matches.length == 0 || matches[matches.length - 1].end >= 0)) {
				matches.push(new Match(null, i, -1, true));
			}
		} else if (textContent.charAt(i) === "]") {
			counterSquare += -1;
			if (counterSquare === 0 && matches[matches.length - 1].isSquare) {
				var thisMatch = matches[matches.length - 1];
				thisMatch.end = i + 1;
				thisMatch.string = textContent.substring(thisMatch.start, thisMatch.end);
			}
		} else if (textContent.charAt(i) === "{") {
			counterCurly += 1;
			if (counterCurly === 1 && (matches.length == 0 || matches[matches.length - 1].end >= 0)) {
				matches.push(new Match(null, i, -1, false));
			}
		} else if (textContent.charAt(i) === "}") {
			counterCurly += -1;
			if (counterCurly === 0 && !matches[matches.length - 1].isSquare) {
				var thisMatch = matches[matches.length - 1];
				thisMatch.end = i + 1;
				thisMatch.string = textContent.substring(thisMatch.start, thisMatch.end);
			}
		}
		if (!everNegative && (counterSquare < 0 || counterCurly < 0)) {
			everNegative = true;
		}
	}
	// If there's a syntax error, add an alert to invalidBrackets so the user can be notified
	if (everNegative || counterCurly != 0 || counterSquare != 0) {
		// Various HTML to notify people
		var u = document.createElement("u");
		u.style = 'cursor: pointer';
		u.onclick = function () {
			document.location.hash = "";
			document.location.hash = innerStringCell.id;
		};
		u.textContent = '"' + excerpt(textContent, 100) + '"';
		var li = document.createElement("li");
		li.style = 'display: list-item;margin-left: 4ch;list-style-type: disc;';
		li.textContent = "at ";
		li.appendChild(u);
		invalidBrackets.push(li);
	}
	var brackets; // brackets will contain RegExp that matches any bracket phrases in the selection. This is kind of ugly, but unfortunately regex doesn't have recursive formulas to make this nice
	if (matches.length < 1) {
		brackets = "";
	} else {
		var added = false;
		brackets = "([\\w\\d']*("; // This expression permits words to precede any bracketed phrase: a function
		for (var i = matches.length - 1; i >= 0; i--) {
			if (matches[i].string != null) {
				brackets += "(" + escapeRegExp(matches[i].string) + ")|";
				added = true;
			}
		}
		if (added) {
			brackets = brackets.substring(0, brackets.length - 1) + "))|";
		} else {
			brackets = "";
		}
	}
	//Building up the regex formulas
	var group1 = "(" + "(" + brackets + number + "|" + miscmatch + ")" + ")";
	var group2 = "(" + group1 + "|" + "(" + group1 + "|" + matchifadjacent + ")\\s*" + definitebinaryoperator + "\\s*(" + group1 + "|" + matchifadjacent + ")" + ")";
	var group3 = "(" + "(" + possibleprefixoperators + "\\s*)*" + group2 + "(\\s*" + possiblepostfixoperators + ")*" + ")";
	var group4 = "(" + group3 + "(\\s*" + "(" + possiblebinaryoperators + "|" + definitebinaryoperator + ")?\\s*" + group3 + ")*" + ")"
		var group5 = group4 + "(\\s*" + group4 + ")*";
	var interest = RegExp(group5, 'g');
	return textContent.matchAll(interest);
}

/*
innerStringCell: The string cell to find math within
return: An iterator that gives all instances of math found within the string cell
 */
function getMatches(innerStringCell) {
	// First break the innerStringCell into lines. This is done to ensure that no match is made across a line break
	var childNodeArray = getChildNodesWithoutChildren(innerStringCell);
	var textContentWithBreaks = "";
	for (var i = 0; i < childNodeArray.length; i++) {
		if (childNodeArray[i].tagName == "BR") {
			textContentWithBreaks += "\n";
		} else {
			textContentWithBreaks += childNodeArray[i].textContent;
		}
	}
	var textContentArray = textContentWithBreaks.split("\n");
	var iteratorArray = Array(textContentArray.length); // contains the various match iterators returned by each line
	for (var i = 0; i < iteratorArray.length; i++) {
		iteratorArray[i] = getMatchesFromTextContent(textContentArray[i], innerStringCell);
	}
	// A super iterator takes smaller iterators and combines them to provide a seamless experience
	var superIterator = {
		"textContents": textContentArray, // an array of the textContent of each line, parallel to the iteratorArray
		"iterators": iteratorArray, // an array of the iterators to pull from
		"previousLength": 0, // the length of the previous lines
		"currentIterator": 0, // the index of the current iterator
		"done": false, // is the superIterator done?
		"next": function () { // gets the next match
			if (this.currentIterator >= this.iterators.length) {
				return undefined;
			}
			var iterator = this.iterators[this.currentIterator];
			if (iterator == null) {
				this.previousLength += this.textContents[this.currentIterator].length;
				this.currentIterator++;
				return this.next();
			}
			var originalNext = this.iterators[this.currentIterator].next();
			if (originalNext.done) {
				this.previousLength += this.textContents[this.currentIterator].length;
				this.currentIterator++;
				return this.next();
			}
			var match = {
				"value": {
					0: originalNext.value[0],
					index: this.previousLength + originalNext.value.index
				}
			}
			return match;
		}
	};
	return superIterator;
}

/*
target: A node
return: All the descendant nodes of target that do not have any children
 */
function getChildNodesWithoutChildren(target) {
	var nodes = target.childNodes;
	if (nodes == undefined || nodes.length === 0 || target.classList.contains("Inline")) {
		return [target];
	}
	var nodesArray = Array.prototype.slice.call(target.childNodes);
	for (var g = nodesArray.length - 1; g >= 0; g--) {
		nodesArray.splice.apply(nodesArray, [g, 1].concat(getChildNodesWithoutChildren(nodesArray[g])));
	}
	return nodesArray;
}

// Gets the inner string cell or text cell of an element
function getInnerStringCellOrText(element) {
	var out = element.getElementsByClassName("StringCell").item(0);
	if (out == null) {
		out = element.getElementsByClassName("Text").item(0);
	}
	return out;
}

// Ctrl+,: selects the next instance of unformatted math without formatting anything
function controlComma() {
	if (!document.isOpen) { // Do not proceed unless Auto CCM is running
		return;
	}
	var bounds = controlMNext();
	if (bounds == undefined) {
		endNow();
		return;
	}
	nodeBounds = determineNodeOffsetBound(bounds);
	if (nodeBounds == undefined) {
		endNow();
		return;
	}
	selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
}

// returns true if it closed Auto CCM; returns false if Auto CCM was already closed
function controlSlash() {
	if (document.isOpen) {
		endNow();
		return true;
	}
	return false;
}

// Ctrl+.: reselects the most recent instance of selected math
function controlPeriod() {
	nodeBounds = determineNodeOffsetBound(currentBounds);
	document.location.hash = "";
	document.location.hash = currentBounds[0].id;
	selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
}

// Ctrl+;: formats all math
function controlSemicolon() {
	if (formatAll || !document.isOpen) { // forbid formatting all if Auto CCM is currently formatting all or if the document is not open
		return;
	}
	if (requestedFormatAll) { // Only allow formatting all if the user has pressed twice
		formatAll = true;
		controlPeriod();
		simulateControlMandSkip();
	} else { // Give the user a message that they have selected "format all"
		floatingAlert("You have entered Ctrl+; or clicked \"Format All.\" Performing this function will format every instance of unformatted math in the document. It is highly recommended that you save before proceeding. You will not have an opportunity to intervene if Auto CCM formats something that should not be formatted. If there is a large quantity of math to be formatted or high strain on the CAS-ILE servers, your browser tab may freeze or crash. To confirm that you would like to execute this function, enter Ctrl+; or click \"Format All\" again. If you would not like to proceed, close this notification.", "rgb(255,127,39)", 60000, 600, true);
		requestedFormatAll = true;
	}
}

// Simulates a Ctrl+M and Ctrl+, keypress
function simulateControlMandSkip() {
	if (!document.isOpen) {
		return;
	}
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
			var dispatchNode = anchorNode.parentElement.closest("li.UserText");
			console.log(dispatchNode);
			dispatchNode.dispatchEvent(keyDown);
			dispatchNode.dispatchEvent(keyPress);
			dispatchNode.dispatchEvent(keyUp);
			controlComma();
		}
	}
}

// A key up listener that listens for all the different keyboard events
function keyUpListener(e) {
	if (!document.isOpen) { // Do not proceed unless Auto CCM is running
		return;
	}
	if (e.key == '/' && e.ctrlKey) { // Ctrl+/ will end Auto CCM
		if (controlSlash()) {
			return;
		}
	}
	// Ctrl+M and Ctrl+, are treated the same by Auto CCM: both advance the highlighted portion to the next instance of unformatted math
	if (e.key === 'm' && e.ctrlKey || e.key == ',' && e.ctrlKey) {
		controlComma();
	}
	// Ctrl+. rehighlights the current selection of unformatted math
	if (e.key == '.' && e.ctrlKey) {
		controlPeriod();
	}
	// Ctrl+; will format everything
	if (e.key == ';' && e.ctrlKey) {
		controlSemicolon();
	}
}

// The current match iterator that is being used
var matches;

// Highlights the next instance of unformatted math: the primary driving function of this operation
function controlMNext() {
	var match;
	var innerStringCell;
	if (!document.isOpen) {
		return;
	}
	do {
		match = matches.next();

	} while (match != undefined && match.value != undefined && match.value[0].match(blockRegExp) != null); // filter through undesirable options
	while (match == undefined || match.value == undefined) {
		if (i === allStudents.length - 1) {
			endNow();
			return;
		}
		i++;
		innerStringCell = getInnerStringCellOrText(allStudents[i]);
		if (innerStringCell == null || innerStringCell.textContent == null || innerStringCell.textContent == "") {
			continue;
		}
		matches = getMatches(innerStringCell);
		do {
			match = matches.next();
		} while (match != undefined && match.value != undefined && match.value[0].match(blockRegExp) != null); // filter through undesirable options
	}
	allStudents[i].normalize(); // Non normalized nodes can prevent formatting from happening. For more info, look up "normalize node".
	innerStringCell = getInnerStringCellOrText(allStudents[i]);
	var matchText = match.value[0];
	var matchLength = matchText.length;
	currentBounds =
		[innerStringCell,
		match.value.index, match.value.index + matchLength];
	return currentBounds;
}

/*
array: An array in the form of [stringCell, firstIndex, lastIndex], where stringCell represents the cell containing the math and firstIndex and lastIndex describe the bounds of the math
return: An array containing the bounds of the math relative to the descendent nodes of the string cell. This is necessary to select the text for the user. The form of the output is [startElement, startOffset, endElement, endOffset]
 */
function determineNodeOffsetBound(array) {
	if (!document.isOpen) {
		return;
	}
	var stringCell = array[0]; // The string cell containing the selection
	var childNodeArray = getChildNodesWithoutChildren(stringCell); // All the childless descendant nodes of the stringCell
	var currentLength = 0; // The current length we have processed
	var start = array[1]; // The starting index of the selection within the stringCell
	var startElement = undefined; // The node that the start of the selection lies in
	var startOffset = 0; // The starting index of the selection relative to startElement
	var end = array[2]; // see above
	var endElement = undefined; // see above
	var endOffset = 0; // see above
	// Loop through the childless descendant nodes and determine where the node offset bounds are
	for (j = 0; j < childNodeArray.length; j++) {
		// Add the length of the node to currentLength
		if (childNodeArray[j].textContent != undefined) {
			currentLength += childNodeArray[j].textContent.length;
		}
		if (startElement === undefined && start < currentLength) {
			startElement = childNodeArray[j];
			startOffset = childNodeArray[j].textContent.length + start - currentLength;
			if (startElement.classList != undefined &&
				startElement.classList.contains("Inline"))
				return determineNodeOffsetBound(controlMNext());
		}
		if (startElement != undefined && childNodeArray[j].classList != undefined && childNodeArray[j].classList.contains("Inline")) {
			return determineNodeOffsetBound(controlMNext());
		}
		if (endElement === undefined && end < currentLength + 1) {
			endElement = childNodeArray[j];
			endOffset = childNodeArray[j].textContent.length + end - currentLength;
			document.location.hash = "";
			document.location.hash = stringCell.id;
			return [startElement, startOffset, endElement, endOffset];
		}
	}
	return undefined;
}

/*
Selects text given nodes and node offsets, based on the output from determineNodeOffsetBound
 */
function selectText(startElement, startOffset, endElement, endOffset) {
	if (!document.isOpen) {
		return;
	}
	if (window.getSelection && document.createRange) {
		sel = window.getSelection();
		range = document.createRange();
		range.setStart(startElement, startOffset);
		range.setEnd(endElement, endOffset);
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.body.createTextRange) {
		range = document.body.createTextRange();
		range.setStart(startElement, startOffset);
		range.setEnd(endElement, endOffset);
		range.select();
	}
	if (formatAll) {
		setTimeout(simulateControlMandSkip, 333);
	}
}

/*
Ends the current session of Auto CCM
 */
function endNow() {
	if (document.isOpen) {
		window.removeEventListener('keyup', document.previousListener);
		if (!hasNotifiedOn) {
			floatingAlert("Auto CCM has nothing to format.", "#2196F3", 2000, 600, false);
		} else {
			console.log("Terminating Auto CCM");
			endMenu();
			formatAll = false;
			requestedFormatAll = false;
			floatingAlert("Auto CCM has ended.", "#2196F3", 2000, 600, false);
			if (invalidBrackets.length > 0) {
				var textElement = document.createElement("text");
				var br = document.createElement("br");
				var ul = document.createElement("ul");
				for (var q = 0; q < invalidBrackets.length; q++) {
					ul.appendChild(invalidBrackets[q]);
				}
				textElement.textContent = "Invalid curly brace/square bracket syntax may have affected performance: ";
				textElement.appendChild(br);
				textElement.appendChild(ul);
				floatingAlert(textElement, "#f44336", 30000, 600, true);
			}
		}
		var scripts = document.querySelectorAll("script.AutoCCM");
		for (var j = 0; j < scripts.length; j++) {
			scripts[j].parentElement.removeChild(scripts[j]);
		}
	}
	document.isOpen = false;
}

// Recall that the menu is set up in menusetup.js; furthermore, Auto CCM can be started and stopped multiple times, and all of these instances of "autoctrln.js" will use the same Auto CCM menu. Therefore, every time autoctrlm.js is run, the buttons on the menu must be assigned to actions for that specific instance of autoctrlm.js.
var originalMenuSettings = new Object();
function startMenu() {
	var formatButton = document.getElementById("formatButton");
	originalMenuSettings.formatButtonOnClick = formatButton.onclick;
	formatButton.onclick = simulateControlMandSkip;
	var skipButton = document.getElementById("skipButton");
	var returnButton = document.getElementById("returnButton");
	var multiformatButton = document.getElementById("multiformatButton");
	var stopButton = document.getElementById("stopButton");
	skipButton.onclick = controlComma;
	returnButton.onclick = controlPeriod;
	multiformatButton.onclick = controlSemicolon;
	skipButton.disabled = false;
	returnButton.disabled = false;
	multiformatButton.disabled = false;
	var stopButtonImage = stopButton.getElementsByTagName("img")[0];
	originalMenuSettings.stopButtonImage = stopButtonImage.src;
	stopButtonImage.src = stopButtonImage.src.replace("start", "stop");
	originalMenuSettings.stopButtonOnClick = stopButton.onclick;
	stopButton.onclick = controlSlash;
	originalMenuSettings.stopButtonTitle = stopButton.title;
	stopButton.title = "Terminate Auto CCM (Ctrl+/)";
}

// Disconnects this instance of autoctrlm.js from the Auto CCM menu
function endMenu() {
	if (originalMenuSettings.formatButtonOnClick != null) {
		var formatButton = document.getElementById("formatButton");
		formatButton.onclick = originalMenuSettings.formatButtonOnClick;
	}
	var skipButton = document.getElementById("skipButton");
	var returnButton = document.getElementById("returnButton");
	var multiformatButton = document.getElementById("multiformatButton");
	var stopButton = document.getElementById("stopButton");
	skipButton.onclick = null;
	returnButton.onclick = null;
	multiformatButton.onclick = null;
	skipButton.disabled = true;
	returnButton.disabled = true;
	multiformatButton.disabled = true;
	var stopButtonImage = stopButton.getElementsByTagName("img")[0];
	stopButtonImage.src = originalMenuSettings.stopButtonImage;
	stopButton.onclick = originalMenuSettings.stopButtonOnClick;
	stopButton.title = originalMenuSettings.stopButtonTitle;
}

var i = 0; // An index representing which text cell we are on
var hasNotifiedOn = false; // Representing whether or not the user has been notified that Auto CCM is starting. If this is false and Auto CCM ends, then the user will be notified that there is nothing to format.
// create a notesDiv: a section where floating alerts can be given to the user
var notesDiv = document.getElementById("notesDiv");
var matches;
if (notesDiv == undefined) {
	notesDiv = document.createElement("div");
	notesDiv.id = "notesDiv";
	document.body.insertBefore(notesDiv, document.body.childNodes[0]);
}
notesDiv.style = "position: fixed;z-index: 99;margin-right: 20%;margin-left: 20%;margin-top: 50px;width:60%";
var isUsurping = false; // isUsurping: is there already an instance of AutoCCM open?
if (document.isOpen === true) {
	isUsurping = true;
}
document.isOpen = true; // isOpen: A variable representing whether "things" are allowed to run. This is set to false by endNow();
var allStudents = document.getElementById("Notebook").getElementsByClassName("Notebook")[0].getElementsByClassName("Text Student"); // Every student cell, or text cell, in the document
if (allStudents.length === 0) {
	endNow();
} else {
	// Get matches for math in the first string cell
	matches =
		getMatches(getInnerStringCellOrText(allStudents[i]));
	currentBounds = undefined;
	// Each frame has its own listener. Listeners cannot be doubled up, so we make sure that there is only one listener at a time
	if (document.previousListener != undefined) {
		window.removeEventListener('keyup', document.previousListener);
	}
	window.addEventListener('keyup', keyUpListener);
	document.previousListener = keyUpListener;
	// Get the bounds of the next selection
	bounds = controlMNext();
	if (bounds == undefined) {
		endNow();
	}
	// Get the node offset bounds of the next selection
	nodeBounds = determineNodeOffsetBound(bounds);
	if (nodeBounds == undefined) {
		endNow();
	} else {
		if (isUsurping) {
			floatingAlert("Auto CCM is usurping another session of itself.", "rgb(255,127,39)", 2000, 600, false);
		} else {
			floatingAlert("Auto CCM is starting.", "#2196F3", 2000, 600, false);
		}
		hasNotifiedOn = true;
		startMenu();
		// Make sure that all cells are expanded and visible.
		var tryItMenuButton = document.getElementsByClassName("x-btn-arrow")[0].click()
		setTimeout(function () {
			var menuItems = document.getElementsByClassName("x-menu-item");
			console.log(menuItems);
			var k;
			for (k = 0; k < menuItems.length; k++) {
				if (menuItems[k].textContent.match(/Expand/i) != null) {
					break;
				}
			}
			console.log("Expanded groups");
			if (menuItems[k] != null) {
				menuItems[k].click();
			}
			else {
				tryItMenuButton.click(); // close menu if cannot select button
			}
			// Select the first instance of unformatted math: subsequent instances of unformatted math can be brought about by using Ctrl+M or Ctrl+,
			selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
		}, 100);
	}
}
