import { Command, GUI, Key } from "../libraries/gui/gui.js";

function createGUI() {
  let info =
    "Fireworks: on time for Saint John's Eve<br/><br/>Click/tap anywhere, or click and move";
  let subinfo =
    "<hr/>Created with the help of Gemini to add to the answer side of my Anki card templates. But also very convenient for the 23rd of June";

  let gui = new GUI("Fireworks, RB 2024/06", info, subinfo);

  let QM = new Key("?", () => gui.toggle());
  let hide = new Command(QM, "hide this");

  gui.addCmd(hide);
  gui.toggle();
  gui.update();
  return gui;
}

createGUI();
