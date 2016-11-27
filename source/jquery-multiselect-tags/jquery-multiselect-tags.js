(function($){
	
	function MultiselectTags($element, options){
		
		// This plugin only works on multiselect elements
		if($element.prop('tagName') != 'SELECT' || !$element.attr('multiple')){
			throw Error('Wrong element. jquery-multiselect-tags can only be applied to SELECT-elements with the MULTIPLE-attribute!');
			return;
		}
		
		this.$element = $element;
		this.options = $.extend(this.DEFAULTS, options);
		this.$wrapper;
		this.$tagContainer;
		this.$tagInput;
		this.initMarkup();
	}
	
	MultiselectTags.prototype.initMarkup = function(){
		// Hide the initial select
		this.$element.hide();
		
		// Wrap the initial select with a div to make it look like an input
		this.$element.wrap('<div class="form-control" />');
		this.$wrapper = this.$element.parent('.form-control');
		
		// Create a list, where all tags will be put in
		this.$tagContainer = $('<ul class="list-inline" style="display: inline;"></ul>');
		this.$wrapper.append(this.$tagContainer);
		
		// Delegate-Listener for removing a tag
		this.$tagContainer.on('click', '[data-remove]', $.proxy(function(event){
			event.preventDefault();
			var $element = $(event.currentTarget).closest('li');
			var value = $element.attr('data-value');
			this.unselectOption(value);
		}, this));
		
		// Append an actual input element to the wrapper to type in new tags
		this.$tagInput = $('<input type="text" class="tag-input">');
		this.$tagContainer.after(this.$tagInput);
		
		// Click-Handler for wrapper element - focus the input
		this.$wrapper.on('click', $.proxy(function(event){
			event.preventDefault();
			this.$tagInput.focus();
		}, this));
		
		// Hitting BACKSPACE in the input removes the last tag, if configured in options
		if(true == this.options.enableBackspaceRemove){
			this.$tagInput.on('keydown', $.proxy(function(event){
				if(this.$tagInput.val() == '' && event.which == 8){
					var value = this.$tagContainer.find('li:last').last().attr('data-value');
					this.unselectOption(value);
				}
			}, this));
		}
		
		// Hitting ENTER will add the tag
		this.$tagInput.on('keypress', $.proxy(function(event){
			if(this.$tagInput.val() != '' && event.which == 13){
				event.preventDefault();
				var value = this.findValueByLabel(this.$tagInput.val());
				this.selectOption(value, false);
				this.$tagInput.val('').typeahead('close');
			}
		}, this));
		
		// Add typeahead for suggestions to tag-input, if configured in options
		if(true == this.options.enableTypeahead){
			this.initTypeahead();
			this.$tagInput.on('typeahead:select', $.proxy(function(event, suggestion, dataset){
				this.selectOption(suggestion.value);
				this.$tagInput.val('').typeahead('close');
			}, this));
		}
		
		// Make all selected options of the initial select a tag
		var values = this.$element.val();
		for(i in values){
			this.selectOption(values[i], true);
		}
		
		// Trigger custom event
		this.$element.trigger('multiselecttags.init');
	};
	
	MultiselectTags.prototype.initTypeahead = function(){
		var typeaheadValues = [];
		this.$element.find('option').each(function(){
			typeaheadValues.push({value: $(this).attr('value'), label: $(this).text()});
		});
		this.$tagInput.typeahead({
		  minLength: 1,
		  highlight: true,
		  hint: false
		},
		{
		  name: 'my-dataset',
		  source: this.typeaheadCb(typeaheadValues),
		  displayKey: 'label'
		});
	};
	
	MultiselectTags.prototype.findValueByLabel = function(label)
	{
		Regex = new RegExp(label, 'i');
		var value = label;
		this.$element.find('option').each(function() {
			if (Regex.test($(this).text())) {
				value = $(this).attr('value');
			}
		});
		
		return value;
	}
	
	MultiselectTags.prototype.typeaheadCb = function(strs){
	  return function findMatches(q, cb) {
	    var matches, substrRegex;
	 
	    // an array that will be populated with substring matches
	    matches = [];
	 
	    // regex used to determine if a string contains the substring `q`
	    substrRegex = new RegExp(q, 'i');
	 
	    // iterate through the pool of strings and for any string that
	    // contains the substring `q`, add it to the `matches` array
	    $.each(strs, function(i, str) {
	      if (substrRegex.test(str.label)) {
	        // the typeahead jQuery plugin expects suggestions to a
	        // JavaScript object, refer to typeahead docs for more info
	        matches.push({ value: str.value, label: str.label });
	      }
	    });
	 
	    cb(matches);
	  };
	};
	
	MultiselectTags.prototype.unselectOption = function(value){
		// Remove the tag from the tag container
		this.$tagContainer.find('li[data-value="' + value + '"]').remove();
		
		// Unselect the option within the original select
		this.$element.find('option[value="' + value + '"]').removeAttr('selected');
		
		// Trigger custom event
		this.$element.trigger('multiselecttags.unselected');
	};
	
	MultiselectTags.prototype.selectOption = function(value, firstInit){
		// Find an option with this value in the original select
		var $option = this.$element.find('option[value="' + value + '"]');
		
		// Check if option was found
		if($option.length <= 0){
			if(true == this.options.allowNewTags){
				// Trigger custom event
				this.$element.trigger('multiselecttags.beforeAddNewTag', [value]);
				
				$option = $('<option value="' + value + '">' + value + '</option>');
				this.$element.append($option);
				
				// Refresh typeahead with the new possible suggestion, if typeahead is active
				if(true == this.options.enableTypeahead){
					this.$tagInput.typeahead('destroy');
					this.initTypeahead();
				}
				
				// Trigger custom event
				this.$element.trigger('multiselecttags.afterAddNewTag', [value]);
			} else {
				var $message = $('<li class="text-danger">Adding new tags is not allowed.</li>');
				this.$tagContainer.append($message);
				window.setTimeout(function(){
					$message.fadeOut('slow', function(){
						$(this).remove();
					});
				}, 2000);
				
				// Trigger custom event
				this.$element.trigger('multiselecttags.notAllowedToAddNewTag');
				
				this.$tagInput.val('').focus();
				if(true == this.options.enableTypeahead){
					this.$tagInput.typeahead('close');
				}
				
				return;
			}
		}
		
		// Check if option is already selected = no duplicates
		if($option.attr('selected') && firstInit != true){
			this.$tagContainer.find('li[data-value="' + value + '"]').animate({opacity: '0'}, 200);
			this.$tagContainer.find('li[data-value="' + value + '"]').animate({opacity: '1'}, 200);
			this.$tagContainer.find('li[data-value="' + value + '"]').animate({opacity: '0'}, 200);
			this.$tagContainer.find('li[data-value="' + value + '"]').animate({opacity: '1'}, 200);
			
			// Trigger custom event
			this.$element.trigger('multiselecttags.alreadySelected');
			
			this.$tagInput.val('').focus();
			if(true == this.options.enableTypeahead){
				this.$tagInput.typeahead('close');
			}
			return;
		}
		
		// Select the option
		$option.attr('selected', 'selected');
		
		// Add a new tag in the tag container
		this.$tagContainer.append('<li class="list-inline-item" data-value="' + value + '"><span style="font-size: 1em;" class="label label-primary">' + $option.text() + ' <span data-remove="" class="close" style="float: none; font-size: inherit;">&times;</span></span></li>');
		
		// Trigger custom event
		this.$element.trigger('multiselecttags.selected');
		
		this.$tagInput.val('').focus();
		if(true == this.options.enableTypeahead){
			this.$tagInput.typeahead('close');
		}
	};
	
	MultiselectTags.prototype.DEFAULTS = {
		allowNewTags: false,
		enableBackspaceRemove: true,
		enableTypeahead: false
	};
	
	Plugin = function(option){
		$elements = this;
		this.each(function(){
			var $this = $(this);
			var data = $this.data('multiselecttags');
			var options = typeof option == 'object' && option;
			
			if (!data) $this.data('multiselecttags', (data = new MultiselectTags($(this), options)));
			else data[option];
		});
	};
	
	$.fn.multiselectTags = Plugin;
	$.fn.multiselectTags.Constructor = MultiselectTags;
	
})(jQuery);