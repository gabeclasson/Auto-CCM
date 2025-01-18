window.addEventListener("beforeunload", function (e) {
    console.log(tabsWithUnsavedWork)
    if (suppressClosingDialogWindow || (smartClosingDialog && isSiteAllSaved())) {
		e.stopImmediatePropagation();
	}
});