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
var suppressSaveWarning = false; // Should the Ctrl+S save warning be suppressed? 
var spellCheck = true; // Should spellcheck be turned on?
var globalSelection;
var allowlist;
var blocklist;

/*
url: The root path for this chrome extension
color: A string color representing what color the background should be.
textStyleMenu: whether to also include extended text formatting options
Creates the Auto CCM menu that is at the top of each Try-It with the given background color.
 */
function createMouseMenu(url, color) {
	var imageWidth = 25; // The width of each menu icon
	var totalWidth = (imageWidth + 1) * 5 + 1; // The total width of the menu
	var div = document.createElement("div"); // The primary container
	div.style = "white-space: nowrap; position: absolute; top:0;z-index: 99;margin-right: calc(50% - " + totalWidth / 2 + "px);margin-left: calc(50% - " + totalWidth / 2 + "px);margin-top: 0px;width: auto;height: auto;font-family: sans-serif; color: white; opacity: 1; transition: opacity 600 ms ease 0s; background-color: " + color;
	div.id = "mouseMenu";
	div.className = "mouseMenu";
	// The various buttons of the Auto CCM menu, created using the helper function createButton
	var formatButton = createButton(url, "formatButton", "formaticon.svg", "Format (Ctrl+M)", simulateControlM, false);
	div.appendChild(formatButton);
	var deformatButton = createButton(url, "deformatButton", "deformaticon.svg", "Deformat (Ctrl+')", controlApostrophe, false);
	div.appendChild(deformatButton);
	var skipButton = createButton(url, "skipButton", "skipicon.svg", "Skip Selection (Ctrl+,)", null, false);
	div.appendChild(skipButton);
	var multiformatButton = createButton(url, "multiformatButton", "multiformaticon.svg", "Format All (Ctrl+;)", null, false);
	div.appendChild(multiformatButton);
	div.appendChild(multiformatButton);
	var stopButton = createButton(url, "stopButton", "starticon.svg", "Start Auto CCM (Ctrl+/)", startAutoCCM, true);
	div.appendChild(stopButton);
	// Several buttons should be disabled by default
	skipButton.disabled = true;
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
						
						.textStyleMenu {
							margin-left: 0px;
							margin-right: 0px;
							width: 100%;
							height: 25px;
							display: none;
							text-align: center;
							position: absolute;
							z-index: 1000;
							bottom: 0px;
							border: solid gray;
							border-width: 1px 0 1px 0;
							background-color: white;
							color: #6b6b6b;
							overflow-y: hidden;
							overflow-x: hidden;
						}
						
						.innerTextStyleMenu {
							display: inline-block;
							text-align: center;
							vertical-align: middle;
							height: 25px;
							width: auto;
							overflow-y: hidden;
							overflow-x: hidden;
							width: auto;
							position: relative;
						}
						
						.customSelect {
							-webkit-appearance: none;
							-moz-appearance: none;
							appearance: none;
							position: relative;
							height: 25px;
							display: inline-block;
							border: 0px;
							padding-top: 3px;
							padding-bottom: 3px;
							padding-left: 6px;
							padding-right: 3px;
							margin-left: 2px;
							margin-right: 2px;
							background-image: url('${url}icons/selectarrowicon.svg');
							background-size: 10px 10px;
							background-position: calc(100% - 5px) 50%;
							background-repeat: no-repeat;
							color: #6b6b6b;
							overflow: hidden;
							vertical-align: top;
						}
						
						#fontFamilySelect {
							width: 145px;
						}
						
						#fontSizeSelect {
							width: 50px;
						}
						
						.customSelect:hover {
							filter: brightness(90%);
							cursor: pointer;
						}
						
						.customSelect:active {
							filter: brightness(75%);
							cursor: pointer;
						}
						
						
						.selectOption {
							vertical-align: top;
							padding-top: 3px;
							padding-bottom: 3px;
							display: inline-block;
							height: 25px;
							overflow: hidden;
						}
						
						.menuSeparator {
							vertical-align: top;
							height: 25px;
							width: 2px;
							margin-left: 2px;
							margin-right: 2px;
						}
						
						.customInput {
							vertical-align: top;
						}
						
						.customToggle {
							-webkit-appearance: none;
							-moz-appearance: none;
							appearance: none;
						}
						
						.customToggleDiv {
							display: inline-block;
							vertical-align: top;
							background: white;
							margin-left: 2px;
							margin-right: 2px;
						}
						
						.customToggleDiv:hover {
							filter:brightness(90%);
							vertical-align: top;
							cursor: pointer;
						}
						
						.customToggleDiv:active {
							filter:brightness(75%);
							vertical-align: top;
							cursor: pointer;
						}
						
						.customToggleImg {
							vertical-align: middle;
							height: 25px;
							width: 25px;
						}
						
						.checkedToggle {
							filter:brightness(75%);
						}
						
						.checkedToggle:hover {
							filter:brightness(75%);
						}
						
						.checkedToggle:active {
							filter:brightness(75%);
						}
						
						.customColorDiv, .customButtonDiv {
							display: inline-block;
							vertical-align: top;
							background: white;
							margin-left: 2px;
							margin-right: 2px;	
						}
						
						.customColorInput:hover {
							cursor: pointer;
						}
						
						.customColorDiv:hover, .customButtonDiv:hover {
							filter:brightness(90%);
							cursor: pointer;
						}
						
						.customColorDiv:active, .customButtonDiv:active {
							filter:brightness(75%);
							cursor: pointer;
						}
						
						.customColorImg, .customButtonImg {
							vertical-align: middle;
							height: 25px;
							cursor: pointer;
						}
						
						.leftArrowDiv {
							left: 0px;
						}
						
						.rightArrowDiv {
							right: 0px;
						}
						
						.leftArrowDiv, .rightArrowDiv {
							position: absolute;
							margin-left: 0;
							margin-right: 0;
							padding-left: 2px;
							padding-right: 2px;
							z-index: 1001;
						}
						
						.customColorInput {
							opacity: 0;
							position: absolute;
							top: 0;
							left: 0;
							height: 25px;
							width: 25px;
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

function createTextStyleMenu(url, fontlist) {
	// Parent span
	var span = document.createElement("span");
	span.classList = ["textStyleMenu"];
	span.addEventListener("click", function (e) {
		e.stopPropagation();
	});
	span.addEventListener("mousedown", function (e) {
		e.stopPropagation();
	});
	span.id = "textStyleMenu";
	// Arrow keys
	// left arrow
	var leftArrowDiv = document.createElement("div");
	leftArrowDiv.className = "customColorDiv leftArrowDiv";
	var leftArrowImg = document.createElement("img");
	leftArrowImg.className = "customColorImg";
	leftArrowImg.src = url + "icons/leftarrow.svg";
	leftArrowDiv.appendChild(leftArrowImg);
	leftArrowDiv.addEventListener("mousedown", function (e) {
		var innerTextStyleMenu = document.getElementById("innerTextStyleMenu");
		var offset = parseInt(innerTextStyleMenu.style.right);
		if (offset != NaN) {
			innerTextStyleMenu.style.right = (offset + 10) + "px"
		}
	});
	span.appendChild(leftArrowDiv);
	// right arrow
	var rightArrowDiv = document.createElement("div");
	rightArrowDiv.className = "customColorDiv rightArrowDiv";
	var rightArrowImg = document.createElement("img");
	rightArrowImg.className = "customColorImg";
	rightArrowImg.src = url + "icons/rightarrow.svg";
	rightArrowDiv.appendChild(rightArrowImg);
	rightArrowDiv.addEventListener("mousedown", function (e) {
		var innerTextStyleMenu = document.getElementById("innerTextStyleMenu");
		var offset = parseInt(innerTextStyleMenu.style.right);
		if (offset != NaN) {
			innerTextStyleMenu.style.right = (offset - 10) + "px"
		}
	});
	span.appendChild(rightArrowDiv);
	// containing div
	var div = document.createElement("div");
	div.classList = ["innerTextStyleMenu"];
	div.id = "innerTextStyleMenu";
	div.style.right = "0px";
	span.appendChild(div);
	div.appendChild(createSeparator(url));
	// font-family
	var fontFamilySelect = document.createElement("select");
	fontFamilySelect.className = "selectFont customSelect";
	fontFamilySelect.id = "fontFamilySelect";
	fontFamilySelect.title = "Font face";
	fontlist.splice(0, 0, "");
	for (var f = 0; f < fontlist.length; f++) {
		var fontFamilyOption = document.createElement("option");
		fontFamilyOption.value = fontlist[f];
		fontFamilyOption.textContent = fontlist[f].split(",")[0];
		fontFamilyOption.style.fontFamily = fontlist[f];
		fontFamilyOption.style.paddingTop = "3px";
		fontFamilyOption.style.paddingBottom = "3px";
		fontFamilyOption.classList = "fontFamilyOption selectOption";
		fontFamilySelect.appendChild(fontFamilyOption);
	}
	fontFamilySelect.addEventListener("change", function (e) {
		var fontFamilySelect = e.target;
		if (fontFamilySelect.selectedIndex == 0) {
			return null;
		}
		console.log("Font family selected");
		reselectGlobalSelection();
		document.execCommand("fontName", "false", fontFamilySelect.options[fontFamilySelect.selectedIndex].value);
		forceTextStyleMenuUpdate();
	});
	div.appendChild(fontFamilySelect);
	// font-size
	var fontSizeSelect = document.createElement("select");
	fontSizeSelect.className = "customSelect";
	fontSizeSelect.id = "fontSizeSelect";
	fontSizeSelect.title = "Font size";
	var fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 144];
	var blankSizeOption = document.createElement("option");
	blankSizeOption.value = "";
	fontSizeSelect.appendChild(blankSizeOption);
	for (var f = 0; f < fontSizes.length; f++) {
		var option = document.createElement("option");
		option.classList = "selectOption";
		option.value = fontSizes[f] + "px";
		option.textContent = "" + fontSizes[f];
		fontSizeSelect.appendChild(option);
	}
	fontSizeSelect.addEventListener("change", function (e) {
		var fontSizeSelect = e.target;
		if (fontSizeSelect.selectedIndex == 0) {
			return null;
		}
		var value = fontSizeSelect.options[fontSizeSelect.selectedIndex].value;
		setFontSize(value);
	});
	div.appendChild(fontSizeSelect);
	div.appendChild(createSeparator(url));
	if (document.body != null) {
		document.body.insertBefore(span, document.body.children[0]);
	}
	// bold
	div.appendChild(createCustomToggle("fontWeight", url + "icons/boldicon.svg", "bold", "Bold (Ctrl+B)"));
	// italics
	div.appendChild(createCustomToggle("fontStyle", url + "icons/italicsicon.svg", "italic", "Italics"));

	// underline
	div.appendChild(createCustomToggle("underline", url + "icons/underlineicon.svg", "underline", "Underline (Ctrl+U)"));
	// strikethrough
	div.appendChild(createCustomToggle("strikethrough", url + "icons/strikethroughicon.svg", "strikethrough", "Strikethrough"));
	div.appendChild(createSeparator(url));
	//justification
	div.appendChild(createCustomToggle("justifyLeft", url + "icons/justifylefticon.svg", "justifyLeft", "Justify left"));
	div.appendChild(createCustomToggle("justifyCenter", url + "icons/justifycentericon.svg", "justifyCenter", "Justify center"));
	div.appendChild(createCustomToggle("justifyRight", url + "icons/justifyrighticon.svg", "justifyRight", "Justify right"));
	div.appendChild(createCustomToggle("justifyFull", url + "icons/justifyfullicon.svg", "justifyFull", "Justify"));
	div.appendChild(createSeparator(url));
	// color
	div.appendChild(createCustomColorInput("textColor", url + "icons/textcoloricon.svg", "foreColor", "Text color"));
	div.appendChild(createCustomColorInput("highlightColor", url + "icons/highlighticon.svg", "hiliteColor", "Highlight color"));
	div.appendChild(createCustomButton("removeHighlight", url + "icons/removehighlighticon.svg", "Remove highlight", function (e) {
			reselectGlobalSelection();
			document.execCommand("hiliteColor", false, "#00000000");
		}));
	div.appendChild(createSeparator(url));
	// remove formatting
	div.appendChild(createCustomButton("removeFormat", url + "icons/removeformattingicon.svg", "Remove formatting", function (e) {
			reselectGlobalSelection();
			document.execCommand("removeFormat");
		}));
	div.appendChild(createSeparator(url));
	return;
}

