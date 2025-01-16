window.addEventListener("beforeunload", function (e) {
    console.log(tabsWithUnsavedWork)
    if (suppressClosingDialogWindow || (smartClosingDialog && tabsWithUnsavedWork.length <= 0)) {
		e.stopImmediatePropagation();
	}
});