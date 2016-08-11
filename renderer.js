// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer, remote } = require('electron');
const { dialog } = remote;

	// Add Menu items for file operations
const { Menu, MenuItem } = remote;

const menuTemplate = [{ label: 'Application',
    submenu: [
    {	label: 'Dev Tools',
        click: function() {
			ipcRenderer.send('open-dev-tools');
		}
    },
	{	label: 'Quit',
		accelerator: 'Command+Q',
        click: function() {
				// TO DO: First check no unsaved changes
			ipcRenderer.send('quit');
		}
    }]},
	{	label: "Edit",
    submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]},
	{ label: 'File',
    submenu: [
    {   label: 'Open',
		accelerator: 'Command+O',
        click: function() {
			console.log("Open menu command");
			projectFile = ipcRenderer.sendSync('open');
			if (projectFile === null) {
				console.log("Returned null");
			}
		}
    },
	{	label: 'Save',
		accelerator: 'Command+S',
        click: function() {
			console.log("Save menu command");
		},
	},
	{ type: 'separator' },
	{	label: 'Extract Attribute IDs from CSV',
		accelerator: 'Command+X',
        click: function() {
			console.log("Extract IDs menu command");
		},
	}
    ]}];

const appMenu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(appMenu);

const Vue = require('vue');

var VModalGeneric = Vue.extend({
	props: {
		params: Object,
		mclass: {
			type: String,
			default: ''
		}
	},
	template: '#vue-modal-generic',
		// Lifecycle Methods
	ready: function()
	{
		if (this.params.createDialog) {
			document.getElementById("modal-wrapper").showModal();
		}
	},
	beforeDestroy: function()
	{
		if (this.params.createDialog) {
			document.getElementById("modal-wrapper").close();
		}
	}
});

var VModalNull = Vue.extend({
	props: {
		params: Object
	},
	template: '#vue-modal-null',
	components: {
    	modal: VModalGeneric
	},
	created: function() {
		this.params.createDialog = false;
	}
});

var VModalSelectID = Vue.extend({
	props: {
		params: Object
	},
	data: function () {
    	return { sIndex: -1, items: [] }
	},
	template: '#vue-modal-add-id',
	components: {
    	modal: VModalGeneric
	},
	created: function() {
		this.params.createDialog = true;
		this.items = this.params.items;
	},
		// Messages sent by DOM elements
	methods: {
		selectItem: function(i, e)
		{
			this.sIndex = i;
			e.preventDefault();
		},
		clickok: function()
		{
				// Callback success function with selected ID
			if (this.sIndex != -1) {
				this.params.success(this.items[this.sIndex].id);
			}
			this.$dispatch('close-modal');
		},
		clickcancel: function()
		{
			this.$dispatch('close-modal');
		}
	} // methods()
});

	// Null placeholder Entity Edit Component
var VCompEditNull = Vue.extend({
	props: {
    	item: Object
	},
	template: '#vcomp-edit-null',
	data: function () {
    	return { }
	}
});

	// Attribute Edit Component
