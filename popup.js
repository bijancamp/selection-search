

function PopUp()
{

	var _popupId = Common.getId('popup');

	var _popupNode = $('<ul></ul>');
	_popupNode.append($('<li></li>').append(
		$('<input type="text" />').bind('input', function(){
			_lastSelection = $(this).val();
		})
	));

	_popupNode.attr('id', _popupId).attr('class', Common.getCommonClass());
	_popupNode.css({
		'position': 'absolute',
		'display' :  'none',
		'zIndex' :  9999999,
	});

	$('body').first().append(_popupNode);
	
	var _buttonId = Common.getId('button');

	var _buttonNode = $('<div></div>');

	_buttonNode.attr('id', _buttonId).attr('class', Common.getCommonClass());;
	_buttonNode.css({
		'position': 'absolute',
		'display' :  'none',
		'zIndex' :  9999999,
		'background-image' : 'url("' + chrome.extension.getURL('icon16.png') + '")',
	});
	$('body').first().append(_buttonNode);


	var _that = this;
	var _active = false;
	var _buttonActive = false;
	var _lastSelection = '';
	var _activator;

	this.options = {};


	_buttonNode.mouseover(function(e){

		_that.show(_buttonNode.offset().left, _buttonNode.offset().top);
	});

	
	this.show = function (x, y){

		if(_buttonActive)
			_that.hideButton();

		var wwidth =  $(window).width() - 5;
		var wheight = $(window).height() - 5;

		if (x - window.pageXOffset + _popupNode.outerWidth() > wwidth)
			x -= (x - window.pageXOffset + _popupNode.outerWidth()) - wwidth;
		else if(x - window.pageXOffset < 5)
			x = window.pageXOffset + 5;
	
		if (y - window.pageYOffset + _popupNode.outerHeight() > wheight)
			y -= (y - window.pageYOffset + _popupNode.outerHeight()) - wheight;
		else if(y - window.pageYOffset < 5)
			y = window.pageYOffset + 5

		_popupNode.css({'top': y + 'px', 'left': x + 'px'});
		_popupNode.show(200);
		_active = true;


	}

	this.showButton = function(x, y){

		var wwidth =  $(window).width() - 5;
		var wheight = $(window).height() - 5;

		if (x - window.pageXOffset + _buttonNode.outerWidth() > wwidth)
			x -= (x - window.pageXOffset + _buttonNode.outerWidth()) - wwidth;
		else if(x - window.pageXOffset < 5)
			x = window.pageXOffset + 5;

		if (y - window.pageYOffset + _buttonNode.outerHeight() > wheight)
			y -= (y - window.pageYOffset + _buttonNode.outerHeight()) - wheight;
		else if(y - window.pageYOffset < 5)
			y = window.pageYOffset + 5

		_buttonNode.css({'top': y + 'px', 'left': x + 'px'});
		_buttonNode.show(100);

		_buttonActive = true;
	}

	this.hide = function (){
		_popupNode.hide(200);
		_active = false;
	}

	this.hideButton = function(){
		_buttonNode.hide(100);
		_buttonActive = false;
	}

	this.addSearchEngine = function(engine){

		var icon_url = _getIconUrl(engine);
		if (icon_url == undefined)
			icon_url = '#';

		var a = $('<a href="#"></a>').append(
				$('<img class="engine-img" />').attr('src', icon_url)
			).append(
				$('<span class="engine-name"></span').text(engine.name)
			).attr('title', engine.name).data('search_url', engine.url).hover(function(){

				var url = $(this).data('search_url').replace(/%s/g, _lastSelection);

				$(this).attr('href', url);
			})

		//a.data('post', (engine.post != null && true) || false);
		if(engine.post){
			a.click(function(e){

				PopUp.submitPostForm($(this).attr('href'), $(this).attr('target') == '_blank' || e.button == 1);

				return false;
			});

		}


		if(_that.options.newtab){
			a.attr('target', '_blank');
		}
		
		_popupNode.append($('<li></li>').append(a));

	}

	this.bindEvents = function(){

		_activator.setup();

		_popupNode.mousedown(function(e){
			e.stopPropagation();
		});

	}

	this.setActivator = function(act){

		_activator = act;
	}

	this.getForPreview = function(){

		_setTitle('Lorem ipsum dolor sit amet, consectetur');
		_popupNode.css({'position': 'static', 'display': 'block'});
		return _popupNode;

	}

	this.getButtonForPreview = function(){

		_buttonNode.css({'position': 'static', 'display': 'block'});
		return _buttonNode;

	}

	this.setOptions = function(opts){
		_that.options = opts;
	}

	this.setSelection = function(sel){
		_setTitle(sel);
		_lastSelection = sel;
	}

	this.isActive = function(){
		return _active;
	}

	this.buttonIsActive = function(){
		return _buttonActive;
	}

	this.buttonNode = function(){
		return _buttonNode;
	}

	this.popupNode = function(){
		return _popupNode;
	}


	function _setTitle(title){
		_popupNode.children().first().children().first().val(title);
	}

	function _getSelection(){
		return PopUp.getSelection();
	}

	function _hasSelection(){
		return PopUp.hasSelection();
	}

	function _getIconUrl(engine){
		return PopUp.getIconUrlFromEngine(engine);

	}

}

