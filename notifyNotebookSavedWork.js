/*
Author: Gabe Classon
This script is injected into the CAS-ILE tab, notifying as to whether the tab has unsaved work. This information is used to suppress the "Are you sure you want to leave?" dialog when there is no unsaved work. 
*/
console.log("notifyNotebookSavedWork.js injected");
let index = tabsWithUnsavedWork.indexOf(activeTab().id); 
tabsWithUnsavedWork.splice(index, 1); 
