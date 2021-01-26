/*
Author: Gabe Classon
This script is injected into each Try-It when it loads; it checks to see if the user has selected the "Courseware Classic" theme, and enables it if they have. 
*/
browser.runtime.sendMessage({
	className: "getUrl"
},
	function (url) {
	var linkElements = document.getElementsByTagName("link");
	for (var i = 0; i < linkElements.length; i++) {
		if (linkElements[i].rel == "stylesheet") {
			if (linkElements[i].href.includes("NotebookPage.aspx/css")) {
				linkElements[i].href = url + "classicTheme/ClassicCss.css";
			}
		}
	}
	var buttonTexts = document.querySelectorAll("button.x-btn-text > p");
	for (var i = 0; i < buttonTexts.length; i++) {
		if (buttonTexts[i].style.color == "white") {
			buttonTexts[i].style.color = "#333";
		}
	}
});
