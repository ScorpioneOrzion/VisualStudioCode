// gamePlay
const rooms = {};
const player = {
  currentRoom: "",
  inventory: {
    keys: [],
    items: []
  },
  hasKey: name => player.inventory.keys.some(key => key.name === name),
  hasItem: (name, amount) => player.inventory.items.some(item => item.name === name),
};

class Player {
  constructor(currentRoom, inventory) {
    this.currentRoom = currentRoom;
    this.inventory = inventory;
  }

  hasKey(name) {
    return this.inventory.keys.some(key => key.name === name);
  }

  hasItem(name, min, max) {
    return this.inventory.items.some(item => item.name === name && (item.amount >= min && item.amount <= max));
  }
}

class Collectable {
  constructor(name, description, value) {
    this.name = name;
    this.description = description;
    this.value = value;
  }

  get isKey() {
    return this instanceof Key;
  }
}
class Item extends Collectable {
  constructor(name, description, value) {
    super(name, description, value);
  }
}
class Key extends Collectable {
  constructor(name, description, value) {
    super(name, description, value);
  }
}

function addKeyOrItems(...itemOrKeys) {
  for (let i = 0; i < itemOrKeys.length; i++) {
    if (itemOrKeys[i] instanceof Key) {
      player.inventory.keys.push(itemOrKeys[i]);
    } else if (itemOrKeys[i] instanceof Item) {
      player.inventory.items.push(itemOrKeys[i]);
    }
  }
}
function removeKeyOrItems(...itemOrKeys) {
  for (let i = 0; i < itemOrKeys.length; i++) {
    if (itemOrKeys[i] instanceof Key) {
      player.inventory.keys.splice(player.inventory.keys.indexOf(itemOrKeys[i]), 1);
    } else if (itemOrKeys[i] instanceof Item) {
      player.inventory.items.splice(player.inventory.items.indexOf(itemOrKeys[i]), 1);
    }
  }
}

{// create a function that can create a room with a name, description and a list of possible locations it can go to
function createRoom(name, description, possibleLocations, textForLocations) {
  rooms[name] = {
    description: description,
    isCondition: false,
    possibleLocations: possibleLocations,
    textForLocations: textForLocations,
    goto: function (location) {
      if (this.possibleLocations.includes(location) && location !== this.currentRoom) {
        player.currentRoom = location;
        return true;
      } else {
        return false;
      }
    }
  };
}

// create a function that can create a room that checks if a certain condition is met
// it uses the same structure as the createRoom function
// with the following differences:
// description is ""
// possibleLocations is an array of items or keys
// for each item or key, if its an item, check if the player has the item and an amount between min and max
// if its instead a key, check if the player has the key
// each item or key has an amount of actions that are only executed if the condition is met for all items or keys
// the possible actions have the following structure:
//   remove: true/false
//   add: true/false
//   itemAdd: an array of items or keys
//   itemRemove: an array of items or keys
// if remove is true, remove all items or keys from the inventory listed in itemRemove
// if add is true, add all items or keys to the inventory listed in itemAdd
// then the player will be able to go to the next room or room condition placed in textForLocations
function createRoomCondition(name, possibleLocations, textForLocations) {
  rooms[name] = {
    description: "",
    isCondition: true,
    possibleLocations: possibleLocations,
    textForLocations: textForLocations,
    goto: function (location) {
      if (this.possibleLocations.every(itemOrKey => {
        if (itemOrKey.isKey) {
          return player.inventory.keys.includes(itemOrKey.name);
        } else {
          return player.inventory.items.includes(itemOrKey.name) && (itemOrKey.min <= player.inventory[itemOrKey.name].amount && itemOrKey.max >= player.inventory[itemOrKey.name].amount);
        }
      })) {
        for (const action of itemOrKey.actions) {
          if (action.remove === true) {
            removeKeyOrItems(...action.itemRemove);
          }
          if (action.add === true) {
            addKeyOrItems(...action.itemAdd);
          }
        }
        player.currentRoom = this.textForLocations[this.possibleLocations.indexOf(location)];
        return true;
      } else {
        return false;
      }
    }
  };
}}

// create a class that can be used by createRoom and createRoomCondition
// it has the following structure:
//   name: a string
//   description: a string
//   isCondition: true/false
//   possibleLocations: an array of items or keys if isCondition is true, else an array of rooms
//   textForLocations: an array of rooms if isCondition is true, else an array of strings
// the array of items or keys at possibleLocations has the following structure:
//   name: a string
//   isKey: true/false
//   min: an integer if isKey is false, else undefined
//   max: an integer if isKey is false, else undefined
//   actions: an array of actions
// the array of actions has the following structure:
//   remove: true/false
//   add: true/false
//   itemAdd: an array of items or keys if add is true, else undefined
//   itemRemove: an array of items or keys if remove is true, else undefined
// also check if the structure is correct
class Room {
  #check = (name, description, isCondition, possibleLocations, textForLocations) => {
    if (typeof name !== "string") {
      throw new Error("name is not a string");
    }
    if (typeof description !== "string") {
      throw new Error("description is not a string");
    }
    if (typeof isCondition !== "boolean") {
      throw new Error("isCondition is not a boolean");
    }
    if (!Array.isArray(possibleLocations)) {
      throw new Error("possibleLocations is not an array");
    }
    if (!Array.isArray(textForLocations)) {
      throw new Error("textForLocations is not an array");
    }
    if (isCondition) {
      if (possibleLocations.some(itemOrKey => !(itemOrKey instanceof Item || itemOrKey instanceof Key))) {
        throw new Error("possibleLocations contains an item or key that is not an Item or Key");
      }
      if (textForLocations.some(room => !(room instanceof Room))) {
        throw new Error("textForLocations contains a room that is not a Room");
      }
    } else {
      if (possibleLocations.some(room => !(room instanceof Room))) {
        throw new Error("possibleLocations contains a room that is not a Room");
      }
      if (textForLocations.some(string => typeof string !== "string")) {
        throw new Error("textForLocations contains a string that is not a string");
      }
    }
  }

  constructor(name, description, isCondition, possibleLocations, textForLocations) {
    this.#check(...arguments);
    this.name = name;
    this.description = description;
    this.isCondition = isCondition;
    this.possibleLocations = possibleLocations;
    this.textForLocations = textForLocations;
  }

  goto(location) {
    if (this.isCondition) {
      for (const itemOrKeys of this.possibleLocations) {
        itemOrKeys.every(itemOrKey => {
          if (itemOrKey.isKey) {
            return player.inventory.keys.includes(itemOrKey.name);
          } else {
            return player.inventory.items.includes(itemOrKey.name) && (itemOrKey.min <= player.inventory[itemOrKey.name].amount && itemOrKey.max >= player.inventory[itemOrKey.name].amount);
          }
        });
      }
    } else {

    }
  }

  display(addTextFunction) {
    if (this.isCondition) {

    } else {
      addTextFunction(this.description);
      let locations = [];
    }
  }
}
class Action {
  constructor(remove, add, itemAdd, itemRemove) {
    this.add = add;
    this.remove = remove;
    this.itemAdd = itemAdd;
    this.itemRemove = itemRemove;
  }
}

// export the above functions and variables
module.exports = {
  rooms: rooms,
  player: player,
  createRoom: createRoom,
  createRoomCondition: createRoomCondition,
  addKeyOrItems: addKeyOrItems,
  removeKeyOrItems: removeKeyOrItems,
  Key: Key,
  Item: Item,
};
