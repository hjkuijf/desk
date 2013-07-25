/**
 * A simple text editor that can also execute javascript code
 * @lint ignoreDeprecated (alert)
 */
qx.Class.define("desk.TextEditor", 
{
  extend : qx.ui.window.Window,

	/**
	* Creates a new text editor window
	*
	* @param file {String} the file to edit
	*/
	construct : function(file) {
		this.base(arguments);
		this.setLayout(new qx.ui.layout.VBox());
		this.setHeight(400);
		this.setWidth(500);
		this.setShowClose(true);
		this.setShowMinimize(false);
		this.setResizable(true,true,true,true);
		this.setUseResizeFrame(true);
		this.setUseMoveFrame(true);

		this.__reloadButton = new qx.ui.form.Button("Reload");
		this.__reloadButton.setKeepFocus(true);
		this.__reloadButton.addListener("execute", function(e) {
			this.openFile(this.__file);
		}, this);

		var saveButton = this.__saveButton = new qx.ui.form.Button("Save");
		saveButton.setKeepFocus(true);
		saveButton.addListener("execute", this.save, this);

        this.addListener('keydown', function (e) {
            if (e.isCtrlPressed()) {
              if (e.getKeyIdentifier() === 'S') {
                e.preventDefault();
                this.save();
              }
              if (e.getKeyIdentifier() === 'G') {
                e.preventDefault();
                this.__textArea.getAce().findNext();
              }
            }
        }, this);

		this.__executeButton = new qx.ui.form.Button("execute");
		this.__executeButton.setKeepFocus(true);
		this.__executeButton.addListener("execute", this.__onExecute, this);

		var spinner = new qx.ui.form.Spinner(5, 15, 50);
        this.__spinner = spinner;
		spinner.addListener('changeValue', function (e) {
            this.__textArea.setFontSize(e.getData());
        }, this);

		var buttonsContainer = new qx.ui.container.Composite();
		buttonsContainer.setLayout(new qx.ui.layout.HBox());
		buttonsContainer.add(this.__executeButton, {flex : 1});
		buttonsContainer.add(this.__reloadButton, {flex : 1});
		buttonsContainer.add(saveButton, {flex : 1});
        buttonsContainer.add (spinner);
		this.add(buttonsContainer);

		var textArea = this.__textArea = new desk.AceContainer();
		if (file) {
			this.openFile(file);
		}

        this.add(textArea, {flex : 1});
		this.open();
		this.center();
        this.addListener('close', function () {
            this.__textArea.dispose();
            this.__reloadButton.dispose();
            this.__executeButton.dispose();
            this.destroy();
        }, this);
	},

	statics : {
		codeInTextEditor : null,
		codeVersion : 0
	},

	members : {
		__textArea : null,
		__file : null,
		__reloadButton : null,
		__executeButton : null,
        __saveButton : null,
		__scriptContainer : null,

		__onExecute : function() {
			desk.TextEditor.codeInTextEditor = null;
			var bodyContainer = document.getElementsByTagName('body')[0];
			var scriptContainer = this.__scriptContainer;
			if (scriptContainer) {
				bodyContainer.removeChild(scriptContainer);
			}
			scriptContainer = this.__scriptContainer = document.createElement('script');
			scriptContainer.setAttribute('type','text/javascript');
			scriptContainer.text = 'desk.TextEditor.codeInTextEditor = function(){' +
				this.__textArea.getCode() + '\n};' + '\n//@ sourceURL=v' +
				desk.TextEditor.codeVersion + '-' +
				desk.FileSystem.getFileName(this.__file);
			desk.TextEditor.codeVersion++;
			bodyContainer.appendChild(scriptContainer);

			if (desk.TextEditor.codeInTextEditor) {
				desk.TextEditor.codeInTextEditor();
			} else {
				alert('Error while parsing your code, please check syntax');
			}
		},

        save : function () {
            this.__saveButton.setEnabled(false);
            desk.FileSystem.writeFile(this.__file, this.__textArea.getCode(), function () {
                this.__saveButton.setEnabled(true);
                console.log('file saved');
            }, this);
        },

		/**
		* Opens a file
		*
		* @param file {String} the file to edit
		*/
		openFile : function (file) {
			switch (desk.FileSystem.getFileExtension(file)) {
				case "cxx":
				case "cpp":
				case "h":
				case "txx":
				case "c":
					this.__textArea.setMode("c_cpp");
					this.__textArea.useHighlight(true);
					this.__executeButton.setVisibility('excluded');
					break;
				case "js" :
					this.__executeButton.setVisibility('visible');
					this.__textArea.setMode("javascript");
					this.__textArea.useHighlight(true);
					break;
				default : 
					this.__executeButton.setVisibility('excluded');
					this.__textArea.useHighlight(false);
					break;
			}

			this.__file = file;
			this.__reloadButton.setEnabled(false);
			desk.FileSystem.readFile(file, function (error, result) {
				this.__textArea.setCode(result);
				this.setCaption(file);
				this.__reloadButton.setEnabled(true);
			}, this, true);
		}
	}
});