var VCompEditAttribute = Vue.extend({
	props: {
    	item: Object		// Passed down from vApp
	},
	template: '#vcomp-edit-attribute',
	data: function () {
    	return { newTerm: '' }
	},
	methods: {
		addTerm: function()
		{
			if (this.newTerm.length > 0) {
				this.item.vLegend.push({ term: this.newTerm, color: '#777777', x: [] });
				this.newTerm = '';
			}
		}, // addTerm()
		doLegendUp: function(i1, i2)
		{
			let theArray, i=i1;

			switch (this.item.dtype) {
			case 'T':
				theArray = this.item.tLegend;
				break;
			case 'V':
				if (i2 == -1) {
					theArray = this.item.vLegend;
				} else {
					theArray = this.item.vLegend[i1].x;
					i = i2;
				}
				break;
			case 'D':
				theArray = this.item.dLegend;
				break;
			case 'N':
				theArray = this.item.nLegend;
				break;
			} // switch
			if (i > 0) {
				let returned = theArray.splice(i, 1);
				theArray.splice(i-1, 0, returned[0]);
			}
		}, // doLegendUp()
		doLegendDown: function(i1, i2)
		{
			let theArray, i=i1;

			switch (this.item.dtype) {
			case 'T':
				theArray = this.item.tLegend;
				break;
			case 'V':
				if (i2 == -1) {
					theArray = this.item.vLegend;
				} else {
					theArray = this.item.vLegend[i1].x;
					i = i2;
				}
				break;
			case 'D':
				theArray = this.item.dLegend;
				break;
			case 'N':
				theArray = this.item.nLegend;
				break;
			} // switch
			if (i < theArray.length-1) {
				let returned = theArray.splice(i, 1);
				theArray.splice(i+1, 0, returned[0]);
			}
		}, // doLegendDown()
		doLegendEdit: function(i1, i2)
		{
console.log("Edit legend "+i1);

		},
		doLegendDel: function(i1, i2)
		{
			switch (this.item.dtype) {
			case 'T':
				this.item.tLegend.splice(i1, 1);
				break;
			case 'V':
				if (i2 == -1) {
					this.item.vLegend.splice(i1, 1);
				} else {
					this.item.vLegend[i1].x.splice(i2, 1);
				}
				break;
			case 'D':
				this.item.dLegend.splice(i1, 1);
				break;
			case 'N':
				this.item.nLegend.splice(i1, 1);
				break;
			} // switch
		}, // doLegendDel()
			// PURPOSE: Set color in legend
			// INPUT:	i1 is index into Legend; i2 is null or index into child array
		setLegendViz: function(i1, i2)
		{
console.log("Set legend "+i1);
		},
		cancel: function()
		{
			this.$dispatch('cancel');
		},
			// PURPOSE: Verify basics of Attribute definition and request VueApp to save
			// NOTES:	Do checks that reference other entities in Verify function
		save: function()
		{
			if (this.item.id.length == 0 || this.item.id.length > 24 || !/^[\w\-]+$/.test(this.item.id)) {
				dialog.showErrorBox('Attribute Error', 'You must provide a unique ID, no more than 24 characters, consisting only of numbers, letters, underscores and hyphens.');
				return;
			}
			if (this.item.label === '') {
				dialog.showErrorBox('Attribute Error', 'You must provide a label for the Attribute.');
				return;
			}
			if (/"/.test(this.item.hint)) {
				dialog.showErrorBox('Attribute Error', 'You cannot use a straight-double-quote in the hint.');
				return;
			}
			this.$dispatch('save-item');
		}
	}
});

	// Template Edit Component
var VCompEditTemplate = Vue.extend({
	props: {
    	item: Object		// Template object to edit, passed down from vApp
	},
	template: '#vcomp-edit-template',
	data: function () {
    	return { }
	},
	ready: function()
	{
		this.refreshAttIDs();
	},
		// Event Messages triggered by GUI or private methods
	methods: {
		refreshAttIDs: function()
		{
			var textAtts=[], ytAtts=['disable'], audioAtts=['disable'], transcAtts=['disable'], timecodeAtts=['disable'];
			this.item.atts.forEach(function(att1) {
					// Find definition for this Attribute
				var a = attributes.find(function(att2) { return att1.id === att2.id; });
				if (a) {
					switch (a.dtype) {
					case 'T':
						textAtts.push(a.id);
						break;
					case 'S':
						audioAtts.push(a.id);
						break;
					case 'Y':
						ytAtts.push(a.id);
						break;
					case 'x':
						transcAtts.push(a.id);
						break;
					case 't':
						timecodeAtts.push(a.id);
						break;
					} // switch
				} // if att found
			});
			this.item.textAttIDs = textAtts;
			this.item.youTubeIDs = ytAtts;
			this.item.audioIDs = audioAtts;
			this.item.transcriptIDs = transcAtts;
			this.item.timeCodeIDs = timecodeAtts;
		},
		upAttribute: function(i) {
			if (i > 0) {
				var returned = this.item.atts.splice(i, 1);
				this.item.atts.splice(i-1, 0, returned[0]);
			}
		},
		downAttribute: function(i) {
			if (i < this.item.atts.length-1) {
				var returned = this.item.atts.splice(i, 1);
				this.item.atts.splice(i+1, 0, returned[0]);
			}
		},
		delAttribute: function(i) {
			this.item.atts.splice(i, 1);
			this.refreshAttIDs();
		},
		addAttribute: function() {
			var self=this;
			vApp.modalParams.success = function(id)
			{
				var a = attributes.find(function(thisAtt) { return thisAtt.id === id; });
				self.item.atts.push({ id: id, display: false, canjoin: a.dtype == 'J', join: '' });
				self.refreshAttIDs();
			};
				// Only present Attributes not already in the Template
			var unusedAtts = attributes.filter(function(thisAtt) {
				return self.item.atts.find(function(att2) { return thisAtt.id == att2.id; }) == undefined;
			});
			vApp.modalParams.items = unusedAtts;
			if (unusedAtts.length > 0) {
				vApp.setModal('modalSelectID');
			}
		},
			// PURPOSE: Allow user to choose dependent Template to Join to this Attribute
		setJoin: function(i) {
			var self=this;
			vApp.modalParams.success = function(id) { self.item.atts[i].join = id; };
			var dependentTemplates = templates.filter(function(thisTemp) { return thisTemp.dependent; });
			vApp.modalParams.items = dependentTemplates;
			if (dependentTemplates.length > 0) {
				vApp.setModal('modalSelectID');
			}
		},
			// PURPOSE: Cancel editing of this Template
		cancel: function()
		{
			this.$dispatch('cancel');
		},
			// PURPOSE: Verify basics of Template definition and request VueApp to save
			// NOTES:	Do checks that reference other entities in Verify function
		save: function()
		{
			if (this.item.id.length == 0 || this.item.id.length > 24 || !/^[\w\-]+$/.test(this.item.id)) {
				dialog.showErrorBox('Template Error', 'You must provide a unique ID, no more than 24 characters, consisting only of numbers, letters, underscores and hyphens.');
				return;
			}
			if (this.item.label === '') {
				dialog.showErrorBox('Template Error', 'You must provide a label for the Template.');
				return;
			}
			if (/"/.test(this.item.hint)) {
				dialog.showErrorBox('Template Error', 'You cannot use a straight-double-quote in the hint.');
				return;
			}

			this.$dispatch('save-item');
		}
	}
});