function createCustomToggle(attributeName, iconPath, commandName, title) {
	var div = document.createElement("div");
	div.className = "customToggleDiv";
	div.title = title;
	var toggle = document.createElement("input");
	toggle.type = "checkbox";
	toggle.className = attributeName + "Toggle customToggle";
	toggle.id = attributeName + "Toggle";
	div.appendChild(toggle);
	var img = document.createElement("img");
	img.src = iconPath;
	img.className = "customToggleImg";
	div.appendChild(img);
	div.addEventListener("click", function (e) {
		var toggle = e.target.querySelector("input.customToggle") || e.target.parentElement.querySelector("input.customToggle");
		reselectGlobalSelection();
		document.execCommand(commandName);
		if (toggle.checked) {
			toggle.checked = false;
			this.classList.remove("checkedToggle");
		} else {
			toggle.checked = true;
			this.classList.add("checkedToggle");
		}
		forceTextStyleMenuUpdate();
	});
	return div;
}

function createCustomColorInput(attributeName, iconPath, commandName, title) {
	var customColorDiv = document.createElement("div");
	customColorDiv.className = "customColorDiv";
	customColorDiv.title = title;
	var customColorInput = document.createElement("input");
	customColorInput.type = "color";
	customColorInput.className = "customColorInput";
	customColorInput.id = attributeName + "Input";
	customColorInput.value = "#6b6b6b";
	customColorInput.addEventListener("change", function (e) {
		reselectGlobalSelection();
		document.execCommand(commandName, false, this.value);
	});
	customColorDiv.appendChild(customColorInput);
	var customColorImg = document.createElement("img");
	customColorImg.className = "customColorImg";
	customColorImg.id = attributeName + "Img";
	customColorImg.src = iconPath;
	customColorImg.style.background = "#6b6b6b";
	customColorDiv.appendChild(customColorImg);
	return customColorDiv;
}

