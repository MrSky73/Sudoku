// grid variable
var table;

// game number
var gameId = 0;

// puzzle grid
var puzzle = [];

// solution grid
var solution = [];

// remaining number counts
var remaining = [9, 9, 9, 9, 9, 9, 9, 9, 9];



// stopwatch timer variables
var timer = 0;
var pauseTimer = false;
var intervalId;
var gameOn = false;

function newGame(difficulty) {

    // get random position for numbers from '1' to '9' to generate a random puzzle
    var grid = getGridInit();

    // prepare rows, columns and blocks to solove the initioaled grid
    var rows = grid;
    var cols = getColumns(grid);
    var blks = getBlocks(grid);

    //          solve the grid section
    // generate allowed digits for each cell
    var psNum = generatePossibleNumber(rows, cols, blks);

    // solve the grid
    solution = solveGrid(psNum, rows, true);

    // reset the game state timer and remaining number
    timer = 0;
    for (var i in remaining)
        remaining[i] = 9;

    // empty cells from grid depend on difficulty
    // for now it will be:
    // 59 empty cells for very easy
    // 64 empty cells for easy
    // 69 empty cells for normal
    // 74 empty cells for hard
    // 79 empty cells for expert
    puzzle = makeItPuzzle(solution, difficulty);

    // game is on when the difficulty = [0, 4]
    gameOn = difficulty < 5 && difficulty >= 0;

    // update the UI
    ViewPuzzle(puzzle);
    updateRemainingTable();

    // finally, start the timer
    if (gameOn)
        startTimer();
}

function getGridInit() {
    var rand = [];
    // for each digits from 1 to 9 find a random row and column
    for (var i = 1; i <= 9; i++) {
        var row = Math.floor(Math.random() * 9);
        var col = Math.floor(Math.random() * 9);
        var accept = true;
        for (var j = 0; j < rand.length; j++) {

            // if number exist or there is a number already located in then ignore and try again
            if (rand[j][0] == i | (rand[j][1] == row & rand[j][2] == col)) {
                accept = false;

                // try to get a new position for this number
                i--;
                break;
            }
        }
        if (accept) {
            rand.push([i, row, col]);
        }
    }

    // initialize new empty grid
    var result = [];
    for (var i = 0; i < 9; i++) {
        var row = "000000000";
        result.push(row);
    }

    // put numbers in the grid
    for (var i = 0; i < rand.length; i++) {
        result[rand[i][1]] = replaceCharAt(result[rand[i][1]], rand[i][2], rand[i][0]);
    }

    return result;
}

// return columns from a row grid
function getColumns(grid) {
    var result = ["", "", "", "", "", "", "", "", ""];
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++)
            result[j] += grid[i][j];
    }
    return result;
}

// return blocks from a row grid
function getBlocks(grid) {
    var result = ["", "", "", "", "", "", "", "", ""];
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++)
            result[Math.floor(i / 3) * 3 + Math.floor(j / 3)] += grid[i][j];
    }
    return result;
}

// function to replace char in string
function replaceCharAt(string, index, char) {
    if (index > string.length - 1) return string;
    return string.substr(0, index) + char + string.substr(index + 1);
}

// get allowed numbers that can be placed in each cell
function generatePossibleNumber(rows, columns, blocks) {
    var psb = [];

    // for each cell get numbers that are not viewed in a row, column or block
    // if the cell is not empty then, allowed number is the number already exist in it
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            psb[i * 9 + j] = "";
            if (rows[i][j] != 0) {
                psb[i * 9 + j] += rows[i][j];
            } else {
                for (var k = '1'; k <= '9'; k++) {
                    if (!rows[i].includes(k))
                        if (!columns[j].includes(k))
                            if (!blocks[Math.floor(i / 3) * 3 + Math.floor(j / 3)].includes(k))
                                psb[i * 9 + j] += k;
                }
            }
        }
    }
    return psb;
}

function solveGrid(possibleNumber, rows, startFromZero) {
    var solution = [];

    // solve Sudoku with a backtracking algorithm
    // Steps are:
    //  1.  get all allowed numbers that fit in each empty cell
    //  2.  generate all possible rows that fit in the first row depend on the allowed number list
    //` 3.  select one row from possible row list and put it in the first row
    //  4.  go to next row and find all possible number that fit in each cell
    //  5.  generate all possible row fit in this row then go to step 3 until reach the last row or there aren't any possible rows left
    //  6.  if next row hasn't any possible left then go the previous row and try the next possibility from possibility rows' list
    //  7.  if the last row has reached and a row fit in it has found then the grid has solved

    var result = nextStep(0, possibleNumber, rows, solution, startFromZero);
    if (result == 1)
        return solution;
}

