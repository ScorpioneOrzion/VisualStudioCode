// gamePlay
const rooms = {};
const player = {
  currentRoom: "",
  inventory: {
    keys: [],
    items: []
  },
  health: 100,
  maxHealth: 100,
};
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
  constructor(name, description, value, use) {
    super(name, description, value);
    this.use = use;
  }
}
class Key extends Collectable {
  constructor(name, description, value, room) {
    super(name, description, value);
    this.room = room;
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
// create a function that can create a room with a name, description and a list of possible locations it can go to
function createRoom(name, description, possibleLocations, textForLocations) {
  rooms[name] = {
    description: description,
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

// export the above functions and variables
module.exports = {
  rooms: rooms,
  player: player,
  createRoom: createRoom,
  addKeyOrItems: addKeyOrItems,
  removeKeyOrItems: removeKeyOrItems,
  Key: Key,
  Item: Item,
};
