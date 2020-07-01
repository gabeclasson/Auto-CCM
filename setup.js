var bodyChangeObserver = new MutationObserver(onBodyChange);
var studentPanelChangeObserver = new MutationObserver(onStudentPanelChange);
var tryItUpdatedObserver = new MutationObserver(onTryItUpdated);

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
				console.log(frame1);
				frame1.contentWindow.addEventListener('keyup', onDocumentKeyUp);
			}
		}
	});
}

function onDocumentKeyUp(e) {
	if (e.key == "'" && e.ctrlKey) {
		var win = e.target.ownerDocument.parentWindow || e.target.ownerDocument.defaultView;
		var selectedNodes = getSelectedNodes(win);
		for (var i = 0; i < selectedNodes.length; i++) {
			if (selectedNodes[i].classList != null && selectedNodes[i].classList.contains("Inline")) {
				selectedNodes[i].replaceWith(selectedNodes[i].textContent);
			}
		}
	}
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