// level is current row number in the grid
function nextStep(level, possibleNumber, rows, solution, startFromZero) {
    // get possible number fit in each cell in this row
    var x = possibleNumber.slice(level * 9, (level + 1) * 9);

    // generate possible numbers sequence that fit in the current row
    var y = generatePossibleRows(x);
    if (y.length == 0)
        return 0;

    // to allow check is solution is unique
    var start = startFromZero ? 0 : y.length - 1;
    var stop = startFromZero ? y.length - 1 : 0;
    var step = startFromZero ? 1 : -1;
    var condition = startFromZero ? (start <= stop) : (start >= stop);

    // try every numbers sequence in this list and go to next row
    for (var num = start; condition; num += step) {
        var condition = startFromZero ? (num + step <= stop) : (num + step >= stop);
        for (var i = level + 1; i < 9; i++)
            solution[i] = rows[i];
        solution[level] = y[num];
        if (level < 8) {
            /*if (solution[4] === undefined) {
                var x = 0;
                x++;
            }*/
            var cols = getColumns(solution);
            var blocks = getBlocks(solution);

            var poss = generatePossibleNumber(solution, cols, blocks);
            if (nextStep(level + 1, poss, rows, solution, startFromZero) == 1)
                return 1;
        }
        if (level == 8)
            return 1;
    }
    return -1;
}

// generate possible numbers sequence that fit in the current row
function generatePossibleRows(possibleNumber) {
    var result = [];

    function step(level, PossibleRow) {
        if (level == 9) {
            result.push(PossibleRow);
            return;
        }

        for (var i in possibleNumber[level]) {
            if (PossibleRow.includes(possibleNumber[level][i]))
                continue;
            step(level + 1, PossibleRow + possibleNumber[level][i]);
        }
    }

    step(0, "");

    return result;
}

// empty cell from grid depends on the difficulty to make the puzzle
function makeItPuzzle(grid, difficulty) {
    /*
        difficulty:
        // expert   : 0;
        // hard     : 1;
        // Normal   : 2;
        // easy     : 3;
        // very easy: 4;
    */


    // so the puzzle is showen as solved grid
    if (!(difficulty < 5 && difficulty > -1))
        difficulty = 13;
    var remainedValues = 81;
    var puzzle = grid.slice(0);

    // function to remove value from a cell and its symmetry then return remained values
    function clearValue(grid, x, y, remainedValues) {
        function getSymmetry(x, y) {
            var symX = 8 - x;  //Symmetry
            var symY = 8 - y;
            return [symX, symY];
        }
        var sym = getSymmetry(x, y);
        if (grid[y][x] != 0) {
            grid[y] = replaceCharAt(grid[y], x, "0")
            remainedValues--;
            if (x != sym[0] && y != sym[1]) {
                grid[sym[1]] = replaceCharAt(grid[sym[1]], sym[0], "0")
                remainedValues--;
            }
        }
        return remainedValues;
    }

    // remove value from a cell and its symmetry to reach the expected empty cells amount
    while (remainedValues > (difficulty * 5 + 20)) {
        var x = Math.floor(Math.random() * 9);
        var y = Math.floor(Math.random() * 9);
        remainedValues = clearValue(puzzle, x, y, remainedValues);
    }
    return puzzle;
}

// view grid in html page
function ViewPuzzle(grid) {
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            var input = table.rows[i].cells[j].getElementsByTagName('input')[0];
            addClassToCell(table.rows[i].cells[j].getElementsByTagName('input')[0]);
            if (grid[i][j] == "0") {
                input.disabled = false;
                input.value = "";
            }
            else {
                input.disabled = true;
                input.value = grid[i][j];
                remaining[grid[i][j] - 1]--;
            }
        }
    }
}

// read current grid
function readInput() {
    var result = [];
    for (var i = 0; i < 9; i++) {
        result.push("");
        for (var j = 0; j < 9; j++) {
            var input = table.rows[i].cells[j].getElementsByTagName('input')[0];
            if (input.value == "" || input.value.length > 1 || input.value == "0") {
                input.value = ""
                result[i] += "0";
            }
            else
                result[i] += input.value;
        }
    }
    return result;
}

