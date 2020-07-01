
/* regex to identify what should be selected */
number = "(-?\\d+(\\d+)*(\\.\\d+)?)";
miscmatch = "((?<![A-Za-z]|['\"\\-])([△∇∂π]|Pi|[B-H]|[J-Z]|[b-h]|[j-z])(?![A-Za-z]|['\"\\-]))";
definitebinaryoperator = "([+*^=<>≤≥]|\\\\\\.|@@|&&|<=|>=)";
matchifadjacent = "(" + "[\\w\\d\\)\\(]*" + ")";
possibleprefixoperators = "([\\(\\-\\\\])";
possiblepostfixoperators = "([\\)])";
possiblebinaryoperators = "([\\/\\-])";
if(typeof Match !==' function'){ 
	window.Match = class {
		constructor(string, start, end, isSquare){
			this.string = string;
			this.start = start;
			this.end = end;
		this.isSquare = isSquare;
		}
	}
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMatches(textContent){
	var counterSquare = 0;
	var counterCurly = 0;
	var matches = [];
	for (var i = 0; i < textContent.length; i++){
		if (textContent.charAt(i) === "["){
			counterSquare += 1;
			if (counterSquare === 1 && (matches.length == 0 || matches[matches.length - 1].end >= 0)){
				matches.push(new Match(null, i, -1,true));
			}
		}
		else if (textContent.charAt(i) === "]"){
			counterSquare += -1;
			if (counterSquare === 0 && matches[matches.length - 1].isSquare){
				var thisMatch = matches[matches.length - 1];
				thisMatch.end = i + 1;
				thisMatch.string = textContent.substring(thisMatch.start,thisMatch.end);
			}
		}
		else if (textContent.charAt(i) === "{"){
			counterCurly += 1;
	  if (counterCurly === 1 && (matches.length == 0 || matches[matches.length - 1].end >= 0)){
				matches.push(new Match(null, i, -1,false));
			}
		}
		else if (textContent.charAt(i) === "}"){
			counterCurly += -1;
	  if (counterCurly === 0 && !matches[matches.length - 1].isSquare){
				var thisMatch = matches[matches.length - 1];
				thisMatch.end = i + 1;
				thisMatch.string = textContent.substring(thisMatch.start,thisMatch.end);
			}
		}
	}
	var brackets; 
	if (matches.length < 1){
		brackets = "";
	}
	else {
		brackets = "(\\w*(";
		for (var i = matches.length - 1; i >= 0; i--){
			brackets += "(" + escapeRegExp(matches[i].string) + ")|";
		}
		brackets = brackets.substring(0, brackets.length - 1) + "))|";
	}
	group1 = "(" + brackets + number + "|" + miscmatch + ")";
	group2 = "(" + group1 + "|" + "(" + group1 + "|" + matchifadjacent + ")\\s*" + definitebinaryoperator + "\\s*(" + group1 + "|" + matchifadjacent + ")" + ")";
	group3 = "(" + "(" + "(" + possibleprefixoperators + "|(" + matchifadjacent + "|" + group2 + ")" + possiblebinaryoperators + ")\\s*" + ")*" + group2 + "(\\s*(" + possiblebinaryoperators + "(" + matchifadjacent + "|" + group2 + "))|" + possiblepostfixoperators + ")*" + ")";
	group4 = group3 + "(\\s*" + group3 + ")*"; 
	interest = RegExp(group4, 'g');
	return textContent.matchAll(interest);
}
function controlMNext() {
	if (!isOpen){
		return;
	}
	match = matches.next();
	while (match.value == undefined) {
		if (i === allStudents.length - 1){
			endNow();
			return;
		}
		i++;
		innerStringCell =
			allStudents[i].getElementsByClassName("StringCell").item(0);
		doc.location.hash = innerStringCell.id;
		matches = getMatches(innerStringCell.textContent);
		match = matches.next();
	}
	currentBounds =
		[allStudents[i].getElementsByClassName("StringCell").item(0),
		match.value.index, match.value.index + match.value[0].length];
	return currentBounds;
}

/**
Given an array containing a string cell and the bounds of the desired selection, it will determine the bounds relative to a node
**/
function determineNodeOffsetBound(array) {
	if (!isOpen){
		return;
	}
	console.log(array);
	stringCell = array[0];
	childNodeArray = stringCell.childNodes;
	currentLength = 0;
	start = array[1];
	startElement = undefined;
	startOffset = 0;
	end = array[2];
	endElement = undefined;
	endOffset = 0;
	console.log(childNodeArray);
	for (j = 0; j < childNodeArray.length; j++) {
		console.log('a');
		if (childNodeArray[j].textContent != undefined){
			currentLength += childNodeArray[j].textContent.length;
		}
		if (startElement === undefined && start < currentLength) {
			startElement = childNodeArray[j];
			startOffset = childNodeArray[j].textContent.length + start - currentLength;
			if (startElement.classList != undefined &&
				startElement.classList.contains("Inline"))
				return determineNodeOffsetBound(controlMNext());
		}
		if (endElement === undefined && end < currentLength + 1) {
			endElement = childNodeArray[j];
			endOffset = childNodeArray[j].textContent.length + end - currentLength;
			if (endElement.classList != undefined &&
				endElement.classList.contains("Inline"))
				return determineNodeOffsetBound(controlMNext());
			return [startElement, startOffset, endElement, endOffset];
		}
	}
	return undefined;
}

function selectText(startElement, startOffset, endElement, endOffset) {
	if (!isOpen){
		return;
	}
	win = frame.contentWindow;
	var doc = win.document,
	sel,
	range;
	if (win.getSelection && doc.createRange) {
		sel = win.getSelection();
		range = doc.createRange();
		range.setStart(startElement, startOffset);
		range.setEnd(endElement, endOffset);
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (doc.body.createTextRange) {
		range = doc.body.createTextRange();
		range.setStart(startElement, startOffset);
		range.setEnd(endElement, endOffset);
		range.select();
	}
}

function endNow(){
	if (isOpen){
		alert("Auto CCM has ended");
	}
	isOpen = false;
}

alert("Auto CCM is beginning");
var isOpen = true;
/* these are all of the tabs open in courseware */
potentialFrames = document.getElementsByClassName("x-panel x-tabpanel-child x-panel-default x-closable x-panel-closable x-panel-default-closable");
frame = undefined;
/*finds the open frame*/
for (q = 0; q < potentialFrames.length; q++) {
	if (!(potentialFrames[q].classList.contains("x-hide-offsets")))
		frame = potentialFrames[q];
}
frame = frame.getElementsByTagName('iframe')[0];
doc = frame.contentDocument;
allStudents = doc.getElementsByClassName("Text Student");
if (allStudents.length === 0){
	endNow();
}
else {
	i = 0;
	matches =
		getMatches(allStudents[i].getElementsByClassName("StringCell").item(0).textContent);
	doc.location.hash =
		allStudents[i].getElementsByClassName("StringCell").item(0).id;
	currentBounds = undefined;

	frame.contentWindow.onkeyup = function (e) {
		if (e.key == '/' && e.ctrlKey) {
			if (isOpen) {
				endNow();
				return;
			}
		}
		if (!isOpen)
			return;
		if (e.key === 'm' && e.ctrlKey || e.key == ',' && e.ctrlKey) {
			bounds = controlMNext();
			if (bounds == undefined) {
				endNow();
				return;
			}
			nodeBounds = determineNodeOffsetBound(bounds);
			selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
		}
		if (e.key == '.' && e.ctrlKey) {
			nodeBounds = determineNodeOffsetBound(currentBounds);
			selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
		}
	};

	bounds = controlMNext();
	if (bounds == undefined) {
		endNow();
	}
	nodeBounds = determineNodeOffsetBound(bounds);
	if (nodeBounds == undefined) {
		endNow();
	}
	selectText(nodeBounds[0], nodeBounds[1], nodeBounds[2], nodeBounds[3]);
}