function createCustomButton(idRoot, iconPath, title, onClickListener) {
	var customButtonDiv = document.createElement("div");
	customButtonDiv.className = "customButtonDiv";
	customButtonDiv.title = title;
	customButtonDiv.addEventListener("click", onClickListener);
	customButtonDiv.id = idRoot + "Div";
	var customButtonImg = document.createElement("img");
	customButtonImg.className = "customButtonImg";
	customButtonImg.id = idRoot + "Img";
	customButtonImg.src = iconPath;
	customButtonDiv.appendChild(customButtonImg);
	return customButtonDiv;
}

function setFontSize(size) {
	var sel = window.getSelection();

	var selectedHtml = "";
	if (sel.rangeCount) {
		var container = document.createElement("div");
		for (var i = 0, len = sel.rangeCount; i < len; ++i) {
			container.appendChild(sel.getRangeAt(i).cloneContents());
		}
		const children = container.getElementsByTagName("*")
			for (let child of children) {
				if (child.style.fontSize) {
					child.style.fontSize = `${size}`
				}
			}
			selectedHtml = container.innerHTML;
	}

	let html = `<font style="font-size: ${size};">${selectedHtml}</font>`;
	reselectGlobalSelection();
	document.execCommand('insertHTML', false, html);
}

function createSeparator(url) {
	var img = document.createElement("img");
	img.src = url + "icons/separator.svg";
	img.className = "menuSeparator";
	return img;
}