// check value if it is correct or wrong
// return:
//  0 for value can't be changed
//  1 for correct value
//  2 for value that hasn't any conflict with other values
//  3 for value that conflict with value in its row, column or block
//  4 for incorect input
function checkValue(value, row, column, block, defaultValue, currectValue) {
    if (value === "" || value === '0')
        return 0;
    if (!(value > '0' && value < ':'))
        return 4;
    if (value === defaultValue)
        return 0;
    if ((row.indexOf(value) != row.lastIndexOf(value))
        || (column.indexOf(value) != column.lastIndexOf(value))
        || (block.indexOf(value) != block.lastIndexOf(value))) {
        return 3;
    }
    if (value !== currectValue)
        return 2;
    return 1;
}

// remove old class from input and add a new class to represent current cell's state
function addClassToCell(input, className) {
    // remove old class from input
    input.classList.remove("right-cell");
    input.classList.remove("worning-cell");
    input.classList.remove("wrong-cell");

    if (className != undefined)
        input.classList.add(className);
}

// update value of remaining numbers in html page
function updateRemainingTable() {
    for (var i = 1; i < 10; i++) {
        var item = document.getElementById("remain-" + i);
        item.innerText = remaining[i - 1];
        item.classList.remove("red");
        item.classList.remove("gray");
        if (remaining[i - 1] === 0)
            item.classList.add("gray");
        else if (remaining[i - 1] < 0 || remaining[i - 1] > 9)
            item.classList.add("red");
    }
}

// start stopwatch timer
function startTimer() {
    var timerDiv = document.getElementById("timer");
    clearInterval(intervalId);

    // update stopwatch value every one second
    pauseTimer = false;
    intervalId = setInterval(function () {
        if (!pauseTimer) {
            timer++;
            var min = Math.floor(timer / 60);
            var sec = timer % 60;
            timerDiv.innerText = (("" + min).length < 2 ? ("0" + min) : min) + ":" + (("" + sec).length < 2 ? ("0" + sec) : sec);
        }
    }, 1000);
}


// UI Comunication functions

// function that must run when document loaded
window.onload = function () {

    // assigne table to its value
    table = document.getElementById("puzzle-grid");
    // add ripple effect to all buttons in layout
    var rippleButtons = document.getElementsByClassName("button");
    for (var i = 0; i < rippleButtons.length; i++) {
        rippleButtons[i].onmousedown = function (e) {
            // get ripple effect's position depend on mouse and button position
            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;

            // add div that represents the ripple
            var rippleItem = document.createElement("div");
            rippleItem.classList.add('ripple');
            rippleItem.setAttribute("style", "left: " + x + "px; top: " + y + "px");

            // if ripple item should have special color... get and apply it
            var rippleColor = this.getAttribute('ripple-color');
            if (rippleColor)
                rippleItem.style.background = rippleColor;
            this.appendChild(rippleItem);

            // set timer to remove the dif after the effect ends
            setTimeout(function () {
                rippleItem.parentElement.removeChild(rippleItem);
            }, 1500);
        };
    }
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            var input = table.rows[i].cells[j].getElementsByTagName('input')[0];

            // add function to remove color from cells and update remaining numbers table when it get changed
            input.onchange = function () {

                //remove color from cell
                addClassToCell(this);

                // check if the new value entered is allowed
                function checkInput(input) {
                    if (input.value[0] < '1' || input.value[0] > '9') {
                        if (input.value != "?" && input.value != "؟") {
                            input.value = "";
                            alert("only numbers [1-9] and question mark '?' are allowed!!");
                            input.focus()
                        }
                    }
                }
                checkInput(this);

                // compare old value and new value then update remaining numbers table
                if (this.value > 0 && this.value < 10)
                    remaining[this.value - 1]--;
                if (this.oldvalue !== "") {
                    if (this.oldvalue > 0 && this.oldvalue < 10)
                        remaining[this.oldvalue - 1]++;
                }

                //reset canSolved value when change any cell
                canSolved = true;

                updateRemainingTable();
            };

            //change cell 'old value' when it got focused to track numbers and changes on grid
            input.onfocus = function () {
                this.oldvalue = this.value;
            };
        }
    }
}




