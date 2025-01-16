/*
Author: Gabe Classon
This script runs on the options page (optionspage.html).  
*/
var browser = browser || chrome; // To ensure compatability between Firefox and Chrome
var hasChanged = false; // marks whether changes have been made since the most recent save

// To be run when a switch is toggled
function toggleSwitch() {
	hasChanged = true;
}

// Adds the text in the input field to the blocklist
function blockadd() {
	let blocklist = document.getElementById("blocklist");
	let prevIdNum;
	if (blocklist.lastChild != null) {
		let prevId = blocklist.lastChild.id;
		prevIdNum = parseInt(prevId.substring(9));
	} else {
		prevIdNum = 0;
	}
	var input = document.getElementById("blockinput").value.trim();
	if (input == null || input == "") {
		return;
	}
	hasChanged = true;
	blocklist.appendChild(createListElementFromId('block', input, prevIdNum + 1));
	blockinput.value = "";
}

// Adds the text in the input field to the allowlist
function allowadd() {
	let allowlist = document.getElementById("allowlist");
	let prevIdNum;
	if (allowlist.lastChild != null) {
		let prevId = allowlist.lastChild.id;
		prevIdNum = parseInt(prevId.substring(9));
	} else {
		prevIdNum = 0;
	}
	var input = document.getElementById("allowinput").value.trim();
	if (input.charAt(input.length - 1) == "/") {
		input = input.substring(0, input.length - 1);
	}
	if (input == null || input == "") {
		return;
	}
	hasChanged = true;
	allowlist.appendChild(createListElementFromId('allow', input, prevIdNum + 1));
	allowinput.value = "";
}

// Deletes an element from the DOM tree
function remove(e) {
	hasChanged = true;
	var element = e.target || e.srcElement;
	element = element.parentNode;
	element.parentNode.removeChild(element);
}

// Creates an array from the elements of the block/allowlists
function getListElementsFromId(id) {
	var out = Array(0);
	let list = document.getElementById(id);
	let children = list.children;
	for (var i = 0; i < children.length; i++) {
		var str = children[i].textContent;
		out[i] = str.substring(0, str.length - 6);
	}
	return out;
}

/*
id: the id of the LIST
content: the textContent of the entry
num: the index of the element on the list (starting from 1)
return: A DOM object that is a single item in the block/allowlists
*/
function createListElementFromId(id, content, num) {
	var li = document.createElement("li");
	li.id = id + "item" + num;
	li.textContent = content;
	var removeButton = document.createElement("button");
	removeButton.className = "remove";
	removeButton.id = id + "removebutton" + num;
	removeButton.textContent = "Remove";
	li.appendChild(removeButton);
	return li;
}

function createListFromIdAndArray(id, array) {
	var outArray = [];
	for (var i = 0; i < array.length; i++) {
		outArray.push(createListElementFromId(id, array[i], i + 1));
	}
	return outArray;
}

function populateList(listElement, itemArray) {
	if (itemArray != null) {
		for (var k = 0; k < itemArray.length; k++) {
			listElement.appendChild(itemArray[k]);
		}
		
	}
}

function save_options() {
	var spellCheck = document.getElementById('spellCheck').checked;
	var unsavedIndicator = document.getElementById('unsavedIndicator').checked;
	var smartClosingDialog = document.getElementById('smartClosingDialog').checked;
	var suppressClosingDialogWindow = document.getElementById('suppressClosingDialogWindow').checked;
	var suppressClosingDialogTryIt = document.getElementById('suppressClosingDialogTryIt').checked;
	var blocklist = getListElementsFromId('blocklist');
	var allowlist = getListElementsFromId('allowlist');
	var casileClassic = document.getElementById('casileClassic').checked
	var menubackgroundcolor = document.getElementById("menubackgroundcolor").value;
	browser.storage.sync.set({
		spellCheck: spellCheck,
		unsavedIndicator: unsavedIndicator,
		smartClosingDialog: smartClosingDialog,
		suppressClosingDialogWindow: suppressClosingDialogWindow,
		suppressClosingDialogTryIt: suppressClosingDialogTryIt,
		blocklist: blocklist,
		allowlist: allowlist,
		casileClassic: casileClassic,
		menubackgroundcolor: menubackgroundcolor
	}, function () {
		// Update status to let user know options were saved.
		hasChanged = false;
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function () {
			status.textContent = '';
		}, 750);
	});
}

