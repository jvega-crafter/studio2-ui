var openerChildformMgr;
var parentWindowLocation;

try {
    if(window.opener) {
        openerChildformMgr = window.opener.CStudioAuthoring.ChildFormManager;
        parentWindowLocation = window.opener.location.href;
    }
    else {
        openerChildformMgr = window.CStudioAuthoring.ChildFormManager;
        parentWindowLocation = window.location.href;
    }
}
catch(err) {
    openerChildformMgr = window.CStudioAuthoring.ChildFormManager;
    parentWindowLocation = window.location.href;
}

var getFormSize = function(id){
    var formSize;

    if(document.getElementsByClassName("studio-ice-container-"+id).length > 0){
        formSize = document.getElementsByClassName("studio-ice-container-"+id)[0].offsetHeight;
    }else{
        formSize = parent.document.getElementsByClassName("studio-ice-container-"+id)[0].offsetHeight;
    }

    return formSize;
}

var setFormSize = function(height,id){
    var form;

    if(document.getElementsByClassName("studio-ice-container-"+id).length){
        form = document.getElementsByClassName("studio-ice-container-"+id)[0];
    }else{
        form = parent.document.getElementsByClassName("studio-ice-container-"+id)[0];
    }

    form.style.height = height+'px';
}

var CStudioForms = CStudioForms || function() {
        var cfe = {};

        var CMgs = CStudioAuthoring.Messages;
        var formsLangBundle = CMgs.getBundle("forms", CStudioAuthoringContext.lang);
        var cstopic = crafter.studio.preview.cstopic;
        var repeatEdited = false;
        var saveDraft = false;

        // private methods

        /**
         * A data source provides data and services to fields
         */
        var CStudioFormDatasource = function(id, form, properties)  {
            this.id = id;
            this.form = form;
            this.properties = properties;
            return this;
        };

        CStudioFormDatasource.prototype = {

            /**
             * type of data returned by datasource
             */
            getInterface: function() {
                return "";
            },

            /**
             * unique type for datasource
             */
            getType: function() {
                return "";
            },

            /**
             * return the name unless overwritten
             */
            getLabel: function() {
                return this.getName();
            },

            /**
             * unique id for datasource
             */
            getName: function() {
                return "";
            },

            /**
             * datasource properties
             */
            getSupportedProperties: function() {
                return [];
            },

            /**
             * handle macros in file paths
             */
            processPathsForMacros: function(path) {
                var model = this.form.model;

                if(path.indexOf("{objectId}") != -1) {
                    path = path.replace("{objectId}", model["objectId"]);
                }

                if(path.indexOf("{objectGroupId}") != -1) {
                    path = path.replace("{objectGroupId}", model["objectGroupId"]);
                }

                if(path.indexOf("{objectGroupId2}") != -1) {
                    path = path.replace("{objectGroupId2}", model["objectGroupId"].substring(0,2))
                }

                /* Date macros */
                var currentDate = new Date();
                if(path.indexOf("{year}") != -1) {
                    path = path.replace("{year}", currentDate.getFullYear());
                }

                if(path.indexOf("{month}") != -1) {
                    path = path.replace("{month}", ("0" + (currentDate.getMonth() + 1)).slice(-2));
                }

                if(path.indexOf("{parentPath}") != -1) {
                    path = path.replace("{parentPath}", CStudioAuthoring.Utils.getQueryParameterByName("path").replace(/\/[^\/]*\/[^\/]*\/([^\.]*)(\/[^\/]*\.xml)?$/, "$1"));
                }

                return path;
            }
        };

        /**
         * Field controller
         * The purpose of this class is to allow implementation specific rules to be implemented
         */
        var FormController = function()  {
            return this;
        };

        FormController.prototype = {

            /**
             * initialize controller
             */
            initialize: function(form) {
                this.form = form;
            },

            /**
             * allows you to do any data manipulation or custom validation rules you want
             * return true to go forward with save.  Return false to stop the save
             */
            onBeforeSave: function() {
                return true;
            },

            /**
             * called by for each field on a form. By returning true the field will be included in the form.
             */
            isFieldRelevant: function(field) {
                return true;
            }
        };

        /**
         * Field base class
         */
        var CStudioFormField = function(id, form, owner, properties, constraints)  {
            this.owner = owner;
            this.owner.registerField(this);
            this.errors = [];
            this.properties = properties;
            this.constraints = constraints;
            this.inputEl = null;
            this.countEl = null;
            this.required = false;
            this.value = "_not-set";
            this.form = form;
            this.id = id;
            this.delayedInit = false;

            return this;
        };

        CStudioFormField.prototype = {

            getFixedId: function() {
                return "";
            },

            focusOut: function() {
            },

            focusIn: function() {
            },

            /**
             * A temp fix for many controls calling renderValidation with 2 params
             * This should be merged into one method
             **/
            renderValidation: function(onOff, valid) {
                renderValidation(onOff);
            },

            renderValidation: function(onOff) {
                var valid = true;

                for (key in this.errors) {
                    valid = false;
                    break;
                }

                var validationEl =
                    YAHOO.util.Dom.getElementsByClassName("cstudio-form-control-validation", null, this.containerEl)[0];

                if(validationEl) {
                    YAHOO.util.Dom.removeClass(validationEl, 'cstudio-form-control-valid');
                    YAHOO.util.Dom.removeClass(validationEl, 'fa-check');
                    YAHOO.util.Dom.removeClass(validationEl, 'cstudio-form-control-invalid');
                    YAHOO.util.Dom.removeClass(validationEl, 'fa-times');

                    if(onOff == true) {
                        if(valid == true) {
                            YAHOO.util.Dom.addClass(validationEl, 'cstudio-form-control-valid fa-check');
                        }
                        else {
                            YAHOO.util.Dom.addClass(validationEl, 'cstudio-form-control-invalid fa-times');
                        }
                    }
                }
            },

            /**
             * factory method
             */
            create: function() {
            },

            /**
             * get requirement count
             */
            getRequirementCount: function() {
                var count = 0;

                for(var i=0; i<this.constraints.length; i++) {
                    var constraint = this.constraints[i];

                    if(constraint.name == "required" && constraint.value == "true") {
                        count++;
                    }
                }

                return count;
            },

            /**
             * register validation error
             */
            setError: function(errorId, message) {
                this.errors[errorId] = message;
                this.owner.notifyValidation();
            },

            /**
             * remove a specific error
             */
            clearError: function(errorId) {
                delete this.errors[errorId];
                this.owner.notifyValidation();
            },

            /**
             * remove all errors
             */
            clearAllErrors: function() {
                this.errors = [];
                this.owner.notifyValidation();
            },

            /**
             * return errors
             */
            getErrors: function() {
                return this.errors;
            },

            /**
             * initialize module
             */
            initialize: function(config, containerEl, lastTwo) {
                this.containerEl = containerEl;

                for(var j=0; j<config.constraints.length; j++) {
                    var constraint = config.constraints[j];

                    if(constraint.name == "required" && constraint.value == "true") {
                        this.required = true;
                    }
                }

                this.render(config, containerEl, lastTwo, false);

                if (this.delayedInit) {
                    if (this.form.asyncFields == 0) {
                        var ajaxOverlayEl = document.getElementById("ajax-overlay");
                        YDom.addClass(ajaxOverlayEl, "visible");
                    }
                    this.form.asyncFields++;
                }

                return this;
            },

            /**
             * render
             */
            render: function(config, containerEl) {
                containerEl.innerHTML = "Widget";
                containerEl.style.color = "white";
                containerEl.style.border = "1px solid black";
                containerEl.style.backgroundColor = "#0176B1";
                containerEl.style.width = "400px";
                containerEl.style.marginLeft = "auto";
                containerEl.style.marginRight = "auto";
                containerEl.style.textAlign = "center";
            },

            _onChange: function() {

            },

            getLabel: function() {
                return this.getName();
            },

            getName: function() {
                return "";
            },

            getValue: function() {
                return "";
            },

            setValue: function(value) {
            },

            getSupportedProperties: function() {
                return [];
            },

            renderHelp: function(config, containerEl){
                if(!Array.isArray(config.help) && config.help !== ""){
                    var helpEl = document.createElement("span");
                    YAHOO.util.Dom.addClass(helpEl, 'hint');
                    YAHOO.util.Dom.addClass(helpEl, 'cstudio-form-field-help');
                    helpEl.innerHTML = "&nbsp;";
                    containerEl.appendChild(helpEl);

                    YAHOO.util.Event.on(helpEl, 'mouseover', function(evt, context) {
                        YAHOO.util.Dom.addClass(helpEl, 'on');
                    }, this);

                    YAHOO.util.Event.on(helpEl, 'mouseout', function(evt, context) {
                        YAHOO.util.Dom.removeClass(helpEl, 'on');
                    }, this);

                    YAHOO.util.Event.on(helpEl, 'click', function(evt, context) {
                        var helpDialogEl = document.getElementById("help-dialog");
                        if(!helpDialogEl) {
                            helpDialogEl = document.createElement("div");
                            helpDialogEl.id = 'help-dialog';
                            YAHOO.util.Dom.addClass(helpDialogEl, "seethrough");

                            document.body.appendChild(helpDialogEl);
                        }

                        var maskEl = document.createElement("div");
                        YAHOO.util.Dom.addClass(maskEl, "dialog-dialog-mask");
                        maskEl.style.display = 'block';
                        maskEl.id = 'dialogMask';
                        //window.parent.document.body.appendChild(maskEl);
                        document.body.appendChild(maskEl);

                        helpDialogEl.style.display = "block";
                        helpDialogEl.innerHTML = "";


                        var titleEl = document.createElement("div");
                        YAHOO.util.Dom.addClass(titleEl, "dialog-title");
                        titleEl.innerHTML = "Help";
                        helpDialogEl.appendChild(titleEl);

                        var helpDialogContainerEl = document.createElement("div");
                        YAHOO.util.Dom.addClass(helpDialogContainerEl, "dialog-body");
                        helpDialogEl.appendChild(helpDialogContainerEl);

                        helpDialogContainerEl.innerHTML = CStudioForms.Util.unEscapeXml(config.help);

                        var buttonContainerEl = document.createElement("div");
                        YAHOO.util.Dom.addClass(buttonContainerEl, "dialog-button-bar");
                        helpDialogEl.appendChild(buttonContainerEl);

                        var okEl = document.createElement("div");
                        YAHOO.util.Dom.addClass(okEl, "btn btn-primary");
                        okEl.innerHTML = "OK";
                        buttonContainerEl.appendChild(okEl);

                        YAHOO.util.Event.on(okEl, 'click', function(evt) {
                            var helpDialogEl = document.getElementById("help-dialog");
                            var dialogMask = document.getElementById("dialogMask");
                            helpDialogEl.parentNode.removeChild(helpDialogEl);
                            dialogMask.parentNode.removeChild(dialogMask);
                        }, okEl);
                    }, this);
                }
            },

            escapeXml: function(value) {
                if(value && typeof value === 'string') {
                    value = value.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/&nbsp;/g, '&amp;nbsp;');
                }

                return value;
            },

            unEscapeXml: function(value) {
                if(value && typeof value === 'string') {
                    value = value.replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '\"')
                        .replace(/&amp;nbsp;/g, '&nbsp;');
                }

                return value;
            }
        };

        /**
         * Section base class
         */
        var CStudioFormSection = function(owner, containerEl) {
            this.fields = [];
            this.owner = owner;
            this.containerEl = containerEl;
            return this;
        };

        CStudioFormSection.prototype = {


            /**
             * register field with section
             */
            registerField: function(field) {
                this.fields[this.fields.length] = field;
            },

            /**
             * get validation state
             */
            getValidationState: function() {
                var requirements = 0;
                var invalid = 0;

                for(var i=0; i<this.fields.length; i++) {
                    var field = this.fields[i];
                    requirements += field.getRequirementCount();

                    var errors = field.getErrors();
                    var errsize = 0, key;
                    for (key in errors) {
                        if (errors.hasOwnProperty(key)) invalid++;
                    }
                }

                return { requirements: requirements, invalid: invalid };
            },

            getValidationStateDraft: function() {
                var requirements = 0;
                var invalid = 0;

                for(var i=0; i<this.fields.length; i++) {
                    var field = this.fields[i];

                    if(field.id == "file-name") {
                        requirements += field.getRequirementCount();

                        var errors = field.getErrors();
                        var errsize = 0, key;
                        for (key in errors) {
                            if (errors.hasOwnProperty(key)) invalid++;
                        }
                    }
                }

                return { requirements: requirements, invalid: invalid };
            },

            notifyValidation: function() {
                var validationEl = YAHOO.util.Dom.getElementsByClassName("cstudio-form-section-validation", null, this.containerEl)[0];
                var indicatorEl = YAHOO.util.Dom.getElementsByClassName("cstudio-form-section-indicator", null, this.containerEl)[0];

                var state = this.getValidationState();

                if(indicatorEl) {
                    YAHOO.util.Dom.removeClass(indicatorEl, 'cstudio-form-section-valid');
                    YAHOO.util.Dom.removeClass(indicatorEl, 'fa-check');
                    YAHOO.util.Dom.removeClass(indicatorEl, 'cstudio-form-section-invalid');
                    YAHOO.util.Dom.removeClass(indicatorEl, 'fa-times');

                    if(state.requirements > 0 && state.invalid != 0) {
                        validationEl.innerHTML = CMgs.format(formsLangBundle, "sectionValidation", state.invalid, state.requirements);

                        YAHOO.util.Dom.addClass(indicatorEl, 'cstudio-form-section-invalid');
                        YAHOO.util.Dom.addClass(indicatorEl, 'fa-times');
                    }
                    else {
                        validationEl.innerHTML = "";
                        YAHOO.util.Dom.addClass(indicatorEl, 'cstudio-form-section-valid');
                        YAHOO.util.Dom.addClass(indicatorEl, 'fa-check');
                    }
                }
            }
        };

        /**
         * form base class
         */
        var CStudioForm = function(name, formDefinition, model, style, customController) {
            this.id = name;
            this.style = style;
            this.definition = formDefinition;
            this.dynamicFields = [];
            this.sections = [];
            this.datasources = [];
            this.model = model;
            this.beforeSaveCallbacks = [];
            this.afterSaveCallbacks = [];
            this.beforeUiRefreshCallbacks = [];
            this.customController = customController;
            this.asyncFields = 0;   // Number of asynchronous fields (fields that take a while to load -e.g. the RTE)

            if(customController) {
                customController.initialize(this);
            }

            return this;
        };

        CStudioForm.prototype = {

            registerDynamicField: function(name) {
                this.dynamicFields.push(name);
            },

            registerBeforeSaveCallback: function(callback) {
                this.beforeSaveCallbacks[this.beforeSaveCallbacks.length] = callback;
            },

            registerAfterSaveCallback: function(callback) {
                this.afterSaveCallbacks[this.afterSaveCallbacks.length] = callback;
            },


            registerBeforeUiRefreshCallback: function(callback) {
                this.beforeUiRefreshCallbacks[this.beforeUiRefreshCallbacks.length] = callback;
            },

            isInError: function() {
                var inError = false;

                for(var i=0; i<this.sections.length; i++) {
                    if(this.sections[i].getValidationState().invalid > 0) {
                        inError = true;
                        break;
                    }
                }

                return inError;
            },

            isInErrorDraft: function() {
                var inError = false;

                for(var i=0; i<this.sections.length; i++) {
                    if(this.sections[i].getValidationStateDraft().invalid > 0) {
                        inError = true;
                        break;
                    }
                }

                return inError;
            },

            getModelValue: function(id){
                var value = null;
                if(id.indexOf("|") != -1) {
                    var parts = id.split("|");
                    var repeatGroup = parts[0];
                    var repeatIndex = parseInt(parts[1]);
                    var repeatField = parts[2];

                    if (this.model[repeatGroup].length > 0 && (this.model[repeatGroup][repeatIndex] != null || this.model[repeatGroup][repeatIndex] != undefined)) {
                        this.model[repeatGroup][repeatIndex][repeatField] = value;
                    }
                }
                else {
                    value = this.model[id];
                }

                return value;
            },

            updateModel: function(id, value) {
                if(id.indexOf("|") != -1) {
                    var parts = id.split("|");
                    var repeatGroup = parts[0];
                    var repeatIndex = parseInt(parts[1]);
                    var repeatField = parts[2];

                    try {
                        this.model[repeatGroup][repeatIndex][repeatField] = value;
                    }
                    catch(err) {

                    }
                }
                else {
                    this.model[id] = value;
                }

                CStudioForms.updatedModel = this.model;
            },

            onBeforeSave: function(paramObj) {
                var callbacks = this.beforeSaveCallbacks;
                for(var i=0; i<callbacks.length; i++) {
                    var callback = callbacks[i];
                    callback.beforeSave(paramObj);
                }
            },

            onBeforeUiRefresh: function() {
                var callbacks = this.beforeUiRefreshCallbacks;
                for(var i=0; i<callbacks.length; i++) {
                    var callback = callbacks[i];
                    callback.beforeUiRefresh();
                }
            },

            onAfterSave: function() {
                var callbacks = this.afterSaveCallbacks;
                for(var i=0; i<callbacks.length; i++) {
                    var callback = callbacks[i];
                    callback.afterSave();
                }
            },

            setFocusedField: function(field) {
                var previousFocusedField = this.focusedField;
                this.focusedField = field;

                if((previousFocusedField && (previousFocusedField !== field)) || field == null)
                    if(previousFocusedField && previousFocusedField.focusOut) {
                        previousFocusedField.focusOut();
                    }

                if(field) {
                    if(this.focusedField.focusIn) {
                        this.focusedField.focusIn();
                    }
                }
                else {
                    this.focusedField = null;
                }
            }
        };


        // public methods

        cfe.Controls = {};
        cfe.Datasources = {};
        cfe.Forms = [];
        cfe.CStudioFormField = CStudioFormField;
        cfe.CStudioFormSection = CStudioFormSection;
        cfe.CStudioForm = CStudioForm;
        cfe.FormControllers = {};
        cfe.FormController = FormController;
        cfe.CStudioFormDatasource = CStudioFormDatasource;
        cfe.engine = {};

        /**
         * Form Rendering Engine
         */
        cfe.engine = {
            /**
             * main entrypoint for the forms engine, renders a form in the given style
             * @param formId
             *      path to the form you want to render
             * @param style
             *      style Id you want the form rendered with
             */
            render: function(formId, style) {
                var _self = this;
                CStudioAuthoring.Utils.addCss('/static-assets/themes/cstudioTheme/css/forms-'+style+'.css');

                // load the definition
                var formId = CStudioAuthoring.Utils.getQueryVariable(location.search, "form");
                var edit = CStudioAuthoring.Utils.getQueryVariable(location.search, "edit");
                var readonly = (CStudioAuthoring.Utils.getQueryVariable(location.search, "readonly") == "true")? true: false;

                var formDefinition = CStudioForms.Util.loadFormDefinition(formId, {
                    success: function(formDef) {
                        CStudioForms.Util.LoadFormConfig(formId, {
                            success: function(customControllerClass, formConfig) {
                                formDef.config = formConfig;    // Make the form configuration available in the form definition
                                var path = CStudioAuthoring.Utils.getQueryVariable(location.search, "path");
                                if(path && path.indexOf(".xml") != -1) {
                                    //Check if the form is locked
                                    CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, path, {
                                        failure: crafter.noop,
                                        success: function (itemTO) {
                                            if (itemTO.item.lockOwner != "" && itemTO.item.lockOwner != CStudioAuthoringContext.user) {
                                                readonly = true;
                                            }

                                            CStudioAuthoring.Service.lookupContentType(CStudioAuthoringContext.site, formId, {
                                                success: function (typeInfoJson) {
                                                    formDef.contentAsFolder = typeInfoJson.contentAsFolder;

                                                    if((edit && edit=="true") || readonly == true){
                                                        CStudioAuthoring.Service.getContent(path, !readonly, {
                                                            success: function(content) {
                                                                var dom = null;

                                                                try {
                                                                    dom = (new window.DOMParser()).parseFromString(content, "text/xml");
                                                                    dom = dom.documentElement;
                                                                } catch(err) {
                                                                    CStudioAuthoring.Operations.showSimpleDialog(
                                                                        "loadContentError-dialog",
                                                                        CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                                                        CMgs.format(formsLangBundle, "notification"),
                                                                        CMgs.format(formsLangBundle, "errFailedToLoadContent", "parse: "+err),
                                                                        null,
                                                                        YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                                                        "studioDialog"
                                                                    );
                                                                }

                                                                _self._renderFormWithContent(dom, formId, formDef, style, customControllerClass, readonly);

                                                            },
                                                            failure: function(err) {
                                                                CStudioAuthoring.Operations.showSimpleDialog(
                                                                    "loadContentError-dialog",
                                                                    CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                                                    CMgs.format(formsLangBundle, "notification"),
                                                                    CMgs.format(formsLangBundle, "errFailedToLoadContent", ""+err),
                                                                    null,
                                                                    YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                                                    "studioDialog"
                                                                );
                                                            }
                                                        });
                                                    }
                                                },
                                                failure: crafter.noop
                                            });
                                        }
                                    }, false);
                                } else {
                                    // new content item

                                    var contentTypeCb = {
                                        success: function (typeInfoJson) {
                                            formDef.contentAsFolder = typeInfoJson.contentAsFolder;
                                            var emptyContentModel = {
                                                children: [],
                                                responseXML: {
                                                    documentElement: {
                                                        children: []
                                                    }
                                                }
                                            };

                                            _self._renderFormWithContent(emptyContentModel, formId, formDef, style, customControllerClass);

                                        },

                                        failure: function () {
                                        }
                                    };

                                    CStudioAuthoring.Service.lookupContentType(
                                        CStudioAuthoringContext.site,
                                        formId,
                                        contentTypeCb);
                                }
                            },
                            failure: crafter.noop
                        });
                    },
                    failure: function(err) {

                    }
                });
            },

            _getPageLocation: function (path) {
                var pathStr = path.replace(/^\/site\/website\//,"");    // Remove string "/site/website/" from path(Page)
                if( pathStr.match(/^\/site\/components\//) )
                    pathStr = pathStr.replace(/^\/site\//,"");// Remove string "/site/" from path (Component)
                pathStr = pathStr.replace(/\/index\.xml$/,"");// Remove string /index.xml from path
                pathStr = pathStr.replace(/\.xml$/,""); // Remove string .xml
                return pathStr.replace(/\//g," » ");   // Replace forward slash (/) with " >> "
            },

            _createDialog: function(){
                var dialog = new YAHOO.widget.SimpleDialog("closeUserWarning",
                    { width: "300px",fixedcenter: true, visible: false, draggable: false, close: false, modal: true,
                        text: message, icon: YAHOO.widget.SimpleDialog.ICON_WARN,
                        constraintoviewport: true
                    });
                dialog.setHeader(CMgs.format(formsLangBundle, "cancelDialogHeader"));
                dialog.render(document.body);
                dialogEl = document.getElementById("closeUserWarning");
                dialogEl.dialog = dialog;
            },

            _getPageName: function(content) {
                var _content = content.responseXML ? content.responseXML : content;
                if (_content) {
                    var internalNameArr = "";
                    try{
                        internalNameArr = _content.getElementsByTagName("internal-name");
                        return (internalNameArr.length <= 0) ? "" :
                            (YAHOO.env.ua.ie) ? internalNameArr[0].text :
                                internalNameArr[0].textContent;
                    } catch(err) {
                        return "";
                    }
                }
                return "";
            },

            _renderFormWithContent: function(content, formId, formDef, style, customControllerClass, readOnly) {

                function getDateTimeObject(timeObj) {
                    return {
                        "date" : (timeObj.getUTCMonth() + 1) + "/" + timeObj.getUTCDate() + "/" + timeObj.getUTCFullYear(),
                        "time" : timeObj.getUTCHours() + ":" + timeObj.getUTCMinutes() + ":" + timeObj.getUTCSeconds()
                    }
                }

                var closeAjaxOverlay = function () {
                    if (form.asyncFields == 0) {
                        // Form can now be safely manipulated
                        var ajaxOverlayEl = document.getElementById("ajax-overlay");
                        YDom.replaceClass(ajaxOverlayEl, "visible", "invisible");
                    }
                };
                var readonly = readOnly || (CStudioAuthoring.Utils.getQueryVariable(location.search, "readonly") == "true")? true: false;
                var contentType = CStudioAuthoring.Utils.getQueryVariable(location.search, "form");
                var path = CStudioAuthoring.Utils.getQueryVariable(location.search, "path");
                var edit = CStudioAuthoring.Utils.getQueryVariable(location.search, "edit");

                try {
                    if(window.opener) {
                        window.previewTargetWindowId = (window.opener.previewTargetWindowId)
                            ? window.opener.previewTargetWindowId : window.opener.name;
                    }
                } catch(err) {}

                var contentDom = content;
                var contentMap = CStudioForms.Util.xmlModelToMap(contentDom);

                var customController = null;

                if(customControllerClass) {
                    customController = new customControllerClass();
                }

                var form = new CStudioForm(formId, formDef, contentMap, style, customController);

                CStudioForms.initialModel = JSON.parse(JSON.stringify(form.model));

                form.readOnly = readonly;
                form.path = path;

                var timezone = "GMT";

                CStudioAuthoring.Service.lookupConfigurtion(
                    CStudioAuthoringContext.site, "/site-config.xml", {
                        failure: crafter.noop,
                        success: function(config){
                            timezone = config['default-timezone'];
                        }
                    });

                // Timestamp in UTC
                var nowTimestamp = new Date().toISOString();

                /*
                 * register before save callback for created date and modified date
                 * internal form properties
                 */
                form.registerBeforeSaveCallback({ beforeSave: function () {

                    var oModel = form.model;

                    if (oModel.createdDate === undefined || oModel.createdDate === 'undefined' || oModel.createdDate === '') {
                        oModel.createdDate = nowTimestamp;
                        oModel.createdDate_dt = nowTimestamp;
                    }

                    oModel.lastModifiedDate = nowTimestamp;
                    oModel.lastModifiedDate_dt = nowTimestamp;

                }, renderPersist: true });

                form.definition = formDef;

                form.definition.pageName = this._getPageName(content);

                form.definition.pageLocation = this._getPageLocation(path);
                form.containerEl = document.getElementById("formContainer"); 

                var me = this;

                this._loadDatasources(form, function(loaded, notLoaded){

                    var iceId = CStudioAuthoring.Utils.getQueryVariable(location.search, "iceId");
                    var iceComponent = CStudioAuthoring.Utils.getQueryVariable(location.search, "iceComponent");

                    if(iceId && iceId != "") {
                        var html = me._renderIceLayout(form);
                        form.containerEl.innerHTML = html;
                        var readOnlyBannerEl = document.getElementById('cstudio-form-readonly-banner');
                        if(form.readOnly == true) {
                            YDom.removeClass(readOnlyBannerEl, "hidden");
                        }
                        me._renderInContextEdit(form, iceId);
                    } else {
                    
                        var html = me._renderFormLayout(form);
                        form.containerEl.innerHTML = html;
                    
                    
                        var readOnlyBannerEl = document.getElementById('cstudio-form-readonly-banner');
                        if(form.readOnly == true) {
                            YDom.removeClass(readOnlyBannerEl, "hidden");
                        }
                    
                        
                        var expandAllEl = document.getElementById('cstudio-form-expand-all');
                        var collapseAllEl = document.getElementById('cstudio-form-collapse-all');
                        expandAllEl.form = form;
                        collapseAllEl.form = form;
                    
                        expandAllEl.onclick = function() {
                            var sections = form.sections;
                            for(var q=0; q<sections.length; q++) {
                                var section = sections[q];
                                var sectionBodyEl = section.sectionBodyEl;
                                var sectionOpenCloseWidgetEl = section.sectionOpenCloseWidgetEl;
                    
                                sectionBodyEl.style.display = "block";
                                YAHOO.util.Dom.removeClass(sectionOpenCloseWidgetEl, 'cstudio-form-section-widget-closed');
                            }
                        }
                    
                        collapseAllEl.onclick = function() {
                            var sections = form.sections;
                            for(var q=0; q<sections.length; q++) {
                                var section = sections[q];
                                var sectionBodyEl = section.sectionBodyEl;
                                var sectionOpenCloseWidgetEl = section.sectionOpenCloseWidgetEl;
                    
                                sectionBodyEl.style.display = "none";
                                YAHOO.util.Dom.addClass(sectionOpenCloseWidgetEl, 'cstudio-form-section-widget-closed');
                            }
                        }
                    
                        me._renderFormSections(form);
                    }
                    
                    var buildEntityIdFn = function(draft) {
                        var entityId = path.replace(".html", ".xml");
                        var changeTemplate = CStudioAuthoring.Utils.getQueryVariable(location.search, "changeTemplate");
                        var length = entityId.length;
                        var index_html = "";
                        var fileName   = form.model["file-name"];
                        var folderName = (form.definition.contentAsFolder || form.definition.contentAsFolder == "true") ? form.model["folder-name"] : undefined;
                        /*
                        * No folderName means it is NOT a content-as-folder content type.
                        * See file-name.js function _onChange().
                        */
                    
                        if(form.definition.objectType == "page"){
                            var pagePath = entityId.replace('/site/website/', '');
                            file = pagePath.split("/").pop();
                    
                            if((file.indexOf(".xml") > -1) && (file != "index.xml")) {
                                folderName = "";
                            }
                        }
                    
                        if (changeTemplate == "true") {
                            if (form.definition.contentAsFolder == "false") {
                                entityId = entityId.replace("/index.xml");
                            }
                        }
                    
                        if (folderName != undefined && folderName.length == 0)
                            folderName = undefined;
                        if (folderName) {
                            index_html = "/index.xml";
                            if (fileName != index_html.substring(1))
                            {
                                CStudioAuthoring.Operations.showSimpleDialog(
                                    "errExpectedIndexXml-dialog",
                                    CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                    CMgs.format(formsLangBundle, "notification"),
                                    CMgs.format(formsLangBundle, "errExpectedIndexXml"),
                                    null,
                                    YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                    "studioDialog"
                                );
                            }
                            if (entityId.indexOf(index_html) == length - 10)
                                entityId = entityId.substring(0, length - 10);
                        }
                        else if (fileName.indexOf(".xml") != fileName.length - 4)
                        {
                            form.model["file-name"] = (fileName += ".xml");
                        }
                        if (edit == "true" || form.readOnly || draft) { //This is also necessary in readonly mode
                            // Get parent folder
                            entityId = entityId.substring(0, entityId.lastIndexOf("/"));
                        }
                        if (folderName) {
                            entityId += "/" + folderName + index_html;
                        }
                        else {
                            entityId += "/" + fileName;
                        }
                        if(!(form.isInError() && draft==false) && !(form.isInErrorDraft() && draft ==true)){
                            saveDraft = true;
                        }
                        return entityId;
                    }
                    
                    //If the form is opened in view mode, we don't need show the warn message or unlock the item
                    var showWarnMsg = (form.readOnly)?false:true;
                    var _notifyServer = (form.readOnly)?false:true;
                    var message = CMgs.format(formsLangBundle, "cancelDialogBody");
                    
                    var queryString = document.location.search;
                    var editorId = CStudioAuthoring.Utils.getQueryVariable(queryString, "editorId");
                    var iceWindowCallback = CStudioAuthoring.InContextEdit.getIceCallback(editorId);
                    
                    var saveFn = function(preview,draft) {
                        showWarnMsg = false;
                        var saveDraft = (draft == true) ? true : false;
                    
                        var saveAndCloseEl = document.getElementById("cstudioSaveAndClose");
                        var saveAndCloseDraftEl = document.getElementById("cstudioSaveAndCloseDraft");
                        var saveAndPreviewEl = document.getElementById("cstudioSaveAndPreview");
                    
                        if(saveAndCloseEl) saveAndCloseEl.disabled = true;
                        if(saveAndPreviewEl) saveAndPreviewEl.disabled = true;
                        if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = true;
                    
                        var entityId = buildEntityIdFn(draft);
                        var entityFile = entityId.substring(entityId.lastIndexOf('/') + 1);
                        if((form.isInError() && draft==false) || (form.isInErrorDraft() && draft ==true)) {
                            var dialogEl = document.getElementById("errMissingRequirements");
                            if(!dialogEl){
                                var dialog = new YAHOO.widget.SimpleDialog("errMissingRequirements",
                                    { width: "375px",fixedcenter: true, visible: false, draggable: false, close: false, modal: true,
                                        text: CMgs.format(formsLangBundle, "errMissingRequirements"), icon: YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                        constraintoviewport: true,
                                        buttons: [ { text:CMgs.format(formsLangBundle, "ok"),  handler:function(){this.hide();}, isDefault:false } ]
                                    });
                                dialog.setHeader(CMgs.format(formsLangBundle, "cancelDialogHeader"));
                                dialog.render(document.body);
                                dialogEl = document.getElementById("errMissingRequirements");
                                dialogEl.dialog = dialog;
                            }
                            dialogEl.dialog.show();
                            //alert(CMgs.format(formsLangBundle, "errMissingRequirements"));
                            if(saveAndCloseEl) saveAndCloseEl.disabled = false;
                            if(saveAndPreviewEl) saveAndPreviewEl.disabled = false;
                            if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = false;
                            return;
                        }
                    
                        form.onBeforeSave({ "preview" : preview });
                    
                        if(form.customController) {
                            if(form.customController.onBeforeSave() == false) {
                                return;
                            }
                        }
                    
                        var xml = CStudioForms.Util.serializeModelToXml(form, saveDraft);
                    
                        var serviceUrl = "/api/1/services/api/1/content/write-content.json" +
                            "?site=" + CStudioAuthoringContext.site +
                            "&phase=onSave" +
                            "&path=" + entityId +
                            "&fileName=" + entityFile +
                            "&user=" + CStudioAuthoringContext.user +
                            "&contentType=" + contentType;
                    
                        if(path != entityId && edit && edit == "true") {
                            // this is a rename
                            serviceUrl += "&oldContentPath=" + path;
                        }
                    
                        if(preview || draft==true) {
                            serviceUrl += "&unlock=false";
                        }
                        else {
                            serviceUrl += "&unlock=true";
                        }
                    
                        var createDialog = function(){
                            var dialogEl = document.getElementById("saveDraftWar");
                            if(!dialogEl) {
                                var dialog = new YAHOO.widget.SimpleDialog("saveDraftWar",
                                    { width: "300px", fixedcenter: true, visible: false, draggable: false, close: true, modal: true,
                                        text: "Draft Save Completed", icon: YAHOO.widget.SimpleDialog.ICON_INFO,
                                        constraintoviewport: true
                                    });
                                dialog.setHeader("Notification");
                                dialog.render(document.body);
                                dialogEl = document.getElementById("saveDraftWar");
                                dialogEl.dialog = dialog;
                            }
                            dialogEl.dialog.show();
                            setTimeout(function(){ dialogEl.dialog.hide();}, 1500);
                        }
                    
                        var saveCb = {
                            success: function() {
                                var getContentItemCb = {
                                    success: function(contentTO) {
                                        var previewUrl = CStudioAuthoringContext.previewAppBaseUri + contentTO.item.browserUri;
                                        path = entityId;
                                        var formId = CStudioAuthoring.Utils.getQueryVariable(location.search.substring(1), 'wid');
                    
                                        if(saveAndCloseEl) saveAndCloseEl.disabled = false;
                                        if(saveAndPreviewEl) saveAndPreviewEl.disabled = false;
                                        if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = false;
                    
                                        if(iceWindowCallback) {
                                            var value = form.model["internal-name"];
                                            var name = entityId;
                                            var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                    
                                            contentTO.initialModel = CStudioForms.initialModel;
                                            contentTO.updatedModel = CStudioForms.updatedModel;
                    
                                            iceWindowCallback.success(contentTO, editorId, name, value, draft);
                                            if(draft) {
                                                CStudioAuthoring.Utils.Cookies.createCookie("cstudio-save-draft","true");
                                                createDialog();
                                            }
                                            else {
                                                CStudioAuthoring.Utils.Cookies.eraseCookie("cstudio-save-draft");
                                                CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                                                CStudioAuthoring.Operations.refreshPreview();
                                            }
                                        }
                                        else {
                                            var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                                            if(draft) {
                                                CStudioAuthoring.Utils.Cookies.createCookie("cstudio-save-draft","true");
                                                CStudioAuthoring.Operations.refreshPreview();
                                                createDialog();
                                            }
                                            else {
                                                CStudioAuthoring.Utils.Cookies.eraseCookie("cstudio-save-draft");
                                                CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                                                CStudioAuthoring.Operations.refreshPreview();
                                            }
                                        }
                                        var page =  CStudioAuthoring.Utils.getQueryParameterURLParentWindow("page");
                                        var currentPage = page.split("/")[page.split("/").length - 1];
                                        var acnDraftContent = YDom.getElementsByClassName("acnDraftContent", null, parent.document)[0];
                                        if(acnDraftContent && !saveDraft){
                                            acnDraftContent.parentNode.removeChild(acnDraftContent);
                                        }
                                        if(!acnDraftContent && saveDraft && (contentTO.item.browserUri == page )){
                                            var noticeEl = document.createElement("div");
                                            parent.document.querySelector("#studioBar nav .container-fluid").appendChild(noticeEl);
                                            YDom.addClass(noticeEl, "acnDraftContent");
                                            noticeEl.innerHTML = CMgs.format(formsLangBundle, "wcmContentSavedAsDraft");
                                        }
                    
                                        if (typeof window.parent.CStudioAuthoring.editDisabled !== 'undefined') {
                                            for(var x = 0; x < window.parent.CStudioAuthoring.editDisabled.length; x++){
                                                window.parent.CStudioAuthoring.editDisabled[x].style.pointerEvents = "";
                                            }
                                            window.parent.CStudioAuthoring.editDisabled = [];
                                        }
                                    },
                                    failure: function (err) {
                                        CStudioAuthoring.Operations.showSimpleDialog(
                                            "error-dialog",
                                            CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                            CMgs.format(formsLangBundle, "notification"),
                                            err,
                                            [{ text: "OK",  handler:function(){
                                                this.hide();
                    
                                                form.onAfterSave();
                    
                                                if(saveAndCloseEl) saveAndCloseEl.disabled = false;
                                                if(saveAndPreviewEl) saveAndPreviewEl.disabled = false;
                                                if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = false;
                    
                                            }, isDefault:false }],
                                            YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                            "studioDialog"
                                        );
                    
                                    }
                                };
                    
                                if(entityId == path){
                                    CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, entityId, getContentItemCb, false, false);
                                }else{
                                    CStudioAuthoring.Service.lookupSiteContent(CStudioAuthoringContext.site, entityId, 1, 'default', getContentItemCb);
                                }
                    
                            },
                            failure: function(err) {
                                try{
                                    CStudioAuthoring.Operations.showSimpleDialog(
                                        "error-dialog",
                                        CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                        CMgs.format(formsLangBundle, "notification"),
                                        YAHOO.lang.JSON.parse(err.responseText).callstack[1].substring( YAHOO.lang.JSON.parse(err.responseText).callstack[1].indexOf(':')+1),
                                        null,
                                        YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                        "studioDialog"
                                    );
                                }catch (e) {
                                    var error = eval("(" + err.responseText + ")"),
                                        errorMessage = error.message ? error.message : CMgs.format(formsLangBundle, "errSaveFailed");

                                    CStudioAuthoring.Operations.showSimpleDialog(
                                        "error-dialog",
                                        CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                        CMgs.format(formsLangBundle, "notification"),
                                        errorMessage,
                                        null,
                                        YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                        "studioDialog"
                                    );
                                }
                                if(saveAndCloseEl) saveAndCloseEl.disabled = false;
                                if(saveAndPreviewEl) saveAndPreviewEl.disabled = false;
                                if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = false;
                            }
                        };
                    
                        YAHOO.util.Connect.setDefaultPostHeader(false);
                        YAHOO.util.Connect.initHeader("Content-Type", "application/xml; charset=utf-8");
                        YAHOO.util.Connect.initHeader(CStudioAuthoringContext.xsrfHeaderName, CStudioAuthoringContext.xsrfToken);
                        YAHOO.util.Connect.asyncRequest('POST', CStudioAuthoring.Service.createServiceUri(serviceUrl), saveCb, xml);
                    };
                    
                    var formControlBarEl = YDom.getElementsByClassName("cstudio-form-controls-container", null, form.containerEl)[0];
                    var formButtonContainerEl = document.createElement("div");
                    YDom.addClass(formButtonContainerEl, "cstudio-form-controls-button-container");
                    formControlBarEl.appendChild(formButtonContainerEl);
                    
                    function reloadParentWindow() {
                        window.parent.location.reload();
                    }
                    
                    var beforeUnloadFn = function(e){
                        if(showWarnMsg){
                            var evt = e || window.event;
                            evt.returnValue = message;
                            YAHOO.util.Event.stopEvent(evt);
                            return message;
                        }
                    };
                    
                    var unloadFn = function(e){
                        if(_notifyServer){
                            path = CStudioAuthoring.Utils.getQueryVariable(location.search, "path");
                            if( path && path.indexOf(".xml") != -1) {
                                var entityId = buildEntityIdFn(null);
                                CStudioAuthoring.Service.unlockContentItemSync(CStudioAuthoringContext.site, entityId);
                            }
                        }
                    };
                    
                    var cancelFn = function() {
                    
                        if(iceWindowCallback && iceWindowCallback.cancelled){
                            iceWindowCallback.cancelled();
                        }
                    
                        if (typeof window.parent.CStudioAuthoring.editDisabled !== 'undefined') {
                            for(var x = 0; x < window.parent.CStudioAuthoring.editDisabled.length; x++){
                                window.parent.CStudioAuthoring.editDisabled[x].style.pointerEvents = "";
                            }
                            window.parent.CStudioAuthoring.editDisabled = [];
                        }
                    
                        var flag = false;
                        if(form.sections.length){
                            for(var j=0; j < form.sections.length; j++){
                                if(form.sections[j].fields.length){
                                    for(var i=0; i < form.sections[j].fields.length; i++){
                                        if(form.sections[j].fields[i].edited == true){
                                            flag = true;
                                        }
                                    }
                                }
                            }
                        }
                        if(showWarnMsg && (flag || repeatEdited)){
                            var dialogEl = document.getElementById("closeUserWarning");
                            if(!dialogEl){
                                var dialog = new YAHOO.widget.SimpleDialog("closeUserWarning",
                                    { width: "300px",fixedcenter: true, visible: false, draggable: false, close: false, modal: true,
                                        text: message, icon: YAHOO.widget.SimpleDialog.ICON_WARN,
                                        constraintoviewport: true,
                                        buttons: [ { text:CMgs.format(formsLangBundle, "yes"), handler: function(){
                                            this.hide();
                                            var entityId = buildEntityIdFn(null);
                                            showWarnMsg = false;
                    
                                            var path = CStudioAuthoring.Utils.getQueryVariable(location.search, "path");
                                            if( path && path.indexOf(".xml") != -1) {
                                                CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, path, {
                                                    success: function (itemTO) {
                                                        //Unlock if the item is locked by the user
                                                        if (itemTO.item.lockOwner == CStudioAuthoringContext.user) {
                                                            CStudioAuthoring.Service.unlockContentItem(CStudioAuthoringContext.site, path, {
                                                                success: function() {
                                                                    _notifyServer = false;
                                                                    var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                                                                    CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                                                                },
                                                                failure: function() {
                                                                }
                                                            });
                                                        } else {
                                                            _notifyServer = false;
                                                            var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                                                            CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                                                        }
                                                    },
                                                    failure: function() {
                    
                                                    }
                                                });
                                            } else {
                                                _notifyServer = false;
                                                var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                                                CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                    
                                                if(path == '/site/components/page'){
                                                    CStudioAuthoring.Operations.refreshPreview();
                                                }
                                            }
                                        }, isDefault:false },
                                            { text:CMgs.format(formsLangBundle, "no"),  handler:function(){this.hide();}, isDefault:true } ]
                                    });
                                dialog.setHeader(CMgs.format(formsLangBundle, "cancelDialogHeader"));
                                dialog.render(document.body);
                                dialogEl = document.getElementById("closeUserWarning");
                                dialogEl.dialog = dialog;
                            }
                            dialogEl.dialog.show();
                        }else{
                            if( path && path.indexOf(".xml") != -1) {
                                var entityId = buildEntityIdFn(null);
                                CStudioAuthoring.Service.unlockContentItemSync(CStudioAuthoringContext.site, entityId);
                            }
                            if((iceId && iceId !="") || (iceComponent && iceComponent != "")) {
                                var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                                CStudioAuthoring.InContextEdit.unstackDialog(editorId);
                                var componentsOn = !!(sessionStorage.getItem('components-on'));
                                if(componentsOn){
                                    CStudioAuthoring.Operations.refreshPreviewParent();
                                }
                            } else {
                                window.close();
                                if(componentsOn){
                                    CStudioAuthoring.Operations.refreshPreviewParent();
                                }
                            }
                        }
                    };
                    
                    var collapseFn = function() {
                        if((iceId && iceId !="") || (iceComponent && iceComponent != "")) {
                            var editorId = CStudioAuthoring.Utils.getQueryVariable(location.search, 'editorId');
                            CStudioAuthoring.InContextEdit.collapseDialog(editorId);
                        }else {
                            window.close();
                        }
                        // CStudioAuthoring.Operations.collapseSimpleIceEdit();
                    }
                    
                    amplify.subscribe('/field/init/completed', function () {
                        form.asyncFields--;
                        closeAjaxOverlay();
                    });
                    
                    if(!form.readOnly) {
                        var saveButtonEl = document.createElement("input");
                        saveButtonEl.id = "cstudioSaveAndClose";
                        YDom.addClass(saveButtonEl, "btn");
                        YDom.addClass(saveButtonEl, "btn-primary");
                        YDom.addClass(saveButtonEl, "cstudio-button-first");
                        saveButtonEl.type = "button";
                        saveButtonEl.value = CMgs.format(formsLangBundle, "saveAndClose");
                        formButtonContainerEl.appendChild(saveButtonEl);
                    
                        saveButtonEl.onclick = function() {
                            var saveAndCloseEl = document.getElementById("cstudioSaveAndClose");
                            var saveAndPreviewEl = document.getElementById("cstudioSaveAndPreview");
                            var saveAndCloseDraftEl = document.getElementById("cstudioSaveAndCloseDraft");
                    
                            if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = true;
                            if(saveAndCloseEl) saveAndCloseEl.disabled = true;
                            if(saveAndPreviewEl) saveAndPreviewEl.disabled = true;
                    
                            saveFn(false, false);
                        };
                    
                    
                        var saveButtonDraftEl = document.createElement("input");
                        saveButtonDraftEl.id = "cstudioSaveAndCloseDraft";
                        YDom.addClass(saveButtonDraftEl, "btn");
                        YDom.addClass(saveButtonDraftEl, "btn-primary");
                        YDom.addClass(saveButtonDraftEl, "cstudio-button-first");
                        saveButtonDraftEl.type = "button";
                        saveButtonDraftEl.value = CMgs.format(formsLangBundle, "saveAndCloseDraft");
                        formButtonContainerEl.appendChild(saveButtonDraftEl);
                    
                        saveButtonDraftEl.onclick = function() {
                            var saveAndCloseEl = document.getElementById("cstudioSaveAndClose");
                            var saveAndPreviewEl = document.getElementById("cstudioSaveAndPreview");
                            var saveAndCloseDraftEl = document.getElementById("cstudioSaveAndCloseDraft");
                    
                            if(saveAndCloseEl) saveAndCloseEl.disabled = true;
                            if(saveAndCloseDraftEl) saveAndCloseDraftEl.disabled = true;
                            if(saveAndPreviewEl) saveAndPreviewEl.disabled = true;
                    
                            saveFn(false, true);
                        };
                    
                    
                        var previewButtonEl = document.createElement("input");
                        YDom.addClass(previewButtonEl, "btn");
                        YDom.addClass(previewButtonEl, "btn-default");
                        YDom.addClass(previewButtonEl, "cstudio-button-first");
                        previewButtonEl.id = "cstudioSaveAndPreview";
                        previewButtonEl.style.display = "none";
                        previewButtonEl.type = "button";
                        previewButtonEl.value = CMgs.format(formsLangBundle, "saveAndPreview");
                        formButtonContainerEl.appendChild(previewButtonEl);
                    
                        //In Context Edit, the preview button must not be shown
                        var iceId = CStudioAuthoring.Utils.getQueryVariable(location.search, "iceId");
                    
                        /*
                        if(contentType.indexOf("/page") != -1 && iceId === "") {
                        previewButtonEl.style.display = "inline";
                        }
                        */
                    
                        // This is really the right thing to do but previewable doesn't come through
                        var contentTypeCb = {
                            success: function(type) {
                                if(type.previewable && type.previewable == "true") {
                                    previewButtonEl.style.display = "inline";
                                }
                            },
                            failure: function() {
                            }
                        };
                    
                        CStudioAuthoring.Service.lookupContentType(CStudioAuthoringContext.site, contentType, contentTypeCb);
                    
                        previewButtonEl.onclick = function() {
                            saveFn(true, false);
                        };
                    
                        var cancelButtonEl = document.createElement("input");
                        cancelButtonEl.id = "cancelBtn";
                        YDom.addClass(cancelButtonEl, "btn");
                        YDom.addClass(cancelButtonEl, "btn-default");
                        cancelButtonEl.type = "button";
                        cancelButtonEl.value = CMgs.format(formsLangBundle, "cancel");
                        formButtonContainerEl.appendChild(cancelButtonEl);
                    
                        //YAHOO.util.Event.addListener(window, "beforeunload", beforeUnloadFn, this);
                        YAHOO.util.Event.addListener(window, "unload",unloadFn, me);
                        YAHOO.util.Event.addListener(cancelButtonEl, "click", cancelFn, me);
                    } else {
                        var closeButtonEl = document.createElement("input");
                        YDom.addClass(closeButtonEl, "btn");
                        YDom.addClass(closeButtonEl, "btn-default");
                        closeButtonEl.type = "button";
                        closeButtonEl.value = CMgs.format(formsLangBundle, "close");
                        formButtonContainerEl.appendChild(closeButtonEl);
                        YDom.setStyle(formButtonContainerEl,"text-align","center");
                    
                        //YAHOO.util.Event.addListener(window, "beforeunload", beforeUnloadFn, this);
                        YAHOO.util.Event.addListener(window, "unload",unloadFn, me);
                        YAHOO.util.Event.addListener(closeButtonEl, "click", cancelFn, me);
                    }
                    var colExpButtonEl = document.createElement("input");
                    colExpButtonEl.id = "colExpButtonBtn";
                    YDom.addClass(colExpButtonEl, "btn");
                    YDom.addClass(colExpButtonEl, "btn-default");
                    colExpButtonEl.type = "button";
                    colExpButtonEl.value = "Collapse";
                    formControlBarEl.appendChild(colExpButtonEl);
                    YAHOO.util.Event.addListener(colExpButtonEl, "click", collapseFn, me);
                    
                    var overlayContainer = parent.document.getElementById(window.frameElement.id).parentElement;
                    YDom.addClass(overlayContainer, "overlay");
                    
                    $(document).on("keyup", function(e) {
                        if (e.keyCode === 27) { // esc
                            if(e.currentTarget.activeElement){
                                //blur and focus again element - to update model and detect if there was a change on form
                                $(e.currentTarget.activeElement).blur();
                                $(e.currentTarget.activeElement).focus();
                            }
                            cancelFn();
                        }
                    });
                });
            },

            /**
             * load datasource objects in to form so that fields can attach to them when they load
             */
            _loadDatasources: function(form, callback) {
                var formDef = form.definition,
                    loadControl = 0,
                    loaded = [],
                    notLoaded = [],
                    releaseCallback;
                    
                form.datasourceMap = {};

                releaseCallback = function(){
                    if((loaded.length + notLoaded.length) === formDef.datasources.length){
                        callback(loaded, notLoaded);
                    }
                };

                if(0 === formDef.datasources.length){
                    callback(loaded, notLoaded);
                }else{
                    for(var i=0, l=formDef.datasources.length; i < l; i++) {
                        var datasourceDef = formDef.datasources[i],
                            script;
    
                        script = CStudioAuthoringContext.baseUri + "/static-assets/components/cstudio-forms/data-sources/" + datasourceDef.type + ".js";
                        script = CStudioAuthoring.Utils.addURLParameter(script, "version", CStudioAuthoring.UIBuildId);
                        
                        var onDone = (function(datasourceDef){
                            return function(script, textStatus){
                                try {
    
                                    if("" === script){
                                        notLoaded.push(datasourceDef.type);
                                    }else{
                                        var moduleClass = CStudioAuthoring.Module.loadedModules["cstudio-forms-controls-" + datasourceDef.type];
                                        var datasource = new moduleClass(datasourceDef.id, form, datasourceDef.properties);
                                        form.datasourceMap[datasource.id] = datasource;
                                        amplify.publish("/datasource/loaded", { name: datasource.id});
            
                                        loaded.push(datasourceDef.type);
                                    }
                                
                                    releaseCallback();
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            }
                        })(datasourceDef);
    
                        if(CStudioAuthoring.Module.loadedModules["cstudio-forms-controls-" + datasourceDef.type]){
                            onDone();
                        }else{
                            jQuery.getScript(script)
                                .done(onDone)
                                .fail((function(datasourceDef){
                                    return function(jqxhr, settings, exception){
                                        console.log(exeption);
                                        notLoaded.push(datasourceDef.type);
                                        releaseCallback();
                                    }
                                })(datasourceDef));
                        }
                    }
                }
                
            },

            /**
             * render a form section
             */
            _renderFormSections: function(form) {

                var formDef = form.definition;
                form.sectionsMap = [];

                for(var i=0; i < formDef.sections.length; i++) {
                    var section = formDef.sections[i];

                    var sectionContainerEl = document.getElementById(section.id+"-container");
                    var sectionEl = document.getElementById(section.id+"-body-controls");

                    var formSection = new CStudioFormSection(form, sectionContainerEl);
                    form.sectionsMap[section.title] = formSection;
                    form.sections[form.sections.length] = formSection;

                    var sectionOpenCloseWidgetEl = YDom.getElementsByClassName("cstudio-form-section-widget", null, sectionContainerEl)[0];
                    var sectionBodyEl = YDom.getElementsByClassName("panel-body", null, sectionContainerEl)[0];

                    if ((section.defaultOpen == "false") || (section.defaultOpen == "") || (section.defaultOpen == false)) {
                        sectionBodyEl.style.display = "none";
                        YAHOO.util.Dom.addClass(sectionOpenCloseWidgetEl, 'cstudio-form-section-widget-closed');
                    }

                    sectionOpenCloseWidgetEl.sectionBodyEl = sectionBodyEl;
                    formSection.sectionOpenCloseWidgetEl = sectionOpenCloseWidgetEl;
                    formSection.sectionBodyEl = sectionBodyEl;

                    sectionOpenCloseWidgetEl.onclick = function() {
                        if(this.sectionBodyEl.style.display == "none") {
                            this.sectionBodyEl.style.display = "block";
                            YAHOO.util.Dom.removeClass(this, 'cstudio-form-section-widget-closed');
                        } else {
                            this.sectionBodyEl.style.display = "none";
                            YAHOO.util.Dom.addClass(this, 'cstudio-form-section-widget-closed');
                        }
                    };

                    for(var j=0; j<section.fields.length; j++) {
                        var field = section.fields[j];

                        if(field) {
                            if(field.type != "repeat") {
                                var lastTwo = j + 2 >= section.fields.length ? true : false;
                                this._renderField(formDef, field, form, formSection, sectionBodyEl, undefined, undefined, undefined, lastTwo);
                            } else {
                                this._renderRepeat(formDef, field, form, formSection, sectionBodyEl);
                            }
                        }
                    }

                }

            },

            /**
             * render a repeat
             */
            _renderRepeat: function(formDef, repeat, form, formSection, sectionEl) {
                if(form.customController && form.customController.isFieldRelevant(repeat) == false) {
                    return;
                }

                var repeatContainerEl = document.createElement("div");
                sectionEl.appendChild(repeatContainerEl);
                repeatContainerEl.maxOccurs = repeat.maxOccurs;
                repeatContainerEl.minOccurs = repeat.minOccurs;
                repeatContainerEl.formDef=formDef;
                repeatContainerEl.repeat = repeat;
                repeatContainerEl.form = form;
                repeatContainerEl.formSection = formSection;
                repeatContainerEl.sectionEl = sectionEl;
                repeatContainerEl.formEngine = this;
                repeatContainerEl.reRender = function(controlEl) {

                    var arrayFilter = function (arr, attFilter) {
                        return arr.filter( function(el)
                        { return el[attFilter]; });
                    };

                    controlEl.formEngine._cleanUpRepeatBodyFields(controlEl, this.repeat.id);
                    controlEl.innerHTML = "";
                    controlEl.formEngine._renderRepeatBody(controlEl);
                };

                this._renderRepeatBody(repeatContainerEl);
            },

            /**
             * this method will clean up all the repeating group fields
             * to make sure old fields don't cause validation issues
             */
            _cleanUpRepeatBodyFields: function(repeatContainerEl, id) {
                var formSectionFields = [];
                var repFields = repeatContainerEl.formSection.fields;
                if (repFields && repFields.length > 0 ) {
                    for (var i = 0; i < repFields.length; i++) {
                        if (repFields[i].id.indexOf(id + "|") == -1) {
                            formSectionFields.push(repFields[i]);
                        }
                    }
                    repeatContainerEl.formSection.fields = formSectionFields;
                }
            },

            /**
             * this method does the actual rendering of the repeat and
             * has been separated from renderRepeat so it can be called on
             * repeat manipulation events
             */
            _renderRepeatBody: function(repeatContainerEl) {
                var maxOccurs = repeatContainerEl.maxOccurs;
                var minOccurs = repeatContainerEl.minOccurs;
                var formDef = repeatContainerEl.formDef;
                var repeat = repeatContainerEl.repeat;
                var form = repeatContainerEl.form;
                var formSection = repeatContainerEl.formSection;
                var sectionEl = repeatContainerEl.sectionEl;
                var containerEl = repeatContainerEl;
                var self = this;

                // render with items
                var currentCount = (form.model[repeat.id]) ? form.model[repeat.id].length : 0;
                var repeatCount = (currentCount > minOccurs) ? currentCount : minOccurs;

                //handle case where there are no ites
                if((minOccurs == 0 && !form.model[repeat.id]) || repeatCount == 0) {
                    var repeatInstanceContainerEl = document.createElement("div");
                    repeatContainerEl.appendChild(repeatInstanceContainerEl);
                    YAHOO.util.Dom.addClass(repeatInstanceContainerEl, 'cstudio-form-repeat-container');
                    repeatInstanceContainerEl._repeatIndex = 0;

                    var titleEl = document.createElement("span");
                    repeatInstanceContainerEl.appendChild(titleEl);
                    YAHOO.util.Dom.addClass(titleEl, 'cstudio-form-repeat-title');
                    titleEl.innerHTML = repeat.title;

                    var addEl = document.createElement("a");
                    repeatInstanceContainerEl.appendChild(addEl);
                    YAHOO.util.Dom.addClass(addEl, 'cstudio-form-repeat-control');
                    addEl.innerHTML = "Add First Item";
                    addEl.onclick = function() {
                        repeatContainerEl.form.setFocusedField(repeatContainerEl);
                        form.model[repeat.id] = [];
                        form.model[repeat.id][0] = [];

                        this.parentNode.parentNode.reRender(this.parentNode.parentNode);
                    }

                    formSection.notifyValidation();
                    return;
                }

                if(!form.model[repeat.id]) {
                    form.model[repeat.id] = [];
                }

                if(currentCount < minOccurs) {
                    var count = minOccurs - currentCount;
                    for(var j=0; j<count; j++) {
                        form.model[repeat.id][form.model[repeat.id].length] = []
                    }
                }

                for(var i=0; i<repeatCount; i++) {
                    var repeatInstanceContainerEl = document.createElement("div");
                    YAHOO.util.Dom.addClass(repeatInstanceContainerEl, 'cstudio-form-repeat-container');
                    repeatInstanceContainerEl._repeatIndex = i;

                    var titleEl = document.createElement("span");
                    repeatInstanceContainerEl.appendChild(titleEl);
                    YAHOO.util.Dom.addClass(titleEl, 'cstudio-form-repeat-title');
                    titleEl.innerHTML = repeat.title;

                    var addEl = document.createElement("a");
                    repeatInstanceContainerEl.appendChild(addEl);
                    YAHOO.util.Dom.addClass(addEl, 'cstudio-form-repeat-control');
                    addEl.innerHTML = CMgs.format(formsLangBundle, "repeatAddAnother");
                    if(form.readOnly || maxOccurs != "*" && currentCount >= maxOccurs) {
                        YAHOO.util.Dom.addClass(addEl, 'cstudio-form-repeat-control-disabled');
                    }
                    else {
                        addEl.onclick = function() {
                            form.onBeforeUiRefresh();
                            repeatContainerEl.form.setFocusedField(repeatContainerEl);
                            var itemArray = form.model[repeat.id];
                            var repeatArrayIndex = this.parentNode._repeatIndex;
                            itemArray.splice(repeatArrayIndex+1, 0, []);
                            containerEl.reRender(containerEl);

                            var containerElNodes = $(containerEl.childNodes);
                            containerElLastChildTop = $(containerElNodes.get(repeatArrayIndex)).offset().top;
                            $('body').scrollTop(containerElLastChildTop);

                            repeatEdited = true;
                        }
                    }

                    var upEl = document.createElement("a");
                    repeatInstanceContainerEl.appendChild(upEl);
                    YAHOO.util.Dom.addClass(upEl, 'cstudio-form-repeat-control');
                    upEl.innerHTML = CMgs.format(formsLangBundle, "repeatMoveUp");
                    if(form.readOnly || i == 0) {
                        YAHOO.util.Dom.addClass(upEl, 'cstudio-form-repeat-control-disabled');
                    }
                    else {
                        upEl.onclick = function() {
                            //form.setFocusedField(null);
                            repeatContainerEl.form.setFocusedField(repeatContainerEl);
                            form.onBeforeUiRefresh();
                            var itemArray = form.model[repeat.id];
                            var repeatArrayIndex = this.parentNode._repeatIndex;
                            var itemToMove = itemArray[repeatArrayIndex];
                            itemArray.splice(repeatArrayIndex, 1);
                            itemArray.splice(repeatArrayIndex-1, 0, itemToMove);
                            containerEl.reRender(containerEl);
                            repeatEdited = true;
                        }
                    }

                    var downEl = document.createElement("a");
                    repeatInstanceContainerEl.appendChild(downEl);
                    YAHOO.util.Dom.addClass(downEl, 'cstudio-form-repeat-control');
                    downEl.innerHTML = CMgs.format(formsLangBundle, "repeatMoveDown");
                    if(form.readOnly || i == repeatCount-1) {
                        YAHOO.util.Dom.addClass(downEl, 'cstudio-form-repeat-control-disabled');
                    }
                    else {
                        downEl.onclick = function() {
                            //form.setFocusedField(null);
                            repeatContainerEl.form.setFocusedField(repeatContainerEl);
                            form.onBeforeUiRefresh();
                            var itemArray = form.model[repeat.id];
                            var repeatArrayIndex = this.parentNode._repeatIndex;
                            var itemToMove = itemArray[repeatArrayIndex];
                            itemArray.splice(repeatArrayIndex, 1);
                            itemArray.splice(repeatArrayIndex+1, 0, itemToMove);
                            containerEl.reRender(containerEl);
                            repeatEdited = true;
                        }
                    }

                    var deleteEl = document.createElement("a");
                    repeatInstanceContainerEl.appendChild(deleteEl);
                    YAHOO.util.Dom.addClass(deleteEl, 'cstudio-form-repeat-control');
                    deleteEl.innerHTML = CMgs.format(formsLangBundle, "repeatDelete");
                    if(form.readOnly || currentCount <= minOccurs) {
                        YAHOO.util.Dom.addClass(deleteEl, 'cstudio-form-repeat-control-disabled');
                    }
                    else {
                        deleteEl.onclick = function() {
                            repeatContainerEl.form.setFocusedField(repeatContainerEl);
                            form.onBeforeUiRefresh();
                            var itemArray = form.model[repeat.id];
                            var repeatArrayIndex = this.parentNode._repeatIndex;
                            itemArray.splice(repeatArrayIndex, 1);
                            containerEl.reRender(containerEl);
                            repeatEdited = true;
                        }
                    }

                    // Insert the repeat group instance to the DOM as late in the process as possible
                    repeatContainerEl.appendChild(repeatInstanceContainerEl);

                    for(var j=0; j<repeat.fields.length; j++) {
                        var field = repeat.fields[j];

                        this._renderField(formDef, field, form, formSection, repeatInstanceContainerEl, repeat, i);
                    }
                }
            },

            /**
             * render a field
             * repeatField, repeatIndex are used only when repeat
             */
            _renderField: function(formDef, field, form, formSection, sectionEl, repeatField, repeatIndex, pencilMode, lastTwo) {
                if(form.customController && form.customController.isFieldRelevant(field) == false) {
                    return;
                }

                var fieldContainerEl = document.createElement("div");
                YAHOO.util.Dom.addClass(fieldContainerEl, 'container');
                YAHOO.util.Dom.addClass(fieldContainerEl, field.type + '-control');
                YAHOO.util.Dom.addClass(fieldContainerEl, 'cstudio-form-field-container');
                sectionEl.appendChild(fieldContainerEl);

                // initialize each control
                var cb = {
                    moduleLoaded: function(moduleName, moduleClass, moduleConfig) {
                        try {
                            var fieldId = moduleConfig.config.field.id;
                            if(repeatField) {
                                fieldId = moduleConfig.config.repeatField.id + "|" +
                                    moduleConfig.config.repeatIndex + "|" +
                                    moduleConfig.config.field.id;
                            }

                            var formField = new moduleClass(
                                fieldId,
                                this.form,
                                this.section,
                                moduleConfig.config.field.properties,
                                moduleConfig.config.field.constraints,
                                form.readOnly,
                                pencilMode);

                            formField.initialize(moduleConfig.config.field, this.containerEl, lastTwo);

                            var value = "";
                            if(repeatField) {
                                value =
                                    form.model[moduleConfig.config.repeatField.id][moduleConfig.config.repeatIndex][moduleConfig.config.field.id];
                            }
                            else {
                                // not a repeat
                                value = form.model[moduleConfig.config.field.id];
                            }

                            if(!value && moduleConfig.config.field.defaultValue && typeof moduleConfig.config.field.defaultValue === 'string') {
                                value = moduleConfig.config.field.defaultValue;
                            }

                            if(value) {
                                formField.setValue(value);
                            }
                            else {
                                formField.setValue("");
                            }

                            formField.fieldDef = this.fieldDef;
                            try{
                                if(lastTwo){
                                    setTimeout(function(lastTwo){
                                        for(var k=0; k < formField.form.sections[0].fields.length; k++){
                                            if(!formField.form.sections[0].fields[k].inputEl.disabled){
                                                formField.form.sections[0].fields[k].inputEl.focus();
                                                return
                                            }
                                        }
                                    }, 1900);
                                }
                            }catch (err){
                                //console.log(err);
                            }
                            form.sectionsMap[section.title].notifyValidation();

                        }
                        catch (e) {
                            //alert(e);
                        }
                    },

                    context: this,
                    containerEl: fieldContainerEl,
                    section: formSection,
                    fieldDef: field,
                    form: form,
                    lastTwo: lastTwo
                };

                CStudioAuthoring.Module.requireModule(
                    "cstudio-forms-controls-" + field.type,
                    '/static-assets/components/cstudio-forms/controls/' + field.type + ".js",
                    { config: { field: field,
                        repeatField: repeatField,
                        repeatIndex: repeatIndex}},
                    cb
                );
            },

            _renderInContextEdit: function(form, iceId) {
                var formDef = form.definition;
                form.sectionsMap = [];
                var sectionContainerEl = document.getElementById("ice-container");
                var sectionEl = document.getElementById("ice-body-controls");
                var sectionBodyEl = YDom.getElementsByClassName("cstudio-form-section-body", null, sectionContainerEl)[0];
                var formSection = new CStudioFormSection(form, sectionContainerEl);
                form.sectionsMap["ice"] = formSection;
                form.sections[0] = formSection;

                for(var i=0; i < formDef.sections.length; i++) {
                    var section = formDef.sections[i];

                    for(var j=0; j<section.fields.length; j++) {
                        var field = section.fields[j];

                        if(field) {
                            if(field.iceId == iceId) {
                                if(field.type != "repeat") {
                                    this._renderField(formDef, field, form, formSection, sectionBodyEl, null, null, true);
                                    CStudioAuthoring.InContextEdit.autoSizeIceDialog();
                                }
                                else {
                                    this._renderRepeat(formDef, field, form, formSection, sectionBodyEl);
                                    CStudioAuthoring.InContextEdit.autoSizeIceDialog();
                                }
                            }
                        }
                    }
                }


            },

            /**
             * refresh the page name and page location
             */
            _reRenderPageLocation: function(formDef){
                var pageEl = document.getElementById("page-name");
                var locationEl = document.getElementById("page-location");

                if(pageEl){
                    pageEl.innerHTML = formDef.pageName;
                }

                if(locationEl){
                    locationEl.innerHTML = formDef.pageLocation;
                }
            },

            /**
             * draw the html for the form
             */
            _renderFormLayout: function(form) {
                // long term even the layout should be delgated to a pluggable module
                // for now we'll start with delegation of widgets
                var formDef = form.definition;
                var html = "";

                // Update the window title
                window.document.title = (formDef.pageName) ? formDef.title + " | " + formDef.pageName : formDef.title;

                $('header').show();
                $('.page-header h1 .header').text(formDef.pageName ? formDef.pageName : CMgs.format(formsLangBundle, "new")+" "+ formDef.title);
                if (formDef.title) {
                    $('.page-header h1 .name').addClass('has-page-name').text(formDef.title);
                }
                if (formDef.pageLocation) {
                    $('.page-header h1 .location').text(formDef.pageLocation);
                }
                $('.page-description').text(formDef.description);
                $('#cstudio-form-expand-all').text(CMgs.format(formsLangBundle, "expandAll"));
                $('#cstudio-form-collapse-all').text(CMgs.format(formsLangBundle, "collapseAll"));

                html ="<div id='cstudio-form-readonly-banner' class='hidden'>READ ONLY</div>"+

                    '<div class="container">' +
                    '<div class="panel-group">';

                for(var i=0; i < formDef.sections.length; i++) {
                    var section = formDef.sections[i];

                    html += "<div id='"+ section.id + "-container' class='panel panel-default'>";

                    html +=
                        "<div id='"+ section.id + "-heading' class='panel-heading'>" +
                        '<div class="cstudio-form-section-widget"></div>' +
                        '<div class="cstudio-form-section-indicator fa f18"></div>' +
                        '<h2 class="panel-title">' + section.title + '</h2>' +
                        '<span class="cstudio-form-section-validation"></span>'
                        + "</div>";

                    html +=
                        '<div id="'+ section.id + '-body" class="panel-collapse collapse in">' +
                        '<div class="panel-body">' +
                        (section.description ? '<p>' + section.description + '</p>' : '') +
                        '<div id="'+ section.id + '-body-controls"></div>' +
                        '</div>' +
                        '</div>';

                    html += "</div>";

                }

                html +=
                    "</div>" +
                    "</div>" +
                    "<div class='cstudio-form-controls-container'></div>" +
                    "<div id='ajax-overlay'><div class='ajax-loader'></div></div>";

                return html;
            },

            /**
             * draw the html for the ICE form
             */
            _renderIceLayout: function(form) {
                var formDef = form.definition;
                var html = "";


                html = "<div class='cstudio-form-container-ice'>";

                html +="<div id='cstudio-form-readonly-banner' class='hidden'>READ ONLY</div>";

                html += "<div id='ice-container'>";
                html +="<div id='ice-body'  class='cstudio-form-section-body'>" // secion body
                    +   "<div id='ice-body-controls'>" // section controls
                    +   "</div>"
                    + "</div>";
                html += "</div>";
                html +="</div>" // end form

                html +="<div class='cstudio-form-controls-container'>" // command bar
                    + "</div>";
                html+="</div>";

                return html;
            }
        };


        // Utility Methods

        cfe.Util = {
            /**
             * internal menthod
             * load form definition from repository
             * @param formId
             *      path to the form you want to render
             */
            loadFormDefinition: function(formId, cb) {
                var configCb = {
                    success: function(config) {
                        // make sure the json is correct
                        var def = config;
                        def.contentType = formId;

                        // handle datasources

                        if(!def.datasources
                            || typeof def.datasources === 'string') {
                            def.datasources = [];
                        }
                        else {
                            def.datasources = def.datasources.datasource;
                        }

                        if(!def.datasources.length) {
                            def.datasources = [].concat(def.datasources);
                        }

                        for(var k=0; k < def.datasources.length; k++) {
                            var datasource = def.datasources[k];
                            datasource.form = def;

                            if(!datasource.properties || ! datasource.properties.property) {
                                datasource.properties = [];
                            }
                            else {
                                datasource.properties = datasource.properties.property;
                                if(!datasource.properties.length) {
                                    datasource.properties = [].concat(datasource.properties);
                                }

                            }
                        }

                        // handle form properties
                        if(!def.properties || !def.properties.property) {
                            def.properties = [];
                        }
                        else {
                            def.properties = def.properties.property;
                            if(!def.properties.length) {
                                def.properties = [ def.properties ];
                            }
                        }

                        // handle form dections
                        if(!def.sections || !def.sections.section){
                            def.sections = [];
                        }
                        else{
                            def.sections = def.sections.section;
                            if(!def.sections.length) {
                                def.sections = [].concat(def.sections);
                            }
                        }

                        for(var i=0; i < def.sections.length; i++) {
                            var section = def.sections[i];
                            section.form = def;

                            var sectionId = section.title.replace(/ /g,"");
                            section.id = sectionId;

                            processFieldsFn = function(container) {
                                if(!container.fields || !container.fields.field){
                                    container.fields = [];
                                }
                                else {
                                    container.fields = container.fields.field;
                                    if(!container.fields.length) {
                                        container.fields = [].concat(container.fields);
                                    }
                                }

                                for(var j=0; j < container.fields.length; j++) {
                                    var field = container.fields[j];
                                    if(field) {

                                        if(!field.properties || !field.properties.property) {
                                            field.properties = [];
                                        }
                                        else {
                                            field.properties = field.properties.property;
                                            if(!field.properties.length) {
                                                field.properties = [].concat(field.properties);
                                            }
                                        }

                                        if(!field.constraints || !field.constraints.constraint) {
                                            field.constraints = [];
                                        } else {
                                            field.constraints = field.constraints.constraint;

                                            if(!field.constraints.length) {
                                                field.constraints = [].concat(field.constraints);
                                            }
                                        }

                                        if(field.type == "repeat") {
                                            processFieldsFn(field);
                                        }

                                    }
                                }
                            };

                            processFieldsFn(section);
                        }

                        // notify
                        cb.success(def);

                    },
                    failure: function() {
                    }
                }

                CStudioAuthoring.Service.lookupConfigurtion(CStudioAuthoringContext.site, "/content-types/" + formId + "/form-definition.xml", configCb);
            },

            /**
             * internal menthod
             * load Config from repository
             * @param formId
             *      path to the form you want to render
             */
            loadConfig: function(formId, cb) {
                var configCb = {
                    success: function(config) {
                        // make sure the json is correct
                        var conf = config;
                        conf.contentType = formId;

                        // notify
                        cb.success(conf);

                    },
                    failure: function() {
                    }
                }

                CStudioAuthoring.Service.lookupConfigurtion(CStudioAuthoringContext.site, "/content-types/" + formId + "/config.xml", configCb);
            },


            /**
             * Load the form field controller and form configuration
             */
            LoadFormConfig: function(formId, cb) {
                var configCb = {
                    success: function(formConfig) {

                        if(formConfig['controller'] && formConfig['controller'] == "true") {
                            var moduleCb = {
                                moduleLoaded: function(moduleName, clazz, config) {
                                    cb.success(clazz, formConfig);
                                },
                                failure: function() {
                                    cb.failure();
                                }
                            };

                            var moduleConfig = {};
                            var configFilesPath = CStudioAuthoring.Constants.CONFIG_FILES_PATH;

                            CStudioAuthoring.Module.requireModule(
                                formId+"-controller",
                                "/api/1/services/api/1/content/get-content-at-path.bin?site=" + CStudioAuthoringContext.site +
                                "&path=" + configFilesPath + "/content-types/"+formId+"/form-controller.js",
                                moduleConfig, moduleCb);
                        }
                        else {
                            cb.success(undefined, formConfig);
                        }
                    },
                    failure: function() {
                        cb.failure();
                    }
                }

                CStudioAuthoring.Service.lookupConfigurtion(CStudioAuthoringContext.site, "/content-types/" + formId + "/config.xml", configCb);
            },

            /**
             * Getting the value of some item
             */
            getModelItemValue: function(item){
                var value = "";

                try {
                    if(YAHOO.env.ua.ie > 0){
                        //The browser is Internet Explorer
                        value = (!item.nodeValue) ? item.firstChild.nodeValue :item.nodeValue;
                    }else{
                        value = (!item.wholeText) ? item.firstChild.wholeText :item.wholeText;
                    }
                }
                catch(npe) {
                    value = "";
                }

                return value;
            },

            /**
             * take an xml content item and turn it in to a property map
             */
            xmlModelToMap: function(dom) {
                var map = {};
                var children = (dom.children) ? dom.children : dom.childNodes;

                this.xmlModelToMapChildren(map, children);

                /* make sure object has IDs */
                if(!map["objectId"]) {
                    var UUID = CStudioAuthoring.Utils.generateUUID();;
                    var groupId = UUID.substring(0, 4);
                    map["objectGroupId"] = groupId
                    map["objectId"] = UUID;
                }

                return map;
            },

            xmlModelToMapChildren: function(node, children) {
                for(var i=0; i<children.length; i++) {
                    try {
                        var child = children[i];
                        if(child.nodeName != "#text") {
                            // Chrome and FF support childElementCount; for IE we will get the length of the childNodes collection
                            var hasChildren = (typeof child.childElementCount == "number") ? !!child.childElementCount :
                                (!!child.childNodes.length && child.firstChild.nodeName != "#text");

                            if(hasChildren) {
                                this.xmlModelToMapArray(node, child);
                            }
                            else {
                                node[child.nodeName] = this.getModelItemValue(child);
                            }
                        }
                    }
                    catch(err) {
                    }
                }
            },

            xmlModelToMapArray: function(node, child) {
                // array/repeat item
                node[child.nodeName] = [];

                var repeatCount = 0;
                var repeatChildren = (child.children) ? child.children : child.childNodes;

                for(var j=0; j<repeatChildren.length; j++) {
                    try {

                        var repeatChild = repeatChildren[j];

                        if(repeatChild.nodeName != "#text") {
                            node[child.nodeName][repeatCount] = {};

                            var repeatChildChildren =
                                (repeatChild.children) ? repeatChild.children : repeatChild.childNodes;

                            for(var k=0; k<repeatChildChildren.length; k++) {
                                var repeatField = repeatChildChildren[k];

                                if(repeatField.nodeName != "#text") {

                                    if(repeatField.childElementCount > 0) {
                                        this.xmlModelToMapArray(node[child.nodeName][repeatCount], repeatField);
                                    }
                                    else {
                                        var value = "";

                                        try {
                                            //value = (!repeatField.wholeText) ?
                                            //  repeatField.firstChild.wholeText : repeatField.wholeText;
                                            value = this.getModelItemValue(repeatField);
                                        }
                                        catch(noValue) {
                                        }

                                        node[child.nodeName][repeatCount][repeatField.nodeName] = this.unEscapeXml(value);
                                    }
                                }
                            }

                            repeatCount++;
                        }
                    }
                    catch(repeatErr) {
                        CStudioAuthoring.Operations.showSimpleDialog(
                            "error-dialog",
                            CStudioAuthoring.Operations.simpleDialogTypeINFO,
                            CMgs.format(formsLangBundle, "notification"),
                            CMgs.format(formsLangBundle, "errOnRepeat"), ""+repeatErr,
                            null,
                            YAHOO.widget.SimpleDialog.ICON_BLOCK,
                            "studioDialog"
                        );
                    }
                }
            },

            serializeModelToXml: function(form, saveDraft) {
                var xml = "<"+form.definition.objectType+">\r\n";

                if(saveDraft) {
                    xml += "\t<savedAsDraft>true</savedAsDraft>";
                }
                xml += "\t<content-type>" + form.definition.contentType + "</content-type>";

                if(form.definition.properties && form.definition.properties.length) {
                    for(var i=0; i<form.definition.properties.length; i++) {
                        var property = form.definition.properties[i];
                        if(property && property.name) {
                            xml += "\t<"+property.name+">";
                            xml +=  this.escapeXml(property.value);
                            xml += "</"+property.name+">\r\n";
                        }
                    }
                }

                xml += this.printFieldsToXml(form.model, form.dynamicFields, form.definition.sections, form.definition.config);
                xml += "</"+form.definition.objectType+">";

                return xml;
            },

            printFieldsToXml: function(formModel, formDynamicFields, formSections, formConfig) {
                var fieldInstructions = [];
                var validFields = ['$!', 'objectGroupId', 'objectId', 'folder-name', 'createdDate', 'createdDate_dt', 'lastModifiedDate', 'lastModifiedDate_dt', 'components', 'orderDefault_f', 'placeInNav', 'rteComponents'],
                    output = '',
                    validFieldsStr, fieldRe, section;

                // Add valid fields from the ones created dynamically by controls
                if (formDynamicFields && formDynamicFields.length > 0) {
                    validFields = validFields.concat(formDynamicFields);
                }

                // Add valid fields from form sections
                for (var i = formSections.length - 1; i >= 0; i--) {
                    section = formSections[i];

                    for (var j = section.fields.length - 1; j >= 0; j--) {
                        var field = section.fields[j];
                        validFields.push(section.fields[j].id);
                        var fieldInstruction = { tokenize: false };
                        fieldInstructions[field.id] = fieldInstruction;

                        for(var p=0; p<field.properties.length; p++) {
                            try {
                                var property = field.properties[p];
                                if(property.name == "tokenize"  && property.value == "true") {
                                    fieldInstruction.tokenize = true;
                                }
                            }
                            catch(err) {
                                CStudioAuthoring.Operations.showSimpleDialog(
                                    "error-dialog",
                                    CStudioAuthoring.Operations.simpleDialogTypeINFO,
                                    CMgs.format(formsLangBundle, "notification"),
                                    err,
                                    null,
                                    YAHOO.widget.SimpleDialog.ICON_BLOCK,
                                    "studioDialog"
                                );
                            }
                        }
                    }
                }

                // Add valid fields from form config
                if (formConfig && formConfig.customFields) {
                    for (var i in formConfig.customFields) {
                        if (formConfig.customFields.hasOwnProperty(i)) {
                            if (formConfig.customFields[i].removeOnChangeType == 'false') {
                                validFields.push(formConfig.customFields[i].name);
                            }
                        }
                    }
                }

                validFields.push('$!');     // End element
                validFieldsStr = validFields.join(",");

                for (var key in formModel) {
                    var attributes = "";
                    var fieldInstruction = fieldInstructions[key];
                    var invalidFields = [];

                    try {
                        if(fieldInstruction && fieldInstruction.tokenize == true) {
                            attributes += " tokenized='true' ";
                        }
                    }
                    catch(err) {
                        CStudioAuthoring.Operations.showSimpleDialog(
                            "error-dialog",
                            CStudioAuthoring.Operations.simpleDialogTypeINFO,
                            CMgs.format(formsLangBundle, "notification"),
                            err,
                            null,
                            YAHOO.widget.SimpleDialog.ICON_BLOCK,
                            "studioDialog"
                        );
                    }

                    // Because we added start and end elements, we can be sure that any field names will
                    // be delimited by the delimiter token (ie. comma)
                    fieldRe = new RegExp("," + key + "(?:,|\|\d+\|)", "g");

                    if (fieldRe.test(validFieldsStr)) {
                        var modelItem = formModel[key];

                        if(Object.prototype.toString.call( modelItem ) === '[object Array]') {
                            output += "\t<"+key+ " " +attributes +" >";
                            for(var j = 0; j < modelItem.length; j++) {
                                output += "\t<item>";
                                var repeatItem = modelItem[j];
                                for (var repeatKey in repeatItem) {
                                    var repeatValue = modelItem[j][repeatKey];

                                    output += "\t<"+repeatKey+">";
                                    if(Object.prototype.toString.call( repeatValue ).indexOf('[object Array]') != -1) {
                                        for (var k = 0; k < repeatValue.length; k++) {
                                            var subModelItem = repeatValue[k];
                                            output += "\t\t<item>";
                                            for (var subRepeatKey in subModelItem) {
                                                var subRepeatValue = subModelItem[subRepeatKey];
                                                output += "<"+subRepeatKey+">";
                                                output +=  this.escapeXml(subRepeatValue);
                                                output += "</"+subRepeatKey+">\r\n";
                                            }
                                            output += "\t\t</item>";
                                        }
                                    }
                                    else {
                                        output +=  this.escapeXml(repeatValue);
                                    }
                                    output += "</"+repeatKey+">\r\n";
                                }
                                output += "\t</item>";
                            }
                            output += "</"+key+">\r\n";
                        }
                        else {
                            output += "\t<"+key+" " + attributes+ " >"
                            output += this.escapeXml(modelItem);
                            output += "</"+key+">\r\n";
                        }
                    }
                    else {
                        invalidFields[invalidFields.length] = key;
                    }
                }

                // TODO: This needs the code above to be move in to a reusable place and then placed
                // outside the save process so that user has a choice to cancel.
                // this also needs a real dialog and more information about the fields 
                // instead of an ugly system name
                //if(invalidFields.length > 0) {
                //    var invalidFieldsMsg = 
                //    "The following fields were found in the content due to a model change and will not be saved: \n";
                //    for(var g=0; g<invalidFields.length; g++) {
                //       invalidFieldsMsg + "\t"+invalidFields[length]+"\n";
                //    }
                //    alert(invalidFieldsMsg);
                //}

                return output;
            },

            escapeXml: function(value) {
                if(value && typeof value === 'string') {
                    value = value.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;');
                }

                return value;
            },

            unEscapeXml: function(value) {
                if(value && typeof value === 'string') {
                    value = value.replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '\"')
                        .replace(/&amp;/g, '&');
                }

                return value;
            },

            defaultSectionTitle: "Default Section Title"
        }

        return cfe;
    }();



CStudioAuthoring.Module.moduleLoaded("cstudio-forms-engine", CStudioForms);
