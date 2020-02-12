// ==UserScript==
// @name         GetGPA-WHU
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Calc the GPA in WHU.
// @author       iCrystal: leopard.c@outlook.com
// @match        http://bkjw.whu.edu.cn/stu/stu_index.jsp
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /****************************
    ** Global Variable
    ****************************/
    var TYPE_ALL = 0;
    var TYPE_MINOR = -1;
    var TYPE_MAJOR = 1;
    var TYPE_PUBLIC = 1 << 1;
    var TYPE_COMPULSORY = 1 << 2;
    var TYPE_SELECTIVE = 1 << 3;

    var courses = [];

    /*****************************************************
    ** Function: transfer courseType string to TYPE_xxx
    ******************************************************/
    function stringToType(str) {
        var type = 0;
        if (str.indexOf('专业') > -1) {
            type += TYPE_MAJOR;
        }
        else {
            type += TYPE_PUBLIC;
        }
        if (str.indexOf('必修') > -1) {
            type += TYPE_COMPULSORY;
        }
        else {
            type += TYPE_SELECTIVE;
        }
        return type;
    }


    /*************************
     **  class: Course
    *************************/
    function Course() {
        this.name = "";
        this.type = 0;
        this.credit = 1.0;
        this.teacher = "";
        this.teachingCollege = "";
        this.studyType = 0;
        this.year = 2017;
        this.semester = 1;
        this.score = 100;
    };

    /*****************************************************
    ** Function:  Calculate the GPA of the score
    ******************************************************/
    function calcGPA(score) {
        if (score >= 90) { return 4.0; }
        else if (score >= 85) { return 3.7; }
        else if (score >= 82) { return 3.3; }
        else if (score >= 78) { return 3.0; }
        else if (score >= 75) { return 2.7; }
        else if (score >= 72) { return 2.3; }
        else if (score >= 68) { return 2.0; }
        else if (score >= 64) { return 1.5; }
        else if (score >= 60) { return 1.0; }
        else { return 0.0; }
    }

    /****************************************************************
    ** Function:  Calculate the average GPA of some special courses
    ****************************************************************/
    function calcAverageGPA(coursesArray) {
        var GPA = 0.0;
        var credits = 0.0;
        for (var i = 0; i < coursesArray.length; ++i) {
            var course = coursesArray[i];
            credits += parseFloat(course.credit);
            GPA += calcGPA(course.score) * course.credit;
        }
        return (GPA / credits).toFixed(2);
    }


    /****************************************************************
    ** Function:  Get the required courses
    ****************************************************************/
    function getCourses(year, semester, courseType, studyType) {
        studyType = studyType || TYPE_MAJOR;
        var retCourses = [];
        for (var i = 0; i < courses.length; ++i) {
            if (courses[i].studyType == studyType && (!year || courses[i].year == year)) {
                if (!semester || semester == 0 || courses[i].semester == semester) {
                    var course = courses[i];
                    var type = course.type;
                    if (!courseType || courseType == TYPE_ALL) {
                        retCourses.push(course);
                    }
                    else if (courseType == TYPE_MAJOR && (type & TYPE_MAJOR))  {
                        retCourses.push(course);
                    }
                    else if (courseType == TYPE_PUBLIC && (type & TYPE_PUBLIC)) {
                        retCourses.push(course);
                    }
                    else if (courseType == TYPE_COMPULSORY && (type & TYPE_COMPULSORY)) {
                        retCourses.push(course);
                    }
                    else if (courseType == TYPE_SELECTIVE && (type & TYPE_SELECTIVE)) {
                        retCourses.push(course);
                    }
                    else if (type == courseType) {
                        retCourses.push(course);
                    }
                }
            }
        }

        //console.log(retCourses);
        return retCourses;
    }

    /****************************************************************
    ** Function:  Get the GPA of required courses
    ****************************************************************/
    function getGPA(year, semester, courseType, studyType) {
        var semCourses = getCourses(year, semester, courseType, studyType);
        var GPA = calcAverageGPA(semCourses);
        return GPA;
    }


    // After all resouces are loaded
    window.onload = function(){
        // 添加按钮
        var button = document.createElement('input');
        var topBar = document.getElementById('top');
        //var logoTag = document.getElementById('system');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'GetGPA');
        button.style.width = "60px";
        button.style.height = "25px";
        button.style.align = "left"
        button.style.backgroundColor = "#b46300";
        button.style.color = "white";
        topBar.appendChild(button);

        // 点击按钮的事件
        button.onclick = function(){
            var page_iframe=document.getElementsByTagName('iframe')["page_iframe"]
            var doc1=page_iframe.contentWindow.document
            var iframe0=doc1.getElementById('iframe0')
            var doc2=iframe0.contentWindow.document
            var tableList=doc2.getElementsByClassName('table listTable')[0];
            var rows = tableList.rows;
            courses = [];

            for (var i = 1; i < rows.length; ++i) {
                var cells = rows[i].cells;
                // The cells[10] is the score
                // If it is null, the score haven't come out yet
                // Just ignore the course
                if (cells[10].innerText == "") {
                    continue;
                }
                var course = new Course();
                course.name = cells[0].innerText;
                course.type = stringToType(cells[1].innerText);
                course.credit = cells[4].innerText;
                course.teacher = cells[5].innerText;
                course.teachingCollege = cells[6].innerText;
                course.studyType = cells[7].innerText == '普通' ? TYPE_MAJOR : TYPE_MINOR;
                course.year = cells[8].innerText;
                course.semester = cells[9].innerText;
                course.score = cells[10].innerText;
                courses.push(course);
            }

            var years = [];
            for (i = 0; i < courses.length; ++i) {
                if (!years.includes(courses[i].year)) {
                    years.push(courses[i].year);
                }
            }
            years.sort();

            var result = "";
            for (i = 0; i < years.length; ++i) {
                var year = years[i];
                var nextYear = parseInt(year) + 1;
                result += "******** Year" + year + "-" + nextYear + " ********";
                result += "\n平均: " + getGPA(year, 0, TYPE_ALL);
                result += "\n专业: " + getGPA(year, 0, TYPE_MAJOR);
                result += "      公共: " + getGPA(year, 0, TYPE_PUBLIC);
                result += "\n专业必修: " + getGPA(year, 0, TYPE_MAJOR | TYPE_COMPULSORY);
                result += "  公共必修: " + getGPA(year, 0, TYPE_PUBLIC | TYPE_COMPULSORY);
                result += "\n专业选修: " + getGPA(year, 0, TYPE_MAJOR | TYPE_SELECTIVE);
                result += "  公共选修: " + getGPA(year, 0, TYPE_PUBLIC | TYPE_SELECTIVE);
                result += "\n"
            }

            result += "************** Total ******************";
            result += "\n平均: " + getGPA(null, 0, TYPE_ALL);
            result += "\n专业: " + getGPA(null, 0, TYPE_MAJOR);
            result += "      公共: " + getGPA(null, 0, TYPE_PUBLIC);
            result += "\n专业必修: " + getGPA(null, 0, TYPE_MAJOR | TYPE_COMPULSORY);
            result += "  公共必修: " + getGPA(null, 0, TYPE_PUBLIC | TYPE_COMPULSORY);
            result += "\n专业选修: " + getGPA(null, 0, TYPE_MAJOR | TYPE_SELECTIVE);
            result += "  公共选修: " + getGPA(null, 0, TYPE_PUBLIC | TYPE_SELECTIVE);

            //console.log(result);
            alert(result);
        };
    };

})();


