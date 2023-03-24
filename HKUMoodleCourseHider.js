// ==UserScript==
// @name         HKU Moodle Course Hider
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  Hide or show courses in the My Courses page on HKU Moodle. Feel free to modify for other Moodle pages.
// @author       hoverGecko
// @match        *://moodle.hku.hk/
// @match        *://moodle.hku.hk/index.php
// @match        *://moodle.hku.hk/?redirect=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hku.hk
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==
(function () {
    'use strict';
    const ScriptName = "HKU_Moodle_Course_Hider";
    const HiddenCourseNamesGMValName = ScriptName + "_hiddenCourseNamesJsonArray";

    function getCourseName(courseElm) {
        var _a;
        var courseName = (_a = courseElm.querySelector("a")) === null || _a === void 0 ? void 0 : _a.textContent;
        if (!courseName) console.warning(`${ScriptName}: ${courseElm} has no courseName.`);
        return courseName ? courseName : "";
    }
    function getCourseNameToElementMap(courseElms) {
        var m = new Map();
        courseElms.forEach(function (courseElm) {
            var courseName = getCourseName(courseElm);
            if (courseName) {
                m.set(courseName, courseElm);
            }
        });
        return m;
    }

    function hideCourse(courseElm) {
        if (courseElm) {
            courseElm.style.display = "none";
        }
    }
    function showCourse(courseElm) {
        if (courseElm) {
            courseElm.style.display = "";
        }
    }
    function setGMHiddenCourses(hiddenCourseNames) {
        GM.setValue(HiddenCourseNamesGMValName, JSON.stringify([...hiddenCourseNames]));
    }
    function updateCourseDisplay(courseElm, hiddenCourseNames, isShow) {
        const courseName = getCourseName(courseElm);
        if (isShow) {
            showCourse(courseElm);
            hiddenCourseNames.delete(courseName);
        } else {
            hideCourse(courseElm);
            hiddenCourseNames.add(courseName);
        }
        setGMHiddenCourses(hiddenCourseNames);
    }

    function refreshCoursesDisplay(courseElms, hiddenCourseNames) {
        for (const course of courseElms) {
            var courseName = getCourseName(course);
            updateCourseDisplay(course, hiddenCourseNames, !(courseName && hiddenCourseNames.has(courseName)));
        };
    }

    function courseCheckboxListener(courseElm, hiddenCourseNames, event) {
        updateCourseDisplay(courseElm, hiddenCourseNames, event.currentTarget.checked);
    }
    function selectAll(courseElms, menuListElm, hiddenCourseNames, isSelectOrDeselect) {
        for (const course of courseElms) {
            updateCourseDisplay(course, hiddenCourseNames, isSelectOrDeselect);
        }
        for (const menuCourseCheckboxElm of menuListElm.querySelectorAll("input")) {
            menuCourseCheckboxElm.checked = isSelectOrDeselect;
        }
    }
    function buildMenu(courseElms, hiddenCourseNames) {
        const menuElm = document.createElement("div");
        menuElm.style = "position: relative; float: right; ";

        const menuButtonElm = document.createElement("button");
        menuButtonElm.innerHTML = "Manage list";
        menuButtonElm.style =
            "font-size: 1rem; padding: 5px 1rem; margin: 0; background-color: #00B48D; "
        menuElm.appendChild(menuButtonElm);

        const menuListElm = document.createElement("div");
        menuElm.append(menuListElm);
        menuListElm.id = `${ScriptName}_menuListElm`;
        menuListElm.style =
            "display: none; flex-direction: column; position: absolute; " +
            "background-color: lightblue; padding-bottom: 0; right: 0; " +
            "box-shadow: 1.5px 1.5px 2px gray; padding: 5px 5px 0 5px; max-width: min(80vw, 30rem); z-index: 2;";
        menuButtonElm.addEventListener("click", () => {
            if (menuListElm.style.display === "none") {
                menuListElm.style.display = "flex";
            } else {
                menuListElm.style.display = "none";
            }
        });
        // click anywhere but the menu element to close the menu
        document.body.addEventListener("click", () => {
            if (menuListElm.style.display !== "none") {
                menuListElm.style.display = "none";
            }
        }, false);
        menuElm.addEventListener("click", event => {
            event.stopPropagation();
        }, false);

        const selectDeselectAllButtons = document.createElement("div");
        menuListElm.append(selectDeselectAllButtons);
        selectDeselectAllButtons.style = "display: flex; width: 100%; justify-content: space-around;";

        const selectAllButton = document.createElement("button");
        selectDeselectAllButtons.append(selectAllButton);
        selectAllButton.style =
            "width: 49%; font-size: 1rem; padding: 5px 1rem; margin: 0; margin-bottom: 10px; margin-right: 5px;";
        selectAllButton.appendChild(document.createTextNode("Select all"));
        selectAllButton.addEventListener("click", () => selectAll(courseElms, menuListElm, hiddenCourseNames, true));

        const deselectAllButton = document.createElement("button");
        selectDeselectAllButtons.append(deselectAllButton);
        deselectAllButton.style =
            "width: 49%; background-color: red; font-size: 1rem; padding: 5px 1rem; margin: 0; margin-bottom: 10px;";
        deselectAllButton.appendChild(document.createTextNode("Deselect all"));
        deselectAllButton.addEventListener("click", () => selectAll(courseElms, menuListElm, hiddenCourseNames, false));


        const courseNameElmMap = getCourseNameToElementMap(courseElms);
        for (const course of courseElms) {
            const courseName = getCourseName(course);

            const menuCourseElm = document.createElement("label");
            menuListElm.appendChild(menuCourseElm);
            menuCourseElm.class = `${ScriptName}_menuCourseElm`
            const checkboxID = `${ScriptName}_${courseName}`;
            menuCourseElm.for = checkboxID;
            menuCourseElm.style = "width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 10px;";

            const menuCourseCheckboxElm = document.createElement("input");
            menuCourseElm.appendChild(menuCourseCheckboxElm);
            menuCourseElm.appendChild(document.createTextNode(courseName));
            if (!hiddenCourseNames.has(getCourseName(course))) menuCourseCheckboxElm.checked = "true";
            menuCourseCheckboxElm.type = "checkbox";
            menuCourseCheckboxElm.id = checkboxID;

            menuCourseCheckboxElm.addEventListener(
                "change",
                event => courseCheckboxListener(courseNameElmMap.get(courseName), hiddenCourseNames, event)
            );
        }

        return menuElm;
    }

    async function main() {
        if (!document.getElementsByClassName("courses frontpage-course-list-enrolled")) {
            console.error("Tampermonkey script Moodle course hider: Cannot find courseListElems");
            return;
        }

        let hiddenCoursesString = await GM.getValue(HiddenCourseNamesGMValName);
        let hiddenCourseNames = new Set();
        if (hiddenCoursesString) hiddenCourseNames = new Set(JSON.parse(hiddenCoursesString));

        const courseListElem = document.getElementsByClassName("courses frontpage-course-list-enrolled")[0];
        const courseElms = courseListElem.querySelectorAll("div.coursebox");

        refreshCoursesDisplay(courseElms, hiddenCourseNames);
        const myCoursesTitleElm = document.getElementById("frontpage-course-list").firstChild;
        const menuElm = buildMenu(courseElms, hiddenCourseNames);
        myCoursesTitleElm.appendChild(menuElm);
    }

    main();
})();