function forceTextStyleMenuUpdate(fontFamilySelect) {
	var fontFamilySelect = document.getElementById("fontFamilySelect");
	fontFamilySelect.style.fontFamily = fontFamilySelect.options[fontFamilySelect.selectedIndex].value;
	var toggleDivs = document.getElementsByClassName("customToggleDiv");
	for (var t = 0; t < toggleDivs.length; t++) {
		var toggleInput = toggleDivs[t].querySelector("input.customToggle");
		if (toggleInput.checked) {
			toggleDivs[t].classList.add("checkedToggle");
		} else {
			toggleDivs[t].classList.remove("checkedToggle");
		}
	}
	var customColorInputs = document.getElementsByClassName("customColorInput");
	for (var c = 0; c < customColorInputs.length; c++) {
		var customColorInput = customColorInputs[c];
		var customColorDiv = customColorInput.closest("div.customColorDiv");
		var customColorImg = customColorDiv.querySelector("img.customColorImg");
		customColorImg.style.background = customColorInput.value;
	}
}

function resetTextStyleMenu(fontFamilySelect) {
	document.getElementById("fontFamilySelect").selectedIndex = 0;
	document.getElementById("fontSizeSelect").selectedIndex = 0;
	var toggles = document.getElementsByClassName("customToggle");
	for (var t = 0; t < toggles.length; t++) {
		toggles[t].checked = false;
	}
	var colors = document.getElementsByClassName("customColorInput");
	for (var c = 0; c < colors.length; c++) {
		colors[c].value = "#6b6b6b";
	}
	forceTextStyleMenuUpdate();
}