function reset_options() {
	if (confirm("This will reset all settings. Are you sure?")) {
		browser.storage.sync.clear(reload);
	}
	hasChanged = false;
}

function reload() {
	location.reload();
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.
function restore_options() {
	// Use default value color = 'red' and likesColor = true.
	browser.storage.sync.get({
		spellCheck: true,
		unsavedIndicator: true,
		smartClosingDialog: true,
		suppressClosingDialogTryIt: false,
		suppressClosingDialogWindow: false,
		blocklist: [],
		allowlist: [],
		casileClassic: false,
		menubackgroundcolor: "#663333"
	}, function (items) {
		document.getElementById('spellCheck').checked = items.spellCheck;
		document.getElementById('unsavedIndicator').checked = items.unsavedIndicator;
		document.getElementById('smartClosingDialog').checked = items.smartClosingDialog;
		document.getElementById('suppressClosingDialogWindow').checked = items.suppressClosingDialogWindow;
		document.getElementById('suppressClosingDialogTryIt').checked = items.suppressClosingDialogTryIt;
		populateList(document.getElementById('blocklist'), createListFromIdAndArray('block', items.blocklist));
		populateList(document.getElementById('allowlist'), createListFromIdAndArray('allow', items.allowlist));
		document.getElementById('casileClassic').checked = items.casileClassic;
		document.getElementById("menubackgroundcolor").value = items.menubackgroundcolor;
		document.getElementById("body").style.background = items.menubackgroundcolor;
		document.getElementById("preview").style.background = items.menubackgroundcolor;
		var css =
			`input:checked + .slider {
				background-color: ${items.menubackgroundcolor};
			}

			input:focus + .slider {
				box-shadow: 0 0 1px ${items.menubackgroundcolor};
			}
			
			a {
				color: ${items.menubackgroundcolor}
			}
			
			button {
				background-color: ${items.menubackgroundcolor}
			}
			`;
		document.getElementById("style").appendChild(document.createTextNode(css));
	})
	document.body.style.display = "initial";
}

restore_options();
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('spellCheck').addEventListener('click', toggleSwitch);
document.getElementById('unsavedIndicator').addEventListener('click', toggleSwitch);
document.getElementById('smartClosingDialog').addEventListener('click', toggleSwitch);
document.getElementById('suppressClosingDialogWindow').addEventListener('click', toggleSwitch);
document.getElementById('suppressClosingDialogTryIt').addEventListener('click', toggleSwitch);
document.getElementById('casileClassic').addEventListener('click', toggleSwitch);
document.getElementById('reset').addEventListener('click', reset_options);
document.getElementById('allowadd').addEventListener('click', allowadd);
document.getElementById('blockadd').addEventListener('click', blockadd);
let allowBlockListAdditionObserver = new MutationObserver(function (e) {
	for (let mutationRecord of e) {
		for (let addedNode of mutationRecord.addedNodes) {
			var element = addedNode.lastChild;
			if (element == null) {
				return false;
			}
			if (element.className != null && element.className == 'remove') {
				element.addEventListener('click', remove);
			}
		}
	}
});
allowBlockListAdditionObserver.observe(document.getElementById("allowlist"), {childList: true})
allowBlockListAdditionObserver.observe(document.getElementById("blocklist"), {childList: true})


document.getElementById("menubackgroundcolor").addEventListener("change", updatebackgroundcolor);
function updatebackgroundcolor() {
	hasChanged = true;
	document.getElementById("body").style.background = this.value;
	document.getElementById("preview").style.background = this.value;
	var css =
		`input:checked + .slider {
				background-color: ${this.value};
			}

			input:focus + .slider {
				box-shadow: 0 0 1px ${this.value};
			}
			
			a {
				color: ${this.value}
			}
			
			button {
				background-color: ${this.value}
			}
			`;
	document.getElementById("style").appendChild(document.createTextNode(css));
}

window.addEventListener("beforeunload", function (e) {
	if (hasChanged) {
		event.returnValue = "string";
	}
});
