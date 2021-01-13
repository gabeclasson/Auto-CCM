var chrome;
var browser = browser || chrome;

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
	blocklist.innerHTML += createListElementFromId('block', input, prevIdNum + 1);
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
	allowlist.innerHTML += createListElementFromId('allow', input, prevIdNum + 1);
	allowinput.value = "";
}

function remove(e) {
	hasChanged = true;
	var element = e.target || e.srcElement;
	element = element.parentNode;
	element.parentNode.removeChild(element);
}

function getListElementsFromId(id) {
	var out = Array(0);
	let list = document.getElementById(id);
	let children = list.children;
	for (var i = 0; i < children.length; i++) {
		var lineText = children[i].textContent;
		lineText = lineText.substring(0, lineText.length - 6);
		out.push(lineText);
	}
	return out;
}

function createListElementFromId(id, content, num) {
	return "<li id =" + id + "item" + num + ">" + content + "<button class='remove' id='" + id + "removebutton" + num + "'>Remove</button>";
}

function createListFromIdAndArray(id, array) {
	var innerHTML = "";
	for (var i = 0; i < array.length; i++) {
		innerHTML += createListElementFromId(id, array[i], i + 1);
	}
	return innerHTML;
}
function save_options() {
	var spellCheck = document.getElementById('spellCheck').checked;
	var unsavedIndicator = document.getElementById('unsavedIndicator').checked;
	var warningDialog = document.getElementById('warningDialog').checked;
	var blocklist = getListElementsFromId('blocklist');
	var allowlist = getListElementsFromId('allowlist');
	var menubackgroundcolor = document.getElementById("menubackgroundcolor").value;
	browser.storage.sync.set({
		spellCheck: spellCheck,
		unsavedIndicator: unsavedIndicator,
		warningDialog: warningDialog,
		blocklist: blocklist,
		allowlist: allowlist,
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
		warningDialog: true,
		blocklist: [],
		allowlist: [],
		menubackgroundcolor: "#1E90FF"
	}, function (items) {
		document.getElementById('spellCheck').checked = items.spellCheck;
		document.getElementById('unsavedIndicator').checked = items.unsavedIndicator;
		document.getElementById('warningDialog').checked = items.warningDialog;
		document.getElementById('blocklist').innerHTML = createListFromIdAndArray('block', items.blocklist);
		document.getElementById('allowlist').innerHTML = createListFromIdAndArray('allow', items.allowlist);
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
document.getElementById('warningDialog').addEventListener('click', toggleSwitch);
document.getElementById('reset').addEventListener('click', reset_options);
document.getElementById('allowadd').addEventListener('click', allowadd);
document.addEventListener('DOMNodeInserted', function (e) {
	var element = e.target || e.srcElement;
	element = element.lastChild;
	if (element == null) {
		return false;
	}
	if (element.className != null && element.className == 'remove') {
		element.addEventListener('click', remove);
	}
});
document.getElementById('blockadd').addEventListener('click', blockadd);

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