/*Selection change observer*/
function onSelectionChange(e) {
	globalSelection = window.getSelection().getRangeAt(0);
	var selectedNodes = getSelectedNodes(window);
	if (selectedNodes.length == 0) {
		var selection = window.getSelection();
		if (selection.isCollapsed) {
			selectedNodes = [selection.anchorNode];
		}
	}
	if (selectedNodes.length == 0 || (selectedNodes[0] != null && selectedNodes[0].parentElement != null && selectedNodes[0].parentElement.closest(".textStyleMenu") != null) || (selectedNodes[0] != null && selectedNodes[0].parentElement != null && selectedNodes[0].parentElement.closest(".PasteTarget") != null)) {
		resetTextStyleMenu();
		return;
	}
	// Font-family
	var fontSelect = document.getElementById("fontFamilySelect");
	var font = getPrevailingStyle(selectedNodes, "font-family");
	var fontName = null;
	if (font != null) {
		fontName = font.split(",")[0];
		fontName = fontName.trim();
		if (fontName[0] == '"' || fontName[0] == "'") {
			fontName = fontName.substring(1);
		}
		if (fontName[fontName.length - 1] == '"' || fontName[fontName.length - 1] == "'") {
			fontName = fontName.substring(0, fontName.length - 1);
		}
	}
	var fontSelectOptions = fontSelect.options;
	for (var i = 0; i < fontSelectOptions.length; i++) {
		if (fontSelectOptions[i].textContent == fontName) {
			fontSelect.selectedIndex = i;
			break;
		}
	}
	if (font == null || i == fontSelectOptions.length) {
		fontSelect.selectedIndex = 0;
	}

	// Font-size
	var fontSizeSelect = document.getElementById("fontSizeSelect");
	var fontSize = getPrevailingStyle(selectedNodes, "font-size");
	var fontSizeSelectOptions = fontSizeSelect.options;
	for (var i = 0; i < fontSizeSelectOptions.length; i++) {
		if (fontSizeSelectOptions[i].value == fontSize) {
			fontSizeSelect.selectedIndex = i;
			break;
		}
	}
	if (fontSize == null || i == fontSizeSelectOptions.length) {
		fontSizeSelect.selectedIndex = 0;
	}
	// Font-weight
	var fontWeightInput = document.getElementById("fontWeightToggle");
	var fontWeight = getPrevailingStyle(selectedNodes, "font-weight");
	fontWeightInput.checked = fontWeight > 400;
	// Italics
	var fontStyleInput = document.getElementById("fontStyleToggle");
	var fontStyle = getPrevailingStyle(selectedNodes, "font-style");
	fontStyleInput.checked = fontStyle != null && fontStyle.includes("italic");
	// Underline & Strikethrough
	var underlineInput = document.getElementById("underlineToggle");
	var strikethroughInput = document.getElementById("strikethroughToggle");
	var textDecoration = getPrevailingStyle(selectedNodes, "webkitTextDecorationsInEffect", "textDecorationLine");
	underlineInput.checked = textDecoration != null && textDecoration.includes("underline");
	strikethroughInput.checked = textDecoration != null && textDecoration.includes("line-through");
	// Justification
	var justifyLeftInput = document.getElementById("justifyLeftToggle");
	var justifyRightInput = document.getElementById("justifyRightToggle");
	var justifyCenterInput = document.getElementById("justifyCenterToggle");
	var justifyFullInput = document.getElementById("justifyFullToggle");
	var justification = getPrevailingStyle(selectedNodes, "text-align");
	justifyLeftInput.checked = justification != null && justification.includes("left");
	justifyRightInput.checked = justification != null && justification.includes("right");
	justifyCenterInput.checked = justification != null && justification.includes("center");
	justifyFullInput.checked = justification != null && justification.includes("justify");
	//Color
	var textColorInput = document.getElementById("textColorInput");
	var textColor = getPrevailingStyle(selectedNodes, "color");
	if (textColor != null) {
		textColorInput.value = convertRBGStrToHexStr(textColor);
	} else {
		textColorInput.value = "#6b6b6b";
	}
	// Hilight color
	var highlightColorInput = document.getElementById("highlightColorInput");
	var highlightColor = getPrevailingStyle(selectedNodes, "background-color");
	if (highlightColor != null) {
		var hexStr = convertRBGStrToHexStr(highlightColor);
		if (hexStr.length < 8) {
			highlightColorInput.value = hexStr;
		} else {
			highlightColorInput.value = "#6b6b6b";
		}
	} else {
		highlightColorInput.value = "#6b6b6b";
	}
	// Force VISUAL updates to menu forceTextStyleMenuUpdate();
	forceTextStyleMenuUpdate();
}