var attIDCntr=0, tmpltIDCntr=0, exbhtIDCntr=0;

var attributes = [ ];
var templates = [ ];
var exhibits = [ ];

var vApp = new Vue({
	el: '#vue-app',
	data: {
		activeEntity: 'A',				// 'A', 'T', 'E'
		itemList: attributes,			// current list of items editing
		indexSelected: -1,				// index 0..n-1 of item currently selected, -1 = none
		newItem: false,					// is item being edited a new one?
		itemEditing: null,				// item currently being edited, or null
		editComponent: 'editNull',		// Which component is shown in editing area
		allItems: { 'A': attributes, 'T': templates, 'E': exhibits },
		modalParams: {  },				// parameters passed to generic modal
		modalShowing: 'modalNull'		// modal currently showing
	},
	components: {
		editAtt: VCompEditAttribute,
		editTmplt: VCompEditTemplate,
		editNull: VCompEditNull,
		modalNull: VModalNull,
		modalSelectID: VModalSelectID
	},
		// Messages invoked by DOM elements
	methods: {
			// PURPOSE: Activate a modal dialog, or pass 'modalNull' for none
		setModal: function(modalID)
		{
			this.modalShowing = modalID;
		},
			// PURPOSE: Handle click on item in list
			// INPUT:	i = index of item in list
			//			e = event message
		selectItem: function(i, e) {
				// Ignore if currently editing
			if (this.itemEditing == null) {
				this.indexSelected = i;
			}
			e.preventDefault();
		} // selectItem()
	}, // methods
		// Messages dispatched by child components
	events: {
		'close-modal': function()
		{
			this.modalShowing = 'modalNull';
		},
		'cancel': function () {
			this.editComponent = 'editNull';
			this.itemEditing = null;
			this.indexSelected = -1;
		},
		'save-item': function() {
				// Remove any temporary/dynamic fields from object before save
			switch(this.entityCode) {
			case 'T':
				delete this.itemEditing.textAttributes;
				break;
			}
			if (this.newItem) {
				this.itemList.push(this.itemEditing);
			} else {
				this.itemList.$set(this.indexSelected, this.itemEditing);
			}
			this.editComponent = 'editNull';
			this.itemEditing = null;
			this.indexSelected = -1;
		}
	} // events
});

function newAttribute()
{
	return {
		id: 'att'+attIDCntr++,
		label: '',
		dtype: 'T',
		privacy: 'o',
		delim: '',
		hint: '',
		canFilter: true,
			// TYPE-SPECIFIC
			// Text type
		tLegend: [],		// [ { text, color } ]
			// Vocab type
		vLegend: [],		// [ { term, color, x: [ ] } ]
			// Number type
		nLegend: [],		// [ { min, max, label, color } ]
		nRange: { min: 0, max: 100, g: 1, u: '#777777' },
			// Dates type
		dLegend: [],		// [ { } ]
		dRange: { min: { y: '', m: '', d: ''}, max: { y: '', m: '', d: ''}, g: 'y', u: '#777777' }
	}
} // newAttribute()

function newTemplate()
{
	return {
		id: 'tmplt'+tmpltIDCntr++,
		label: '',
		dependent: false,
		hint: '',
		atts: [],					// List of { id, display, canjoin, join }
		labelID: '',
			// Attributes for playback widgets
		scID: 'disable',					// Audio (SoundCloud)
		ytID: 'disable',					// YouTube
		t1ID: 'disable',					// Transcript1
		t2ID: 'disable',					// Transcript2
		tcID: 'disable',					// Timecode
			// Attribute lists updated dynamically
		textAttIDs: [],
		youTubeIDs: [],
		audioIDs: [],
		transcriptIDs: [],
		timeCodeIDs: []
	};
} // newTemplate()

