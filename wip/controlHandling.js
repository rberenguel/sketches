export { bindGamepadHandlers, bindKeyHandlers, handleControls, touchZoneHandler, getDeviceInput }

const keys = {};

const controllers = [];
const touchZoneHandler = (elt, kn) => {
  elt.addEventListener("mousedown", (ev) => {
    keys[kn] = true; // Mark the key as pressed
    if(elt.alsoClick){
      elt.alsoClick();
    }
    ev.preventDefault()
  })
  elt.addEventListener("touchstart", (ev) => {
    keys[kn] = true; // Mark the key as pressed
    if(elt.alsoClick){
      elt.alsoClick();
    }
    ev.preventDefault()
  })
  elt.addEventListener("mouseup", (ev) => {
    keys[kn] = false; // Mark the key as unpressed
    ev.preventDefault()
  })    
  elt.addEventListener("touchend", (ev) => {
    keys[kn] = false; // Mark the key as unpressed
    ev.preventDefault()
  })  }

const bindGamepadHandlers = () => {
  window.addEventListener("gamepadconnected", function (e) {
    gamepadHandler(e, true);
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      e.gamepad.index,
      e.gamepad.id,
      e.gamepad.buttons.length,
      e.gamepad.axes.length
    );
  });
  window.addEventListener("gamepaddisconnected", function (e) {
    console.log(
      "Gamepad disconnected from index %d: %s",
      e.gamepad.index,
      e.gamepad.id
    );
    gamepadHandler(e, false);
  });

}

const bindKeyHandlers = () => {
  document.addEventListener("keydown", (event) => {
    keys[event.code] = true; // Mark the key as pressed
    event.preventDefault()
  });

  document.addEventListener("keyup", (event) => {
    keys[event.code] = false; // Mark the key as released
    event.preventDefault()
  });
}
const buttonPressed = (b) => {
  if (typeof b == "object") {
    return b.pressed; // binary
  }
  return b > 0.9; // analog value
};

const logPads = () => {
  let gamepads = navigator.getGamepads();
  for (let i in controllers) {
    let controller = gamepads[i]; //controllers[i]
    if (controller.buttons) {
      for (let btn = 0; btn < controller.buttons.length; btn++) {
        let val = controller.buttons[btn];
        if (buttonPressed(val)) {
          console.log(btn);
        }
      }
    }
  }
};


const gamepadHandler = (event, connecting) => {
  let gamepad = event.gamepad;
  if (connecting) {
    controllers[gamepad.index] = gamepad;
  } else {
    delete controllers[gamepad.index];
  }
};

const getDeviceInput = async (kind) => {
  let input = null;
  while (input === null) {
    input = _getDeviceInput(kind);
    if (input === null) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
    }
  }
  return input;
};

const _getDeviceInput = (kind) => {
  let gamepads = navigator.getGamepads();
  if(kind == "keyboard"){
    for (let key in keys) {
      if (keys[key]) {
        return key;
      }
    }
    return null;
  }
  if(kind =="gamepad"){
    for (let i in controllers) {
      let controller = gamepads[i];
      if (controller.buttons) {
        console.log("Buttons done")
        for(let b=0;b<controller.buttons.length;b++){
          if(buttonPressed(controller.buttons[b])){
            return b
          }
        }
      }
    }
    return null;
  }
};

const handleControls = (gameActions, keyMap, buttonMap) => {
  let gamepads = navigator.getGamepads();

  if (controllers.length == 0) {
    for(let key in keyMap){
      if(keys[key]){
        gameActions[keyMap[key]]();
      }
    }
    return;
  }

  for (let i in controllers) {
    let controller = gamepads[i]; //controllers[i]
    if (controller.buttons) {
      const pressed = (b) => buttonPressed(controller.buttons[b]);
      for(let button in buttonMap){
        if(buttonPressed(controller.buttons[button.slice(1)])){
          gameActions[buttonMap[button]]();
        }
      }
    }
  }
}