/*
selectionArray: An array of selection nodes
attributeName: the attribute to search for within the nodes
backupAttributeName: the backup attribute to search for within the nodes, if the attributeName as initially given does not exist
Gets the prevailing style (of an attribute) that is applied to a given selection. Returns null if the
 */
function getPrevailingStyle(selectionArray, attributeName, backupAttributeName) {
	var style = undefined
		for (var i = 0; i < selectionArray.length; i++) {
			var node = selectionArray[i];
			if (node == null) {
				return null;
			}
			if (!(node instanceof Element)) {
				node = node.parentElement;
			}
			if (node == null) {
				return null;
			}
			if (node.textContent.length > 0 && node.tagName != "BR") {
				attributeValue = window.getComputedStyle(node, null)[attributeName];
				if (attributeValue == null && backupAttributeName != null) { // If the attributeName does not exist in the computed styles, switch to using the backupAttributeName
					var temp = attributeName;
					attributeName = backupAttributeName;
					backupAttributeName = temp;
					attributeValue = window.getComputedStyle(node, null)[attributeName];
				}
				if (style != null && !style.includes(attributeValue) && !attributeValue.includes(style)) {
					return null;
				} else if (style != attributeValue && attributeValue.includes(style)) {
					// do nothing... the prevailing style can be maintained
				} else {
					style = attributeValue;
				}
			}
		}
		return style;
}