function setActiveEntity(entityCode, activeBtn, otherBtns)
{
		// Ignore if currently editing or entity type already selected
	if (vApp.itemEditing == null && vApp.activeEntity != entityCode) {
		activeBtn.classList.remove('btn-default');
		activeBtn.classList.add('btn-primary');
		otherBtns.forEach(function(thisID) {
			var theButton = document.querySelector(thisID);
			theButton.classList.remove('btn-primary');
			theButton.classList.add('btn-default');
		})
		vApp.activeEntity = entityCode;
		vApp.itemList = vApp.allItems[entityCode];
		vApp.indexSelected = -1;
	}
} // setActiveEntity()

document.querySelector('#btn-entity-att').addEventListener('click', function (event) {
	setActiveEntity('A', event.target, ['#btn-entity-tmplt', '#btn-entity-exhbt']);
});

document.querySelector('#btn-entity-tmplt').addEventListener('click', function (event) {
	setActiveEntity('T', event.target, ['#btn-entity-att', '#btn-entity-exhbt']);
});

document.querySelector('#btn-entity-exhbt').addEventListener('click', function (event) {
	setActiveEntity('E', event.target, ['#btn-entity-att', '#btn-entity-tmplt']);
});

document.querySelector('#btn-add').addEventListener('click', function (event) {
	if (vApp.itemEditing == null) {
		switch (vApp.activeEntity) {
		case 'A':
			vApp.itemEditing = newAttribute();
			vApp.editComponent = 'editAtt';
			break;
		case 'T':
			vApp.itemEditing = newTemplate();
			vApp.editComponent = 'editTmplt';
			break;
		}
		vApp.newItem = true;
		vApp.indexSelected = -1;
	}
});

document.querySelector('#btn-edit').addEventListener('click', function (event) {
	if (vApp.itemEditing == null && vApp.indexSelected != -1) {
		var itemCopy = vApp.itemList[vApp.indexSelected];
		itemCopy = JSON.parse(JSON.stringify(itemCopy));
		switch (vApp.activeEntity) {
		case 'A':
			vApp.editComponent = 'editAtt';
			break;
		case 'T':
			vApp.editComponent = 'editTmplt';
			break;
		}
		vApp.itemEditing = itemCopy;
		vApp.newItem = false;
	}
});

document.querySelector('#btn-delete').addEventListener('click', function (event) {
	if (vApp.itemEditing == null && vApp.indexSelected != -1) {
		let label = vApp.itemList[vApp.indexSelected].label;
		let btn = dialog.showMessageBox(null,
			{ type: "question", buttons: [ "Cancel", "OK" ], defaultId: 0,
			  title: "Delete?",
			  message: "Are you sure you want to delete "+label+"?"
			});
		if (btn === 1) {
				// Remove references to item in other entities
			let itemID = vApp.itemList[vApp.indexSelected].id;
			switch (vApp.activeEntity) {
			case 'A':
				templates.forEach(function(thisTemp) {
					for (let i=thisTemp.atts.length-1; i>=0; i--) {
						if (thisTemp.atts[i].id == itemID) {
							thisTemp.atts.splice(i, 1);
							if (thisTemp.labelID == itemID) {
								thisTemp.labelID = '';
							}
							if (thisTemp.scID == itemID) {
								thisTemp.scID = 'disable';
							}
							if (thisTemp.ytID == itemID) {
								thisTemp.ytID = 'disable';
							}
							if (thisTemp.t1ID == itemID) {
								thisTemp.t1ID = 'disable';
							}
							if (thisTemp.t2ID == itemID) {
								thisTemp.t2ID = 'disable';
							}
							if (thisTemp.tcID == itemID) {
								thisTemp.tcID = 'disable';
							}
						}
					}
				});
					// TO DO: Remove from Exhibits
				break;
			case 'T':
				templates.forEach(function(thisTemp) {
					for (let i=thisTemp.atts.length-1; i>=0; i--) {
						if (thisTemp.atts[i].join == itemID) {
							thisTemp.atts[i].join = '';
						}
					}
				});
					// TO DO: Remove from Exhibits
				break;
			} // switch
			vApp.itemList.splice(vApp.indexSelected, 1);
			vApp.indexSelected = -1;
		}
	}
});

	// PURPOSE: Check aspects of entity definitions that reference each other
document.querySelector('#btn-verify').addEventListener('click', function (event) {
	if (vApp.itemEditing == null) {
		// TODO
	}
});
