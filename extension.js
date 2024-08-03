const vscode = require("vscode");
const path = require("path");
const axios = require("axios");

function activate(context) {
  const setupCommand = vscode.commands.registerCommand(
    "arcade.setup",
    async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Arcade API Key",
        ignoreFocusOut: true,
      });

      const slackMemberId = await vscode.window.showInputBox({
        prompt: "Enter your Slack Member ID",
        ignoreFocusOut: true,
      });

      if (apiKey && slackMemberId) {
        context.globalState.update("arcadeApiKey", apiKey);
        context.globalState.update("slackMemberId", slackMemberId);
        vscode.window.showInformationMessage(
          "Arcade setup completed successfully."
        );
        checkForOngoingSession(context, apiKey, slackMemberId);
      } else {
        vscode.window.showWarningMessage(
          "Arcade setup was not completed. Both values are required."
        );
      }
    }
  );

  context.subscriptions.push(setupCommand);

  // Check setup on startup
  const setupCheck = vscode.workspace.onDidOpenTextDocument(async () => {
    const apiKey = context.globalState.get("arcadeApiKey");
    const slackMemberId = context.globalState.get("slackMemberId");

    if (!apiKey || !slackMemberId) {
      vscode.window.showWarningMessage(
        'Arcade is not set up. Please run the "Arcade: Setup" command to configure the extension.'
      );
    } else {
      checkForOngoingSession(context, apiKey, slackMemberId);
    }
  });

  context.subscriptions.push(setupCheck);
}

async function checkForOngoingSession(context, apiKey, slackMemberId) {
  try {
    let response = await axios.get(
      `https://hackhour.hackclub.com/api/session/${slackMemberId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (response.data.ok) {
      let session = response.data.data;

      if (!session.completed) {
        setupStatusBar(context, session.id);
      } else {
        vscode.window.showInformationMessage(
          "Wohoo! You completed the session!"
        );
        clearStatusBar();
      }
    } else {
      vscode.window.showInformationMessage("No ongoing session found.");
      clearStatusBar();
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      "Error checking for ongoing sessions: " + error.message
    );
  }
}

function setupStatusBar(context, sessionId) {
  const startIconPath = path.join(__dirname, "images", "start.png");
  const cancelIconPath = path.join(__dirname, "images", "cancel.png");

  const startButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  startButton.text = `Start Session`;
  startButton.iconPath = startIconPath;
  startButton.command = "arcade.start";
  startButton.show();

  const cancelButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    101
  );
  cancelButton.text = `Cancel Session`;
  cancelButton.iconPath = cancelIconPath;
  cancelButton.command = "arcade.cancel";
  cancelButton.show();

  vscode.commands.registerCommand("arcade.start", async () => {
    vscode.window.showInformationMessage("Starting session...");
    // Implement start session logic here
  });

  vscode.commands.registerCommand("arcade.cancel", async () => {
    vscode.window.showInformationMessage("Cancelling session...");
    // Implement cancel session logic here
  });

  context.subscriptions.push(startButton, cancelButton);
}

function clearStatusBar() {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Clearing status bar...",
      cancellable: false,
    },
    async () => {
      vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right).hide();
    }
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