function convertRBGStrToHexStr(rgbString) {
	var rgbVals = rgbString.split(/[)(]/g)[1];
	var rgbArray = rgbVals.split(",");
	var out = "#";
	for (var i = 0; i < rgbArray.length; i++) {
		var hexPart = parseInt(rgbArray[i]).toString(16);
		if (hexPart.length < 2) {
			hexPart = "0" + hexPart;
		}
		out += hexPart;
	}
	return out;
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
	if (window.getSelection != null) {
		var anchorNode = window.getSelection().anchorNode;
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
	if (selectedNodes == null || selectedNodes.length == 0) {
		return;
	}
	var previousNode = null;
	for (var i = 0; i < selectedNodes.length; i++) {
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
		e.stopPropagation();
			e.stopImmediatePropagation();
		if (suppressSaveWarning || confirm("Are you sure you want to save? This will overwrite any previous saves.")) {
			controlS();
		}
	}
	if (e.key == "Tab" && !e.shiftKey) {
		// CASE 1
		var activeCell = document.activeElement.closest("li.Cell") || document.querySelector("li.Selected");
		var insertionBarElement = document.getElementsByClassName("InsertionBar")[0];
		// If there is already an insertion bar
		if (insertionBarElement != null) {
			var closestCellGroup = insertionBarElement.parentElement.closest("li.CellGroup");
			// And the insertion bar is on the last element in a group
			if (insertionBarElement.nextElementSibling == null && closestCellGroup != null) {
				e.preventDefault();
				closestCellGroup.classList.add("InsertionBar");
				var pasteTarget = document.getElementsByClassName("PasteTarget")[0];
				if (pasteTarget != null) {
					pasteTarget.focus();
				}
			} else { // Otherwise, if the insertion bar is not on the last element of the group
				// When at the top of the page
				if (insertionBarElement.classList.contains("DummyCell")) {
					insertionBarElement.tabIndex = 0;
					insertionBarElement.focus();
				}
				// Last element on page: do nothing
				else if (insertionBarElement.nextElementSibling == null) {
					return;
				}
				// If next element is OutputCell or MessageCell
				else if (insertionBarElement.nextElementSibling.matches("li.OutputCell") || insertionBarElement.nextElementSibling.matches("li.MessageCell")) {
					e.preventDefault();
					var outputStringCell = insertionBarElement.nextElementSibling.querySelector("[contenteditable='true']");
					if (outputStringCell != null) {
						outputStringCell.click();
					}
					// If output cell could not be selected
					if (outputStringCell != document.activeElement) {
						// If output cell is last element of an evaluation group
						if ((insertionBarElement.nextElementSibling.matches("ul.EvaluationGroup > li.OutputCell") || insertionBarElement.nextElementSibling.matches("ul.EvaluationGroup > li.MessageCell")) && insertionBarElement.nextElementSibling.nextElementSibling == null) {
							insertionBarElement.nextElementSibling.parentElement.parentElement.classList.add("InsertionBar");
						} else {
							insertionBarElement.nextElementSibling.classList.add("InsertionBar");
						}
						var pasteTarget = document.getElementsByClassName("PasteTarget")[0];
						if (pasteTarget != null) {
							pasteTarget.focus();
						}
					}
				} else {
					e.preventDefault();
					insertionBarElement.nextElementSibling.querySelector("[contenteditable='true']").focus();
				}
			}
			insertionBarElement.classList.remove("InsertionBar");
		}
		// If there is no insertion bar and there is an active cell, make an insertion bar
		else if (activeCell != null) {
			e.preventDefault();
			if (activeCell.closest("li.CellGroup.Closed") == null) {
				// Output cells should not have a insertion bar directly associated with them
				if (activeCell.matches("ul.EvaluationGroup > li.OutputCell")) {
					activeCell.parentElement.parentElement.classList.add("InsertionBar");
				} else {
					activeCell.classList.add("InsertionBar");
				}
			} else {
				var lastClosedCell;
				var currentElement = activeCell;
				while (currentElement.parentElement != null && currentElement.className != "Notebook") {
					if (currentElement.matches("li.CellGroup.Closed")) {
						lastClosedCell = currentElement;
					}
					currentElement = currentElement.parentElement;
				}
				if (lastClosedCell != null) {
					lastClosedCell.classList.add("InsertionBar");
				}
			}
			var pasteTarget = document.getElementsByClassName("PasteTarget")[0];
			if (pasteTarget != null) {
				pasteTarget.focus();
			}
			if (activeCell.classList.contains("Selected")) {
				activeCell.classList.remove("Selected")
				activeCell.querySelector("ul, dl, ol").classList.remove("Selected");
			}
		}
	} else if (e.key == "Tab" && e.shiftKey) {
		e.preventDefault();
		// CASE 1
		var activeCell = document.activeElement.closest("li.Cell") || document.querySelector("li.Selected");
		var insertionBarElement = document.getElementsByClassName("InsertionBar")[0];
		// If there is already an insertion bar
		if (insertionBarElement != null) {

			// If the insertion bar is on a cell
			if (insertionBarElement.classList.contains("Cell")) {
				focusElement(insertionBarElement);
				if (!insertionBarElement.contains(document.activeElement)) {
					var currentCell = insertionBarElement;
					var previousElement = currentCell.previousElementSibling;
					var recursionCounter = 0;
					while (previousElement == null && recursionCounter < 15) {
						currentCell = currentCell.parentElement.closest("li");
						previousElement = currentCell.previousElementSibling;
						recursionCounter++;
					}
					addInsertionBar(previousElement);
				}
			}
			// If the insertion bar is on a group
			else if (insertionBarElement.classList.contains("CellGroup")) {
				// And if the insertion bar group is open
				if (insertionBarElement.classList.contains("Open")) {
					// if it is on an evaluation group
					if (insertionBarElement.classList.contains("EvaluationGroup")) {
						var lastElement = insertionBarElement.lastElementChild.lastElementChild;
						focusElement(lastElement);
						if (!lastElement.contains(document.activeElement)) {
							addInsertionBar(lastElement.previousElementSibling);
						}
					}
					//otherwise
					else {
						var lastChildren = insertionBarElement.lastElementChild.querySelectorAll("li");
						var lastChild = lastChildren[lastChildren.length - 1];
						if (lastChild != null) {
							addInsertionBar(lastChild);
						}
					}
				}
				// And if the insertion bar group is closed
				else {
					var firstSelectableElement = insertionBarElement.querySelector("[contenteditable='true']");
					focusElement(firstSelectableElement);
				}
			}
		}
		// If there is not an insertion bar
		else if (activeCell != null) {
			var currentCell = activeCell;
			var previousElement = currentCell.previousElementSibling;
			var recursionCounter = 0;
			while (previousElement == null && recursionCounter < 15) {
				currentCell = currentCell.parentElement.closest("li");
				previousElement = currentCell.previousElementSibling;
				recursionCounter++;
			}
			if (recursionCounter < 15) {
				addInsertionBar(previousElement);
			}
		}
		// Remove anything that might be selected
		var selectedElements = document.querySelectorAll(".Selected");
		for (var s = 0; s < selectedElements.length; s++) {
			selectedElements[s].classList.remove("Selected");
		}
	}
}

function onDocumentFocusIn(e) {
	var textStyleMenu = document.getElementById("textStyleMenu");
	if ((e.target.matches("[contenteditable=true]") && !e.target.classList.contains("PasteTarget")) && !e.target.classList.contains("Clipboard")) {
		textStyleMenu.style.display = "inline-block";
	} else if (e.target.closest("#textStyleMenu") != null || e.target.closest("#mouseMenu") != null) {
		// Do nothing
	} else {
		textStyleMenu.style.display = "none";
	}
}

function reselectGlobalSelection() {
	try {
		if (globalSelection instanceof Range) {
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(globalSelection);
		}
	} catch (e) {
		console.log(e);
		console.trace();
	}
}

function focusElement(element) {
	element.classList.remove("InsertionBar");
	var stringCell = element.contenteditable ? element : element.querySelector("[contenteditable='true']");
	if (stringCell != null) {
		stringCell.click();
		stringCell.focus();
	} else {
		element.click();
		element.focus();
	}
}

function addInsertionBar(element) {
	var insertionBarElement = document.querySelector(".InsertionBar");
	if (insertionBarElement != null) {
		insertionBarElement.classList.remove("InsertionBar");
	}
	element.classList.add("InsertionBar");
	var pasteTarget = document.getElementsByClassName("PasteTarget")[0];
	if (pasteTarget != null) {
		pasteTarget.focus();
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
					var buttons = mutationsList[g].addedNodes[h].getElementsByTagName("button");
					if (buttons != null) {
						for (var j = 0; j < buttons.length; j++) {
							console.log("DIALOGCHECK");
							if (buttons[j].textContent == "Hand in") {
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
	var textStyleMenu = items.textStyleMenu;
	if (textStyleMenu) {
		createTextStyleMenu(url, items.fontlist);
		document.addEventListener("focusin", onDocumentFocusIn);
		document.addEventListener("selectionchange", onSelectionChange);
	}
	spellCheck = items.spellCheck;
	unsavedIndicator = items.unsavedIndicator;
	suppressClosingDialogTryIt = items.suppressClosingDialogTryIt;
	suppressClosingDialogWindow = items.suppressClosingDialogWindow;
	suppressClosingDialogCourse = items.suppressClosingDialogCourse;
	smartClosingDialog = items.smartClosingDialog;
	suppressSaveWarning = items.suppressSaveWarning;
	allowlist = items.allowlist;
	blocklist = items.blocklist;
	detectUnsavedChanges = unsavedIndicator || (smartClosingDialog && (!suppressClosingDialogTryIt || !suppressClosingDialogWindow || !suppressClosingDialogCourse))

	if (spellCheck) {
		// Turn on spellcheck for every existing student cell or text cell in the document
		var allStudents = document.getElementById("Notebook").getElementsByClassName("Notebook")[0].getElementsByClassName("Text Student");
		// Turn on spellcheck for every existing student cell or text cell in the document
		for (var k = 0; k < allStudents.length; k++) {
			allStudents[k].spellcheck = "true";
		}
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
