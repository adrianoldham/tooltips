// Public methods:
// ------------------------------
// tooltip.reload();                // Updates the tooltips
// tooltip.getToolTipContainer();   // Returns the dom element you can apply ShadowMe to

Array.prototype.index = function(val) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] == val) return i;
    }

    return null;
};

Array.prototype.include = function(val) {
    return this.index(val) !== null;
};

var ToolTips = Class.create({
    initialize: function(selector, options) {
        this.options = Object.extend(Object.extend({ }, ToolTips.DefaultOptions), options || { });
        
        this.selector = selector;        
        this.targets = $$(selector);
        
        // Attach mouse over and mouse out events
        this.targets.each(function(target) {
            // Store title inside tooltip variable inside of the target and remove default tooltip
            target.tooltip = target.title;
            target.title = "";
            
            this.setupTargetEvents(target);
        }.bind(this));
        
        this.generateToolTip();
        
        // Apply mouse move to whole document   
        if (!this.options.fixed) {
            $(document.body).observe('mousemove', this.storeMousePosition.bindAsEventListener(this));
            $(document.body).observe('mousemove', this.updatePosition.bind(this));
        }
    },
    
    setupTargetEvents: function(target) {
        target.observe('mouseover', function(event, target) {
            clearTimeout(this.delayTimer);
            this.delayTimer = setTimeout(this.showToolTip.bind(this, event, target), this.options.showDelay)
        }.bindAsEventListener(this, target));
        
        target.observe('mouseout', function() {
            clearTimeout(this.delayTimer);
            this.hideToolTip(target);
        }.bind(this));  
    },
    
    // Call this externally to reload the tooltips
    reload: function() {
        var tempTargets = $$(this.selector);

        // Reload the tooltips
        tempTargets.each(function(target) {
            // Only update if changed
            if (target.title != "") {
                target.tooltip = target.title;
                target.title = "";
            }
            
            if (!this.targets.include(target)) {
                this.setupTargetEvents(target);
            }
        }.bind(this));
        
        this.targets = tempTargets;
    },
    
    // Returns the tooltip container that you can apply ShadowMe to
    getToolTipContainer: function() {
        return this.toolTipContainer;
    },
    
    generateToolTip: function() {
        // Create dom elements
        this.toolTipContainer   = new Element("div", { "class": this.options.containerClass });
        this.toolTipTitle       = new Element(this.options.titleTagName, { "class": this.options.titleClass });
        this.toolTipContent     = new Element("div", { "class": this.options.contentClass });
        this.toolTipStem        = new Element("div", { "class": this.options.stemClass });
        
        // Attach to each other
        this.toolTipContainer.insert(this.toolTipTitle);
        this.toolTipContainer.insert(this.toolTipContent);
        this.toolTipContainer.insert(this.toolTipStem);
        
        // Position absolutely
        this.toolTipContainer.setStyle({ position: "absolute" });
        
        // Hide by default
        this.toolTipContainer.hide();
        
        // Insert into the body
        $(document.body).insert(this.toolTipContainer);
    },
    
    storeMousePosition: function(event) {
        this.mouse = { x: Event.pointerX(event), y: Event.pointerY(event) };
    },
    
    updatePosition: function(target) {
        // Store old display and opacity so we can revert back to them once position is done
        oldDisplay = this.toolTipContainer.getStyle('display');
        oldOpacity = this.toolTipContainer.getOpacity();
        
        // Show, but make transparent so that we can grab the size
        this.toolTipContainer.setOpacity(0);
        this.toolTipContainer.show();
        
        // Position to start hooks from
        var startingPosition;
        
        // Copy so we can manipulate
        var offset = Object.extend({}, this.options.offset);
        var hook = Object.extend({}, this.options.hook);
        
        // Make lower case for easier regex
        hook.target = hook.target.toLowerCase();
        hook.tip = hook.tip.toLowerCase();
        
        var update = function() {};
        var update = function(level) {
            // Starting level is 0 (this is so we don't run into an infinite loop)
            if (level == undefined) level = 0;
            if (level > 1) return;
            
            if (this.options.fixed) {
                // Grab size of target element
                var targetSize = { width: target.offsetWidth, height: target.offsetHeight };

                // Begin with the position of the target
                var tempOffset = target.cumulativeOffset();
                startingPosition = { x: tempOffset[0], y: tempOffset[1] };
                
                // Adjust positioing for scrolled parents 
                var t = $(target.parentNode);
                while (t != null && t.tagName != 'body') {
                    if (t.scrollLeft != undefined) startingPosition.x -= t.scrollLeft;
                    if (t.scrollTop != undefined) startingPosition.y -= t.scrollTop;
                    t = $(t.parentNode);
                }

                // Lowercase target hooking
                var targetHook = hook.target.toLowerCase();

                // Perform target hooking
                if (targetHook.match('bottom')) startingPosition.y += targetSize.height;
                if (targetHook.match('right')) startingPosition.x += targetSize.width;

                // Middle target hooking
                if (targetHook == "bottom" || targetHook == "top") startingPosition.x += parseInt(targetSize.width / 2.0);
                if (targetHook == "right" || targetHook == "left") startingPosition.y += parseInt(targetSize.height / 2.0);
            } else {
                // Begin from where the mouse is
                startingPosition = { x: this.mouse.x, y: this.mouse.y };
            }

            // Grab size of tooltip
            var toolTipSize = { width: this.toolTipContainer.offsetWidth, height: this.toolTipContainer.offsetHeight };

            // Lowercase tip hooking
            var tipHook = hook.tip.toLowerCase();
            
            // Perform tips hooking
            if (tipHook.match('bottom')) startingPosition.y -= toolTipSize.height;
            if (tipHook.match('right')) startingPosition.x -= toolTipSize.width;

            // Middle target hooking
            if (tipHook == "bottom" || tipHook == "top") startingPosition.x -= parseInt(toolTipSize.width / 2.0);
            if (tipHook == "right" || tipHook == "left") startingPosition.y -= parseInt(toolTipSize.height / 2.0);

            // Do offset
            startingPosition.x += offset.x;
            startingPosition.y += offset.y;  
            
            // Mirror if required
            var dimensions = document.viewport.getDimensions();
            var scrollOffset = document.viewport.getScrollOffsets();
            
            var viewPortBounds = {
                top:    scrollOffset.top,
                right:  scrollOffset.left + dimensions.width,
                bottom: scrollOffset.top + dimensions.height,
                left:   scrollOffset.left
            };
            
            var toolTipBounds = {
                top:    startingPosition.y,
                right:  startingPosition.x + toolTipSize.width,
                bottom: startingPosition.y + toolTipSize.height,
                left:   startingPosition.x
            };
            
            // Remove mirror class first (reset mirror state) - only remove if first check
            if (level == 0) {
                this.toolTipContainer.removeClassName(this.options.mirrorClass);
                this.toolTipContainer.removeClassName(this.options.verticalMirrorClass);
                this.toolTipContainer.removeClassName(this.options.horizontalMirrorClass);
            }
            
            // Check to left/right mirroring
            if (toolTipBounds.right > viewPortBounds.right || toolTipBounds.left < viewPortBounds.left) {
                if (hook.tip.match('right')) {
                    hook.tip = hook.tip.replace(/right/, 'left');
                } else if (hook.tip.match('left')) {
                    hook.tip = hook.tip.replace(/left/, 'right'); 
                }
                
                if (hook.target.match('right')) {
                    hook.target = hook.target.replace(/right/, 'left');  
                }  else if (hook.target.match('left')) {
                    hook.target = hook.target.replace(/left/, 'right');
                }
                
                offset.x = -offset.x;
               
                this.toolTipContainer.addClassName(this.options.mirrorClass);
                this.toolTipContainer.addClassName(this.options.horizontalMirrorClass);
            }
            
            // Check to top/bottom mirroring
            if (toolTipBounds.bottom > viewPortBounds.bottom || toolTipBounds.top < viewPortBounds.top) {
                if (hook.tip.match('bottom')) {
                    hook.tip = hook.tip.replace(/bottom/, 'top');
                } else if (hook.tip.match('top')) {
                    hook.tip = hook.tip.replace(/top/, 'bottom'); 
                }
                
                if (hook.target.match('bottom')) {
                    hook.target = hook.target.replace(/bottom/, 'top');  
                }  else if (hook.target.match('top')) {
                    hook.target = hook.target.replace(/top/, 'bottom');
                }
                
                offset.y = -offset.y;
                
                this.toolTipContainer.addClassName(this.options.mirrorClass);
                this.toolTipContainer.addClassName(this.options.verticalMirrorClass);
            }

            update(++level);
        }.bind(this);
        
        update();
        
        this.toolTipContainer.setStyle({
            left: startingPosition.x + "px", top: startingPosition.y + "px"
        });
        
        this.toolTipContainer.setStyle({ display: oldDisplay })
        this.toolTipContainer.setOpacity(oldOpacity);
    },
    
    showToolTip: function(event, target) {        
        var data = target.tooltip.split(this.options.delimiter);
        var title = data[0];
        var content = data[1];
        
        this.toolTipTitle.innerHTML = title;
        this.toolTipContent.innerHTML = content;
        
        // Show, but make transparent so that we can grab the size
        this.toolTipContainer.setOpacity(0);
        this.toolTipContainer.show();
        
        this.updatePosition(target);
        
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
    // Mirror classes
    mirrorClass:            "mirrored",
    verticalMirrorClass:    "vertical",
    horizontalMirrorClass:  "horizontal",
    
    // Fixed does not follow the mouse
    fixed:              true, 
    
    // Offset to apply to the position of the tooltip
    offset:             { x: 0, y: 10 },
    
    // Delay until tooltip is shown
    showDelay:          200,
    
    // Fade config
    fade:               true,
    fadeSpeed:          300,

    // Works like prototip
    hook:               { target: "bottom", tip: "top" },
    
    // Delimiter used to grab title and content
    delimiter:          ":",
    
    // Tag name used for the title element
    titleTagName:       "h2",
    
    // Classes for dom injection
    containerClass:     "tooltip-container",
    titleClass:         "tooltip-title",
    contentClass:       "tooltip-content",
    stemClass:          "tooltip-stem"
};