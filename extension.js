const vscode = require("vscode");
const axios = require("axios");

const API_URL = "https://hackhour.hackclub.com/api";

function activate(context) {
  let statusBarItems = new Map();

  // Initialize Session Command
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
          "ARC Setup completed successfully."
        );
        setupStatusBar(context, statusBarItems);
      } else {
        vscode.window.showWarningMessage(
          "Both API Key and Slack Member ID are required."
        );
      }
    }
  );

  context.subscriptions.push(setupCommand);

  // Begin Session Command
  const startSessionCommand = vscode.commands.registerCommand(
    "arcade.start",
    async () => {
      const apiKey = context.globalState.get("arcadeApiKey");
      const slackMemberId = context.globalState.get("slackMemberId");

      if (!apiKey || !slackMemberId) {
        vscode.window.showWarningMessage(
          'Please run the "ARC: Initialize Session" command to configure the extension.'
        );
        return;
      }

      const work = await vscode.window.showInputBox({
        prompt: "What are you working on?",
        ignoreFocusOut: true,
      });

      if (work) {
        try {
          let response = await axios.post(
            `${API_URL}/start/${slackMemberId}`,
            {
              work: work,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            }
          );

          if (response.data.ok) {
            vscode.window.showInformationMessage(
              "ARC Session started successfully!"
            );
          } else {
            vscode.window.showErrorMessage("Failed to start session.");
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            "Error starting session: " + error.message
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "Work description is required to start a session."
        );
      }
    }
  );

  context.subscriptions.push(startSessionCommand);

  // End Session Command
  const cancelSessionCommand = vscode.commands.registerCommand(
    "arcade.cancel",
    async () => {
      const apiKey = context.globalState.get("arcadeApiKey");
      const slackMemberId = context.globalState.get("slackMemberId");

      if (!apiKey || !slackMemberId) {
        vscode.window.showWarningMessage(
          'Please run the "ARC: Initialize Session" command to configure the extension.'
        );
        return;
      }

      try {
        let response = await axios.post(
          `${API_URL}/cancel/${slackMemberId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (response.data.ok) {
          vscode.window.showInformationMessage(
            "ARC Session canceled successfully!"
          );
          setupStatusBar(context, statusBarItems); // Reinitialize the buttons
        } else {
          vscode.window.showErrorMessage("Failed to cancel session.");
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          "Error canceling session: " + error.message
        );
      }
    }
  );

  context.subscriptions.push(cancelSessionCommand);

  // Check setup on startup
  const setupCheck = vscode.window.onDidChangeActiveTextEditor(() => {
    const apiKey = context.globalState.get("arcadeApiKey");
    const slackMemberId = context.globalState.get("slackMemberId");

    if (!apiKey || !slackMemberId) {
      vscode.window.showWarningMessage(
        'ARC is not set up. Please run the "ARC: Initialize Session" command to configure the extension.'
      );
    } else {
      setupStatusBar(context, statusBarItems);
    }
  });

  context.subscriptions.push(setupCheck);
}

function setupStatusBar(context, statusBarItems) {
  // Clear existing status bar items
  clearStatusBar(statusBarItems);

  // Create Start Button
  const startButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  startButton.text = `Start ARC Session`;
  startButton.command = "arcade.start";
  startButton.color = "white";
  startButton.backgroundColor = "green";
  startButton.show();
  statusBarItems.set("start", startButton);

  // Create Cancel Button
  const cancelButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    101
  );
  cancelButton.text = `Cancel ARC Session`;
  cancelButton.command = "arcade.cancel";
  cancelButton.color = "white";
  cancelButton.backgroundColor = "green";
  cancelButton.show();
  statusBarItems.set("cancel", cancelButton);

  context.subscriptions.push(startButton);
  context.subscriptions.push(cancelButton);
}

function clearStatusBar(statusBarItems) {
  statusBarItems.forEach((item) => item.dispose());
  statusBarItems.clear();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