// start new game
function startGameButtonClick() {
    var difficulties = document.getElementsByName('difficulty');
    // difficulty:
    //  0 expert
    //  1 hard
    //  2 normal
    //  3 easy
    //  4 very easy
    //  5 solved

    // initial difficulty to 5 (solved)
    var difficulty = 5;

    // get difficulty value
    for (var i = 0; i < difficulties.length; i++) {
        if (difficulties[i].checked) {
            newGame(4 - i);
            difficulty = i;
            break;
        }
    }
    if (difficulty > 4)
        newGame(5);

    hideDialogButtonClick('dialog');
    gameId++;
    document.getElementById("game-number").innerText = "game #" + gameId;


    // hide solver buttons
    // show other buttons

    document.getElementById("pause-btn").style.display = "block";
    document.getElementById("check-btn").style.display = "block";



    // prerpare view for new game
    document.getElementById("timer-label").innerText = "Time";
    document.getElementById("timer").innerText = "00:00";
    document.getElementById("game-difficulty-label").innerText = "Game difficulty";


    document.getElementById("game-difficulty").innerText = difficulty < difficulties.length ? difficulties[difficulty].value : "solved";
}

// pause \ continue button click function
function pauseGameButtonClick() {
    var icon = document.getElementById("pause-icon");
    var label = document.getElementById("pause-text");

    // change icon and label of the button and hide or show the grid
    if (pauseTimer) {
        icon.innerText = "pause";
        label.innerText = "Pause";
        table.style.opacity = 1;
    }
    else {
        icon.innerText = "play_arrow";
        label.innerText = "Continue";
        table.style.opacity = 0;
    }

    pauseTimer = !pauseTimer;
}

// check grid if correct
function checkButtonClick() {

    // check if game is started
    if (gameOn) {

        // add one minute to the stopwatch as a cost of grid's check
        timer += 30;
        var currentGrid = [];

        // read gritd status
        currentGrid = readInput();

        var columns = getColumns(currentGrid);
        var blocks = getBlocks(currentGrid);

        var errors = 0;
        var currects = 0;

        for (var i = 0; i < currentGrid.length; i++) {
            for (var j = 0; j < currentGrid[i].length; j++) {
                if (currentGrid[i][j] == "0")
                    continue;

                // check value if it is correct or wrong
                var result = checkValue(currentGrid[i][j], currentGrid[i], columns[j], blocks[Math.floor(i / 3) * 3 + Math.floor(j / 3)], puzzle[i][j], solution[i][j]);

                // remove old class from input and add a new class to represent current cell's state
                addClassToCell(table.rows[i].cells[j].getElementsByTagName('input')[0], result === 1 ? "right-cell" : (result === 2 ? "worning-cell" : (result === 3 ? "wrong-cell" : undefined)));

                if (result === 1 || result === 0) {
                    currects++;
                } else if (result === 3) {
                    errors++;
                }
            }
        }

        // if all values are correct and they equal original values then game over and the puzzle has been solved
        // if all values are correct and they aren't equal original values then game over but the puzzle has not been solved yet
        if (currects === 81) {
            gameOn = false;
            pauseTimer = true;
            document.getElementById("game-difficulty").innerText = "Solved";
            clearInterval(intervalId);
            alert("Congrats, You solved it.");
        } else if (errors === 0 && currects === 0) {
            alert("Congrats, You solved it, but this is not the solution that I want.");
        }
    }
}



function showDialogClick(dialogId) {
    // to hide navigation bar if it opened
    // hideHamburgerClick();

    var dialog = document.getElementById(dialogId);
    var dialogBox = document.getElementById(dialogId + "-box");
    dialogBox.focus();
    dialog.style.opacity = 0;
    dialogBox.style.marginTop = "-500px";
    dialog.style.display = "block";
    dialog.style.visibility = "visible";

    // to view and move the dialog to the correct position after it set visible
    setTimeout(function () {
        dialog.style.opacity = 1;
        dialogBox.style.marginTop = "64px";
    }, 200);
}



function hideDialogButtonClick(dialogId) {
    var dialog = document.getElementById(dialogId);
    var dialogBox = document.getElementById(dialogId + "-box");
    dialog.style.opacity = 0;
    dialogBox.style.marginTop = "-500px";

    setTimeout(function () {
        dialog.style.visibility = "collapse";
        //dialog.style.display = "none";
    }, 500);
}

function viewMenu(){
  {
  var view = document.getElementById("dropdown");
  if (view.style.display === "block") {
    view.style.display = "none";
  } else {
    view.style.display = "block";
  }
}
}
