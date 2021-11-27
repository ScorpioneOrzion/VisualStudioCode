// gamePlay

/** @type {Map<string, (Room | Condition)>} */
const rooms = new Map();
const player = new Player();

class Inventory {
  constructor(keys, items) {
    this.keys = Array.isArray(keys) ? keys : [];
    this.items = Array.isArray(items) ? items : [];
  }

  addKey(key) {
    this.keys.push(key);
  }

  addItem(item) {
    this.items.push(item);
  }

  removeKey(key) {
    this.keys = this.keys.filter(k => k.name !== key.name);
  }

  removeItem(item) {
    this.items = this.items.filter(i => i.name !== item.name);
  }

  hasKey(name) {
    return this.keys.some(key => key.name === name);
  }

  hasItem(name, min, max) {
    return this.items.some(item => item.name === name && item.amount >= min && item.amount <= max);
  }
}

class Player {
  constructor(currentRoom = "", inventory = new Inventory()) {
    this.currentRoom = currentRoom;
    if (inventory instanceof Inventory) {
      this.inventory = inventory;
    } else {
      this.inventory = new Inventory(inventory.keys, inventory.items);
    }
  }

  save() {
    return {
      currentRoom: this.currentRoom,
      inventory: {
        keys: this.inventory.keys.map(key => key.name),
        items: this.inventory.items.map(item => { return { name: item.name, amount: item.amount } })
      }
    };
  }

  hasKey(name) {
    return this.inventory.hasKey(name);
  }

  hasItem(name, min, max) {
    return this.inventory.hasItem(name, min, max);
  }

  save() {
    return {
      currentRoom: this.currentRoom,
      inventory: this.inventory.save(),
    };
  }
}

class Inventory {
  constructor(keys, items) {
    if (Array.isArray(keys)) {
      this.keys = keys;
    } else if (keys) {
      this.keys = [keys];
    } else {
      this.keys = [];
    }

    if (Array.isArray(items)) {
      this.items = items;
    } else if (items) {
      this.items = [items];
    } else {
      this.items = [];
    }
  }

  save() {
    return {
      keys: this.keys.map(key => key.save()),
      items: this.items.map(item => item.save()),
    };
  }

  addKey(key) {
    this.keys.push(key);
  }

  addItem(item) {
    if (this.items.some(i => i.name === item.name)) {
      this.items.find(i => i.name === item.name).amount += item.amount;
    } else {
      this.items.push(item);
    }
  }

  removeKey(name) {
    this.keys = this.keys.filter(key => key.name !== name);
  }

  removeItem(name, amount) {
    if (this.items.some(item => item.name === name)) {
      this.items[name].amount -= amount;
      if (this.items[name].amount <= 0) {
        this.items = this.items.filter(item => item.name !== name);
      }
    }
  }

  removeAllItems(name) {
    this.items = this.items.filter(item => item.name !== name);
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

  save() {
    let object = {
      name: this.name,
      description: this.description,
      value: this.value,
    };
    if (this instanceof Item) {
      Object.assign(object, {
        amount: this.amount,
      });
    }
    return object;
  }
}
class Item extends Collectable {
  constructor(name, description, value, amount = 1) {
    super(name, description, value);
    this.amount = amount;
  }
}
class Key extends Collectable {
  constructor(name, description, value) {
    super(name, description, value);
  }
}

function addKeyOrItems(...itemOrKeys) {
  // use a for of loop to iterate over the array
  for (let itemOrKey of itemOrKeys) {
    if (itemOrKey instanceof Key) {
      player.inventory.addKey(itemOrKey);
    } else if (itemOrKey instanceof Item) {
      player.inventory.addItem(itemOrKey);
    }
  }
}
function removeKeyOrItems(...itemOrKeys) {
  for (let itemOrKey of itemOrKeys) {
    if (itemOrKey instanceof Key) {
      player.inventory.removeKey(itemOrKey.name);
    } else if (itemOrKey instanceof Item) {
      player.inventory.removeItem(itemOrKey.name, itemOrKey.amount);
    }
  }
}

class BaseRoom {
  constructor(name, description, possibleLocations, textForLocations) {
    rooms.set(name, this);
    this.name = name;
    this.description = description;
    this.possibleLocations = possibleLocations;
    this.textForLocations = textForLocations;
  }
}

class Room extends BaseRoom {
  constructor(name, description, possibleLocations, textForLocations) {
    super(name, description, possibleLocations, textForLocations);
    this.isCondition = false;
  }

  goto(location) {
    if (this.possibleLocations.includes(location) && location !== this.currentRoom) {
      player.currentRoom = location;
      return true;
    } else {
      return false;
    }
  }

  display(addTextFunction) {
    addTextFunction(this.description);
    // @type {Array<htmlElement>}
    let locations = [];
    if (this.textForLocations[0] === "No" || this.textForLocations[0] === "Yes") {
      locations.push(addTextFunction("&#160;&#160;&#160;No"));
      locations.push(addTextFunction("&#160;&#160;&#160;Yes"));
    } else {
      addTextFunction("You can go to:");
      for (let i = 0; i < this.possibleLocations.length; i++) {
        locations.push(addTextFunction("&#160;&#160;&#160;" + this.textForLocations[i]));
      }
    }

    for (let i = 0; i < locations.length; i++) {
      const func = function () {
        if (this.goto(this.possibleLocations[i])) {
          for (let j = 0; j < locations.length; j++) {
            if (j !== i) {
              locations[j].parentNode.removeChild(locations[j]);
            } else {
              removeEventListener("click", func);
            }
          }

          rooms.get(player.currentRoom).display(addTextFunction);
        }
      }
      locations[i].addEventListener("click", func);
    }
  }
}

class Condition extends BaseRoom {
  constructor(name, possibleLocations, ConditionsForLocations) {
    super(name, "", possibleLocations, ConditionsForLocations);
    this.isCondition = true;
  }

  goto(location) {
    if (this.possibleLocations.every(itemOrKey => {
      if (itemOrKey.isKey) {
        return player.hasKey(itemOrKey.name);
      } else {
        return player.hasItem(itemOrKey.name, itemOrKey.min, itemOrKey.max);
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

  display(addTextFunction) {
    let goToNextRoom = false;
    for (const location of this.possibleLocations) {
      if (this.goto(location)) {
        goToNextRoom = true;
        break;
      }
    }
    if (goToNextRoom) {
      rooms.get(player.currentRoom).display(addTextFunction);
    } else {
      addTextFunction("You can't go there.");
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

  doActions() {
    if (this.remove === true) {
      removeKeyOrItems(...this.itemRemove);
    }
    if (this.add === true) {
      addKeyOrItems(...this.itemAdd);
    }
  }
}

function createRoom(name, description, possibleLocations, textForLocations) {
  return new Room(name, description, possibleLocations, textForLocations);
}

function createCondition(name, possibleLocations, ConditionsForLocations) {
  return new Condition(name, possibleLocations, ConditionsForLocations);
}

function createAction(remove, add, itemAdd, itemRemove) {
  return new Action(remove, add, itemAdd, itemRemove);
}

// export the above functions and variables
module.exports = {
  rooms: rooms,
  player: player,
  createRoom: createRoom,
  createCondition: createCondition,
  createAction: createAction,
  addKeyOrItems: addKeyOrItems,
  removeKeyOrItems: removeKeyOrItems,
  Key: Key,
  Item: Item,
};