PopUp.getIconUrlFromEngine = function(engine) {
	if(engine.icon_url != undefined)
		return engine.icon_url;
	return PopUp.getIconUrl(engine.url);
}
PopUp.getIconUrl = function(url) {
	url = url.replace('http://', '', 'https://', '').split('/')[0];
	if(url == undefined)
		return undefined;
	return 'http://www.google.com/s2/favicons?domain=' + url;
}

PopUp.getSelection = function(){
	return jQuery.trim(window.getSelection().toString());
}

PopUp.hasSelection = function(){
	var sel = PopUp.getSelection();

	if (sel.length == 0)
		return false;

	return sel.indexOf("\n") == -1;
}


PopUp.getSelectionRect = function(){

	var range = window.getSelection().getRangeAt(0);
	if(range)
		return range.getBoundingClientRect();
	return undefined;
}


PopUp.submitPostForm = function(url, newtab){

	var parts = url.split('{POSTARGS}', 2);

	if(parts.length != 2){
		alert('Invalid url for a POST search.\nThe url must contain "{POSTARGS}"');
		return;
	}
	
	var form = $('<form></form>')
		.attr('method', 'post')
		.attr('action', parts[0]);

	if(newtab)
		form.attr('target', '_blank');

	var query = parts[1].split('&');

	for(var i=0; i<query.length; ++i){
		var key_value = query[i].split('=', 2);
		if(key_value.length != 2)
			continue;
		form.append($('<input type="hidden" name="'+key_value[0]+'" value="'+key_value[1]+'" />'));
	}

	form.submit();
}


function ClickActivator(_popup){

	var _doubleClickTime = 0;

	this.setup = function(){

		$(document).mousedown(function(e){
			
			if(_popup.isActive()){
				_popup.hide();
				return;
			}

			if(e.target.nodeName in {'INPUT':1, 'TEXTAREA':1})
				return;



			if (!PopUp.hasSelection() || e.button != _popup.options.button)
				return;

			// we don't want to prevent tripleclick selection
			if(e.button == 0 && e.timeStamp - _doubleClickTime < 130)
				return;


			var rect = PopUp.getSelectionRect();

			var rx = window.pageXOffset + rect.left;
			var ry = window.pageYOffset + rect.top;

			if (e.pageY >= ry && e.pageY <= ry + rect.height && e.pageX >= rx && e.pageX <= rx + rect.width){

				var sel = PopUp.getSelection();
				_popup.setSelection(sel)
				_popup.show(e.pageX, e.pageY);

				e.stopPropagation();
				e.preventDefault();
			}
	
		});


		$(document).dblclick(function(e){
			if (e.button == 0){
				_doubleClickTime = e.timeStamp;
			}
		});
	}

}



function AutoActivator(_popup){

	var _lastTimer;
	var _startedInInput = false;

	this.setup = function(){

		$(document).mousedown(function(e){


			if(_lastTimer != undefined)
				window.clearTimeout(_lastTimer);

			if(e.target.nodeName in {'INPUT':1, 'TEXTAREA':1})
				_startedInInput = true;
			
			if(_popup.isActive())
				_popup.hide();
			if(_popup.buttonIsActive())
				_popup.hideButton();

		});

		$(document).mouseup(function(e){

			if(_startedInInput){
				_startedInInput = false;
				return;
			}
				
			_startedInInput = false;

			if(e.button != 0 || _popup.isActive())
				return;
			
			if(e.target.nodeName in {'INPUT':1, 'TEXTAREA':1})
				return;

			if (PopUp.hasSelection()){
				if(_lastTimer != undefined)
					window.clearTimeout(_lastTimer);
				_lastTimer = window.setTimeout(_tryShow, 300, e);

			}
		});

	}

	function _tryShow(e){
		if (PopUp.hasSelection()){


			var rect = PopUp.getSelectionRect();

			var x = window.pageXOffset + rect.right;
			var y = window.pageYOffset + rect.top - _popup.buttonNode().height() - 20;

			var sel = PopUp.getSelection();


	
			_popup.setSelection(sel)
			_popup.showButton(x, y);
			_lastTimer = undefined;
		}
	}
}
