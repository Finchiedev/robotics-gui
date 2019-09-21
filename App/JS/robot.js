const fs = require('fs');
const {Dynamixel, Robot} = require('./JS/main.js');

/**
 * Creates a number input inside a <td>
 * @param {String} id The ID of the input element
 * @param {Number} min The minimum item in the range
 * @param {Number} max The maximum item in the range
 * @param {Number} value The initial value of the range
 * @return {Node} A <td> element containing the <range> element
 */
function createRange(id, min, max, value) {
  const parent = document.createElement('td');
  const range = document.createElement('input');
  range.setAttribute('type', 'number');
  range.setAttribute('id', id);
  range.setAttribute('min', min);
  range.setAttribute('max', max);
  range.setAttribute('value', value);

  parent.appendChild(range);
  return parent;
}

/**
 * Creates a select box inside a <td>, with an item for every downloaded servo
 * @param {Number} index The index of the row in the table (1-indexed)
 * @return {Node} A <td> element containing the <select> element
 */
function createModel(index) {
  const model = document.createElement('td');
  const select = document.createElement('select');
  select.setAttribute('id', `model-${index}`);
  const servos = [];

  fs.readdirSync('./App/JS/Resources/Servos/').forEach((file) => {
    if (!servos.includes(file)) {
      servos.push(file);
    }
  });

  for (let i = 0; i < servos.length; ++i) {
    const option = document.createElement('option');
    option.setAttribute('value', servos[i].split('.')[0]);
    option.innerHTML = servos[i].split('.')[0];

    select.appendChild(option);
  }

  model.appendChild(select);
  return model;
}

/**
 * Creates a <td> item with a radio button for every item in the array
 * @param {String} name The "name" group the options are assigned to
 * @param {Array} ids An array of IDs, one element for each radio button
 * @param {Array} values An array of values, one element for each radio button
 * @return {Node} A <td> element containing the radio buttons
 */
function createRadios(name, ids, values) {
  const parent = document.createElement('td');
  parent.setAttribute('id', name);
  for (let i = 0; i < ids.length; ++i) {
    const item = document.createElement('input');
    item.setAttribute('type', 'radio');
    item.setAttribute('id', ids[i]);
    item.setAttribute('value', values[i]);
    item.setAttribute('name', name);

    const label = document.createElement('label');
    label.setAttribute('for', ids[i]);
    label.innerHTML = values[i];

    parent.appendChild(item);
    parent.appendChild(label);
  }

  return parent;
}

/**
 * Creates an array of <td> elements that represent a row in the table
 * @param {Number} index The index of the row in the table (1-indexed)
 * @return {Array} An array of Nodes, each being a <td> element
 */
function createElements(index) {
  const elements = [];
  elements.push(createRange(`id-${index}`, 1, 250, index));
  elements.push(createModel(index));
  const radios = createRadios(`protocol-${index}`, [`protocol1-${index}`,
    `protocol2-${index}`], [1, 2]);
  elements.push(radios);
  const modes = createRadios(`mode-${index}`, [`wheel-${index}`,
    `joint-${index}`], ['Wheel', 'Joint']);
  elements.push(modes);
  elements.push(createRange(`min-${index}`, 0, 1024, 0));
  elements.push(createRange(`max-${index}`, 0, 1024, 1024));

  return elements;
}

/**
 * Sets the values of the inputs in the min and max column
 * @param {Number} index The index of the row in the table (1-indexed)
 * @param {Number} min The new value of the input in the min column
 * @param {Number} max The new value of the input in the max column
 */
function setRangeValues(index, min, max) {
  document.getElementById(`min-${index}`).value = min;
  document.getElementById(`max-${index}`).value = max;
}

/**
 * Updates the mode selection based on the values of the min and max inputs
 * @param {Number} index The index of the row in the table (1-indexed)
 */
function onValueChange(index) {
  const min = document.getElementById(`min-${index}`);
  const max = document.getElementById(`max-${index}`);

  if (min.value == 0 && max.value == 0) {
    document.getElementById(`wheel-${index}`).checked = true;
  } else {
    document.getElementById(`joint-${index}`).checked = true;
  }
}

/**
 * Adds a new row to the robot's servo table
 */
function addRow() {
  const parent = document.getElementById('parent');
  const row = document.createElement('tr');
  const index = parent.childElementCount;
  row.setAttribute('id', index);
  const children = createElements(index);

  for (let i = 0; i < children.length; ++i) {
    row.appendChild(children[i]);
  }

  parent.appendChild(row);
  document.getElementById(`protocol1-${index}`).checked = true;
  document.getElementById(`joint-${index}`).checked = true;

  document.getElementById(`joint-${index}`).onchange = function() {
    setRangeValues(index, 0, 1024);
  };

  document.getElementById(`wheel-${index}`).onchange = function() {
    setRangeValues(index, 0, 0);
  };

  document.getElementById(`min-${index}`).onchange = function() {
    onValueChange(index);
  };

  document.getElementById(`max-${index}`).onchange = function() {
    onValueChange(index);
  };
}

/**
 * Removes the last row of the robot's servo table
 * @param {Number} minRows The minimum number of rows that must remain
 */
function removeLastRow(minRows) {
  const parent = document.getElementById('parent');
  if (parent.childElementCount > minRows) {
    parent.removeChild(parent.lastChild);
  }
}

/**
 * Resets the last row of robot's servo table
 */
function resetLastRow() { // eslint-disable-line no-unused-vars
  const parent = document.getElementById('parent');
  if (parent.childElementCount >= 2) {
    removeLastRow(1);
    addRow();
  }
}

/**
 * Creates a new robot from the user input
 * @return {Robot} A robot class representing the specified servos
 */
function createRobot() { // eslint-disable-line no-unused-vars
  const count = document.getElementById('parent').childElementCount;
  const servos = {};
  for (let i = 1; i < count; i++) {
    const model = document.getElementById(`model-${i}`).value;
    const id = document.getElementById(`id-${i}`).value;
    let protocol = 1;

    if (document.getElementById(`protocol2-${i}`).checked) {
      protocol = 2;
    }

    servos[id] = {};
    servos[id]['object'] = new Dynamixel(model, id, protocol);
    servos[id]['object'].minPos = document.getElementById(`min-${i}`).value;
    servos[id]['object'].maxPos = document.getElementById(`max-${i}`).value;

    if (document.getElementById(`wheel-${i}`).checked) {
      servos[id]['object'].setMode('wheel');
    }
  }

  return new Robot(servos);
}

addRow();