const electron = require('electron');
const { ipcMain, dialog } = electron;

	// Module to control application life.
const app = electron.app;

	// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var mainWindow;

	// Communications: set before client windows created
	// ===================================================
ipcMain.on('open-dev-tools', (event) => {
	mainWindow.webContents.openDevTools();
	event.returnValue = 'ok';
});

ipcMain.on('quit', () => {
	app.quit();
});

	// PURPOSE: To open a project archive file ("configuration bundle")
	// RETURNS: Either the file or else null (= Cancel)
ipcMain.on('open', (event, arg) => {
	let file = dialog.showOpenDialog({
		title: 'Open Project File',
		buttonLabel: 'Open',
		filters: [
    		{name: 'Project Files', extensions: ['json', 'jsn'] }
		],
		properties: ['openFile']
	});
	if (typeof file === 'undefined') {
		event.returnValue = null;
	} else {
		event.returnValue = file;
	}
});

	// NOTES:	Called once Electron has finished initialization
function createWindow()
{
		// Create the browser window.
	mainWindow = new BrowserWindow({ width: 800, height: 600 });

		// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`)

		// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		mainWindow = null	// Dereference the window object
	})
}

app.on('ready', function() {
	createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
})

	// NOTES: On OS X it's common to re-create a window in the app when the
	//			dock icon is clicked and there are no other windows open.
app.on('activate', function () {
	if (mainWindow === null) {
		createWindow();
	}
});

	// PURPOSE: Load project data
	// NOTES: 	Is synchronous, as cannot proceed until data loaded
ipcMain.on('project-open', (event, arg) => {
	console.log("Opening…");
		// TO DO -- load JSON file and parse
	event.returnValue = 'pong';
});
