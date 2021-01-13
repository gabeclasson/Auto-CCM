console.log("mockbuttonenable.js injected");
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
mockButton.style.visibility = "visible";
