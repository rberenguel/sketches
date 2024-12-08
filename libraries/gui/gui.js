// Ruben Berenguel, 2020/05
import { Command } from "./command.js";
import { Control } from "./control.js";
import { Variable, Boolean, Integer, Float, String } from "./variable.js";
import { Key } from "./key.js";
import { Input } from "./input.js";
import { FluentGUI } from "./fluentgui.js";

import { Seeder } from "./seeder.js";
import { $ } from "./dom.js";

export {
  createBaseGUI,
  FluentGUI,
  GUI,
  Command,
  Key,
  Control,
  Input,
  Integer,
  Float,
  Boolean,
  Seeder,
  String,
  Variable,
};

class GUI {
  constructor(title, info, subinfo, cmds, states) {
    let gui = new FluentGUI();

    gui
      .withTitle(title)
      .withInfo(info)
      .withSubinfo(subinfo)
      .withCommands(cmds)
      .withControls(states)
      .withDOM($.byId("gui"));
    document.title = title;
    gui.setup();
    this.title = title;
    return gui;
  }
}

function createBaseGUI(config) {
  let gui = new GUI(config.title, config.info, config.subinfo);
  let S = new Key("s", () => {
    config.largeCanvas.save("img.png");
  });
  let saveCmd = new Command(S, "save the canvas");

  let decH = new Key(",", () => {
    if (config.hd > 0) {
      config.hd -= 0.1;
      gui.mark();
      gui.update();
    }
  });
  let incH = new Key(
    ".",
    () => {
      if (config.hd < 10) {
        config.hd += 0.1;
        gui.mark();
        gui.update();
      }
    },
    (x) => {
      config.hd = parseFloat(x);
      gui.update();
    },
    "hd",
  );
  let hdInfo = new Float(() => config.hd);
  let hdControl = new Control(
    [decH, incH],
    "+/- resolution export factor",
    hdInfo,
  );

  const commands = config.commands || [];
  const controls = config.controls || [];
  if (config.skipSaveCmd) {
    gui = gui.withCommands([...commands]);
  } else {
    gui = gui.withCommands([saveCmd, ...commands]);
  }
  if (config.skipHD) {
    gui = gui.withControls([...controls]);
  } else {
    gui = gui.withControls([hdControl, ...controls]);
  }

  let QM = new Key("?", () => gui.toggle());
  let hide = new Command(QM, "hide this");

  gui.addCmd(hide);
  config.seeder.setup(gui);
  gui.update();
  return gui;
}
