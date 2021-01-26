/*
Author: Gabe Classon
This script is injected into the CAS-ILE tab when it loads; it checks to see if the user has selected the "Courseware Classic" theme, and enables it if they have. 
*/
browser.runtime.sendMessage({
	className: "getUrl"
},
	function (url) {
	var linkElements = document.getElementsByTagName("link");
	for (var i = 0; i < linkElements.length; i++) {
		if (linkElements[i].rel == "stylesheet") {
			if (linkElements[i].href.includes("Mathable-all.css")) {
				linkElements[i].href = url + "classicTheme/ClassicMathable-all.css";
			}
			else if (linkElements[i].href.includes("Mathable.css")) {
				linkElements[i].href = url + "classicTheme/ClassicMathable.css";
			}
			else if (linkElements[i].href.includes("Icons.css")) {
				linkElements[i].href = url + "classicTheme/ClassicIcons.css";
			}
		}
	}
});
