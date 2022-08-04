// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Memento } from "vscode";
const fs = require("fs");

export class LocalStorageService {
  constructor(private storage: Memento) {}

  public getValue<T>(key: string): T {
    return this.storage.get<T>(key, <T>(<any>""));
  }

  public setValue<T>(key: string, value: T) {
    this.storage.update(key, value);
  }
}

const { BOT, CLIENT } = require("../config.json");

export function activate(context: vscode.ExtensionContext) {
  let storageManager = new LocalStorageService(context.workspaceState);

  let setup = vscode.commands.registerCommand("vscs.setup", () => {
    return vscode.env.openExternal(
      vscode.Uri.parse(
        `https://discord.com/oauth2/authorize?client_id=${CLIENT}&permissions=0&scope=bot%20applications.commands`
      )
    );
  });

  let run = vscode.commands.registerCommand("vscs.send", () => {
    const { GatewayIntentBits, Partials, Client } = require("discord.js");
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel],
    });

    client.on("ready", () => {
      console.log(`Logged in as ${client.user.tag}!`);

      let data: string = storageManager.getValue("CurrentComment");
      let user: string = storageManager.getValue("@user");
      let description: string = storageManager.getValue("description");



      if (data) {
        const channel = client.channels.cache.get("1003495357663154209");
        channel.send(user + " " + description + " \n" + '```' + data + '```');
      }
    });

    client.login(BOT);
  });

  const create = vscode.commands.registerCommand(
    "vscs.create",
    async function () {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const selection = editor.selection;

        // Get the word within the selection
        const word = document.getText(selection);

        let description = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          value: "Description:",
        });

        let at = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          value: "@",
        });

        if (
          !description ||
          (description === undefined && !at) ||
          at === undefined
        ) {
          vscode.window.showInformationMessage("Yo, I got nothing, sorry :(");
        } else {
          const comment = `/* ${at}  ${description} */ \n${word}`;

          storageManager.setValue("CurrentComment", word);
          storageManager.setValue("@user", at);
          storageManager.setValue("description", description);



          console.log(storageManager.getValue("CurrentComment"));

          editor.edit((editBuilder) => {
            editBuilder.replace(selection, comment);
          });
        }
      }
    }
  );

  context.subscriptions.push(run);
  context.subscriptions.push(setup);
  context.subscriptions.push(create);
}

export function deactivate() {}
