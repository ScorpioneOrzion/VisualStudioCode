import { loadData, saveData, clearData } from "./encription.js";
import { createRoom, player, rooms, Key, removeKeyOrItems, addKeyOrItems } from "./data";

// create a function that can add document elements to the page
function addElement(element, parent, text) {
    let newElement = document.createElement(element);
    newElement.innerHTML = text;
    parent.appendChild(newElement);
    return newElement;
}

// create a function that can add an p element to the div with id "text" and add a reverence to the div
const textDiv = document.getElementById("text");
let allowScrollTop = false;
let allowScrollBottom = false;

function addText(text) {
    let element = addElement("p", textDiv, text);
    checkScroll();
    return element;
}

function checkScroll() {
    let textArray = textDiv.getElementsByTagName("p");
    allowScrollTop = false;
    allowScrollBottom = false;

    for (let i = 0; i < textArray.length; i++) {
        if (textArray[i].offsetTop + textArray[i].offsetHeight + textDiv.offsetTop > window.innerHeight) {
            allowScrollBottom = true;
        }

        if (textArray[i].offsetTop + textDiv.offsetTop < 0) {
            allowScrollTop = true;
        }
    }
}

window.addEventListener("wheel", function (e) {
    if (allowScrollBottom) {
        if (e.deltaY < 0) {
            textDiv.style.top = textDiv.offsetTop + e.deltaY + "px";
        }
    }
    if (allowScrollTop) {
        if (e.deltaY > 0) {
            textDiv.style.top = textDiv.offsetTop + e.deltaY + "px";
        }
    }
    checkScroll();
})

createRoom("Bedroom", "You are in a bedroom. There is a bed and a door to the north.", ["Hallway", "Bed"], ["Hallway", "Bed"]);
createRoom("Bed", "You are in a bed. Go to sleep?", ["Bedroom", "Dream"], ["No", "Yes"]);

function init() {
  player.currentRoom = "Bedroom";
  displayRoom()
}

init();

// create a function that displays where the player is
function displayRoom() {
    if (rooms[player.currentRoom].description === "") {
        let nextRoom = false;
        for (let i = 0; i < rooms[player.currentRoom].possibleLocations.length; i++) {
            if (rooms[player.currentRoom].possibleLocations[i].every(itemOrKey => {
                itemOrKey.isKey ? player.inventory.keys.includes(itemOrKey.name) : player.inventory.items.includes(itemOrKey.name) && (itemOrKey.min <= player.inventory[itemOrKey.name].amount && itemOrKey.max >= player.inventory[itemOrKey.name].amount);
            })) {
                for (const action of itemOrKey.actions) {
                    if (action.remove === true) {
                        removeKeyOrItems(...action.itemRemove);
                    }
                    if (action.add === true) {
                        addKeyOrItems(...action.itemAdd);
                    }
                }
                player.currentRoom = rooms[player.currentRoom].textForLocations[i];
                nextRoom = true;
                break;
            }
        }

        if (nextRoom) {
            displayRoom();
        } else {
            addText("You can't go there.");
        }
    } else {
        addText(rooms[player.currentRoom].description);
        // @type {Array<htmlElement>}
        let locations = [];
        if (rooms[player.currentRoom].textForLocations[0] === "No" || rooms[player.currentRoom].textForLocations[0] === "Yes") {
            locations.push(addText("&#160;&#160;&#160;No"));
            locations.push(addText("&#160;&#160;&#160;Yes"));
        } else {
            addText("You can go to:");
            for (let i = 0; i < rooms[player.currentRoom].possibleLocations.length; i++) {
                locations.push(addText("&#160;&#160;&#160;" + rooms[player.currentRoom].textForLocations[i]));
            }
        }

        for (let i = 0; i < locations.length; i++) {
            const func = function () {
                if (rooms[player.currentRoom].goto(rooms[player.currentRoom].possibleLocations[i])) {
                    for (let j = 0; j < locations.length; j++) {
                        if (locations[j] !== this) {
                            locations[j].parentNode.removeChild(locations[j]);
                        } else {
                            removeEventListener("click", func);
                        }
                    }
                    displayRoom();
                }
            }

            locations[i].addEventListener("click", func);
        }
    }
}
