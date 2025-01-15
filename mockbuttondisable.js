/*
Author: Gabe Classon
This script is injected into the CAS-ILE tab; it disables the "mock close button" (a mock button that appear over the close button when a user has unsaved changes; if the user clicks the mock button, it asks them to confirm their selection to prevent lost work).
*/
console.log("mockbuttondisable.js injected");
var allStudentPanels = document.querySelectorAll(("[id^=coursepanel][id$=body]"));
var activePanel;
for (var k = 0; k < allStudentPanels.length; k++) {
	if (allStudentPanels[k].parentElement.classList.contains("x-hide-offsets")) {
		continue;
	} else {
		activePanel = allStudentPanels[k];
		break;
	}
}
var mockButton = activePanel.getElementsByClassName("x-tab-active")[0].querySelector("[id=mockButton]");
mockButton.style.visibility = "hidden";
