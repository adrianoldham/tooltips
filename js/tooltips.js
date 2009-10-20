var ToolTips = Class.create({
    initialize: function(selectors, options) {
        this.options = Object.extend(Object.extend({ }, ToolTips.DefaultOptions), options || { });
        
        this.elements = $$(selectors);
        
        // Attach mouse over and mouse out events
        this.elements.each(function(element) {
            element.observe('mousemove', this.updatePosition.bindAsEventListener(this));
            
            element.observe('mouseover', function() {
                clearTimeout(this.delayTimer);
                this.delayTimer = setTimeout(this.showToolTip.bind(this, element), this.options.showDelay)
            }.bind(this));
            
            element.observe('mouseout', function() {
                clearTimeout(this.delayTimer);
                this.hideToolTip(element);
            }.bind(this));
        }.bind(this));
        
        this.generateToolTip();
    },
    
    generateToolTip: function() {
        // Create dom elements
        this.toolTipContainer = new Element("div", { "class": this.options.containerClass });
        this.toolTipTitle = new Element(this.options.titleTagName, { "class": this.options.titleClass });
        this.toolTipContent = new Element("div", { "class": this.options.contentClass });
        this.toolTipStem = new Element("div", { "class": this.options.stemClass });
        
        // Attach to each other
        this.toolTipContainer.insert(this.toolTipTitle);
        this.toolTipContainer.insert(this.toolTipContent);
        this.toolTipContainer.insert(this.toolTipStem);
        
        // Position absolutely
        this.toolTipContainer.setStyle({
            position: "absolute"
        });
        
        // Hide by default
        this.toolTipContainer.hide();
        
        // Insert into the body
        $(document.body).insert(this.toolTipContainer);
    },
    
    updatePosition: function(event, element) {
        var toolTipSize = [ this.toolTipContainer.offsetWidth, this.toolTipContainer.offsetHeight ];
        var offset, position;
        
        if (this.options.fixed) {
            if (element == null) return;
            
            var elementSize = [ element.offsetWidth, element.offsetHeight ];
            
            offset = element.cumulativeOffset();
            position = [ offset[0], offset[1] ];
            
            // Top/bottom hooks
            if (this.options.hooks.include('bottom')) {
                position[1] = offset[1] + elementSize[1];   
            }

            // Left/right hooks
            if (this.options.hooks.include('right')) {
                position[0] = offset[0] + elementSize[0];   
            } else if (this.options.hooks.include('left')) {
                position[0] = offset[0] - toolTipSize[0];
            }
        } else {
            if (event == null) return;
            
            offset = [ Event.pointerX(event), Event.pointerY(event) ];
            position = [ offset[0], offset[1] ];
        }
        
        if (this.options.hooks.include('top')) {
            position[1] = offset[1] - toolTipSize[1];
        }
        
        if (this.options.hooks.include('left')) {
            position[0] = offset[0] - toolTipSize[0];
        }
        
        // Offsets from options
        position[0] += this.options.offset.x;
        position[1] += this.options.offset.y;
        
        this.toolTipContainer.setStyle({
            left: position[0] + "px", top: position[1] + "px"
        });
    },
    
    showToolTip: function(element) {        
        var data = element.title.split(this.options.delimiter);
        var title = data[0];
        var content = data[1];
        
        this.toolTipTitle.innerHTML = title;
        this.toolTipContent.innerHTML = content;
        
        // Show, but make transparent so that we can grab the size
        this.toolTipContainer.show();
        this.toolTipContainer.setOpacity(0);
        
        this.updatePosition(null, element);
        
        // Fade or not
        if (this.options.fade) {
            if (this.lastEffect != null) this.lastEffect.cancel();
            this.lastEffect = new Effect.Appear(this.toolTipContainer, { duration: this.options.fadeSpeed / 1000 });           
        } else {
            this.toolTipContainer.setOpacity(1);   
        }
    },
    
    hideToolTip: function() {
        // Fade or not
        if (this.options.fade) {
            if (this.lastEffect != null) this.lastEffect.cancel();
            this.lastEffect = new Effect.Fade(this.toolTipContainer, { duration: this.options.fadeSpeed / 1000 });
        } else {
            this.toolTipContainer.hide();
        }
    }
});

ToolTips.DefaultOptions = {
    // Fixed does not follow the mouse
    fixed:              true, 
    
    // Offset to apply to the position of the tooltip
    offset:             { x: 0, y: 10 },
    
    // Delay until tooltip is shown
    showDelay:          200,
    
    // Fade config
    fade:               true,
    fadeSpeed:          300,
    
    // Hooks, to hook to the top, left, bottom or right (can only use bottom or top at the same time, and left or right at the same time)
    // Add each hook into the array
    hooks:              [ "bottom" ],
    
    
    // Delimiter used to grab title and content
    delimiter:          ":",
    
    // Tag name used for the title element
    titleTagName:       "h2",
    
    // Classes for dom injection
    containerClass:     "tooltip-container",
    titleClass:         "tooltip-title",
    contentClass:       "tooltip-content",
    stemClass:       "tooltip-stem"
};