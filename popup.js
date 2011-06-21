

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

	$('html').append(_popupNode);
	
	var _buttonId = Common.getId('button');

	var _buttonNode = $('<div></div>');

	_buttonNode.attr('id', _buttonId).attr('class', Common.getCommonClass());;
	_buttonNode.css({
		'position': 'absolute',
		'display' :  'none',
		'zIndex' :  9999999,
		'background-image' : 'url("' + chrome.extension.getURL('icon16.png') + '")',
	});
	$('html').append(_buttonNode);

	var _that = this;
	var _active = false;
	var _buttonActive = false;
	var _lastSelection = '';
	var _activator;


	var _urlVariables = [
// 		[/%PAGE_HOSTNAME/g,  encodeURIComponent(location.hostname)],
		[/%PAGE_HOST/g, encodeURIComponent(location.host)],
		[/%PAGE_URL/g, encodeURIComponent(location.href)],
		[/%PAGE_ORIGIN/g, encodeURIComponent(location.origin)],
// 		[/%PAGE_PATH/g, encodeURIComponent(location.pathname)],
	]

// 	var _domain = location.hostname.split('.');
// 	if(_domain.length > 1)
// 		_domain = _domain.slice(1).join('.');
// 	else
// 		_domain = location.hostname;
// 
// 	_urlVariables.push([/%PAGE_DOMAIN/g, encodeURIComponent(_domain)]);
// 
// 	delete _domain;
	
	this.options = {};


	_buttonNode.mouseover(function(e){

		_that.show(_buttonNode.offset().left, _buttonNode.offset().top);
	});

	
	this.show = function (x, y){

		if(_buttonActive)
			_that.hideButton();

		var pos = Common.calculateWindowPosition(_popupNode, x, y);

		_popupNode.css({'top': pos.y + 'px', 'left': pos.x + 'px'});
		_popupNode.fadeIn(200);
		_active = true;


	}

	
	this.showButton = function(x, y){

		var pos = Common.calculateWindowPosition(_buttonNode, x, y);

		_buttonNode.css({'top': pos.y + 'px', 'left': pos.x + 'px'});
		_buttonNode.fadeIn(100);

		_buttonActive = true;
	}

	this.hide = function (){

		_popupNode.fadeOut(200);
		_active = false;
	}

	this.hideButton = function(){
		_buttonNode.fadeOut(100);
		_buttonActive = false;
	}

	this.addSearchEngine = function(engine){

		_addSearchEngine(engine, _popupNode, 0);

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

	function _addFolder(engine, node, level){

		var icon_url = _getIconUrl(engine);
		if (icon_url == undefined)
			icon_url = '#';

		var a = $('<a href="#"></a>');

		if(_that.options.remove_icons == 'no' || (_that.options.remove_icons == 'https' && location.href.substr(0, 5) != 'https'))
			a.append($('<img class="engine-img" />').attr('src', icon_url));

		a.append(
				$('<span class="engine-name"></span').text(engine.name)
			).attr('title', engine.name);



		var _folderId = Common.getId('popup');

		var _folderNode = $('<ul></ul>');
		_folderNode.append($('<li></li>').hide());

		_folderNode.attr('id', _folderId).attr('class', Common.getCommonClass());
		_folderNode.css({
			'position': 'absolute',
			'display': 'none',
			'zIndex' :  9999999 + level,
		});

		var separate_menus = _that.options.separate_menus;
		for(var i in engine.engines){


			if(separate_menus && engine.engines[i].hide_in_popup)
				continue;
			
			_addSearchEngine(engine.engines[i], _folderNode, level+1);

			
		}


		var timer_id = null;
		var hide_id = null;
		var is_visible = false; // This is used to prevent flickering when going from submenu back to the a

		a.mouseenter(function(e){

			if(engine.hidemenu)
				return;
			var that = this;

			if(timer_id){
				clearTimeout(timer_id);
				timer_id= null;
			}

			timer_id = setTimeout(function(){

				timer_id = null;

				if(is_visible)
					return;

				is_visible = true;
				_showSubmenu(_folderNode, that);

			}, 150);

		});



		a.click(function(e){

			if(!engine.openall)
				return false;


			function get_all_links(en, urls){
	
				for(var i in en.engines){

					var e = en.engines[i];

					if(separate_menus && e.hide_in_popup)
						continue;

					
					if(e.is_submenu){
						urls = get_all_links(e, urls);
					}else{
						urls.push(_createSearchUrl(e.url, _lastSelection, e.post));
					}
				}

				return urls;

			}

			
			var urls_to_open = get_all_links(engine, []);
// 			console.log(urls_to_open);

			chrome.extension.sendRequest({action:'openUrls', urls:urls_to_open});

			return false;
		});


		

		node.append(

			$('<li class="engine-submenu"></li>').css('position', 'relative').append(a).append(_folderNode).mouseleave(function(e){

				if(engine.hidemenu)
					return;

				if(timer_id){
					clearTimeout(timer_id);
					timer_id = null;
				}

				var that = this;
				hide_id = setTimeout(function(){
					hide_id = null;
					is_visible = false;
					$(that).find('ul').fadeOut(200);
				}, 200);


			}).mouseenter(function(e){

				if(hide_id){
					clearTimeout(hide_id);
					hide_id = null;
				}

			})
		);
	}



	function _addSearchEngine(engine, node, level){

		if(engine.is_submenu)
			return _addFolder(engine, node, level+1);
		if(engine.is_separator)
			return _addSeparator(engine, node, level);
		
		var icon_url = _getIconUrl(engine);
		if (icon_url == undefined)
			icon_url = '#';

		var a = $('<a href="#"></a>');

		if(_that.options.remove_icons == 'no' || (_that.options.remove_icons == 'https' && location.href.substr(0, 5) != 'https'))
			a.append($('<img class="engine-img" />').attr('src', icon_url));

		a.append(
				$('<span class="engine-name"></span').text(engine.name)
			).attr('title', engine.name).data('search_url', engine.url).data('engine-post', engine.post || false).mouseenter(function(){


				var url = _createSearchUrl($(this).data('search_url'), _lastSelection, $(this).data('engine-post'));

				$(this).attr('href', url);
			})

		if(_that.options.newtab){
			a.attr('target', '_blank');
		}

		node.append($('<li></li>').append(a));

	}


	function _addSeparator(engine, node, level){

		node.append($('<li class="engine-separator"></li>'))

	}

	function _showSubmenu(node, parent){


		var pos = Common.calculateSubmenuPosition(node, $(parent));


		node.css({'top': pos.y + 'px', 'left': pos.x + 'px'});

		node.fadeIn(200);
	}



	function _createSearchUrl(search_url, selection, is_post){


		for(var i=0; i<_urlVariables.length; ++i){
			search_url = search_url.replace(_urlVariables[i][0], _urlVariables[i][1]);
		}
		var url = '';
		//If its a post url we encode only the part before {POSTARGS}
		if(is_post){
			var parts = search_url.split('{POSTARGS}', 2);
			if(parts.length == 2){
				url = parts[0].replace(/%s/g, encodeURIComponent(selection));
				url += '{POSTARGS}' + parts[1].replace(/%s/g, selection);
			}else{
				url = search_url.replace(/%s/g, encodeURIComponent(selection));
			}

			url = chrome.extension.getURL('postsearch.html') + '?url='+encodeURIComponent(url);
		}
		else{

			var placeholder = search_url;


			// Special case for only "%s" engine
			// to allow opening of selected urls
			var sel = '';
			if(placeholder == '%s'){
				if(!selection.match(/^(https?|ftp):\/\//))
					sel = 'http://' + selection;
				else
					sel = selection;
			}
			else
				sel = encodeURIComponent(selection);


			url = search_url.replace(/%s/g, sel);
		}


		return url;

	}


}

PopUp.getIconUrlFromEngine = function(engine) {
	if(engine.icon_url != undefined)
		return engine.icon_url;
	else if(engine.is_submenu)
		return chrome.extension.getURL('folder.png');
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



function ClickActivator(_popup){

	var _doubleClickTime = 0;

	this.setup = function(){

		$(document).mousedown(function(e){
			
			if(_popup.isActive()){
				_popup.hide();
				return;
			}

			var in_input = false;
			if(e.target.nodeName in {'INPUT':1, 'TEXTAREA':1}){
				if(!e.ctrlKey || !_popup.options.show_in_inputs)
					return;
				in_input = true;
			}


			if (!PopUp.hasSelection() || e.button != _popup.options.button)
				return;

			// we don't want to prevent tripleclick selection
			if(e.button == 0 && e.timeStamp - _doubleClickTime < 130)
				return;


			var rx = window.pageXOffset;
			var ry = window.pageYOffset;
			
			var rect = PopUp.getSelectionRect();

			if(rect){
				rx += rect.left;
				ry += rect.top;
			}

			if (in_input || (e.pageY >= ry && e.pageY <= ry + rect.height && e.pageX >= rx && e.pageX <= rx + rect.width)){

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

			_startedInInput = false;

			if(_popup.isActive())
				_popup.hide();
			if(_popup.buttonIsActive())
				_popup.hideButton();


			if(e.target.nodeName in {'INPUT':1, 'TEXTAREA':1}){
				_startedInInput = true;
				if(!e.ctrlKey || !_popup.options.show_in_inputs)
					return;

				if(PopUp.hasSelection() && e.button == 0){

					var sel = PopUp.getSelection();
					_popup.setSelection(sel)
					_popup.show(e.pageX, e.pageY);

					e.stopPropagation();
					e.preventDefault();

				}
			}

		});

		$(document).mouseup(function(e){

			if(_startedInInput)
				return;

			if(e.button != 0 || _popup.isActive())
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

			var sel = PopUp.getSelection();
			_popup.setSelection(sel);

			var rect = PopUp.getSelectionRect();
			var x = window.pageXOffset + rect.right;
			var y = window.pageYOffset + rect.top - _popup.buttonNode().height() - 20;

			_popup.showButton(x, y);

			_lastTimer = undefined;

		}
	}
}



function KeyAndMouseActivator(_popup){

	var _keys = {}; // Keybard Combo
	var _mouseButton = 0;

	this.setup = function(){

		var combo = _popup.options.k_and_m_combo;
		var e = combo.length - 1;
		for(var i=0; i<e; ++i){
			_keys[combo[i]] = false;
		}

		_mouseButton = combo[combo.length-1];

		// Disable context menu if right click is used
		if(_mouseButton == 2){

			$(document).bind('contextmenu', function (e){
				if (PopUp.hasSelection() && is_keyboard_combo_activated() && _mouseButton == e.button)
					return false;
			});

		}
		$(document).keydown(function(e){

			if(e.which in _keys)
				_keys[e.which] = true;
		});

		$(document).keyup(function(e){

			if(e.which in _keys)
				_keys[e.which] = false;
		});


		$(document).mousedown(function(e){

			if(_popup.isActive()){
				_popup.hide();
				return;
			}


			if (!PopUp.hasSelection() || !is_keyboard_combo_activated() || _mouseButton != e.button)
				return;

			var sel = PopUp.getSelection();
			_popup.setSelection(sel)
			_popup.show(e.pageX, e.pageY);

			e.stopPropagation();
			e.preventDefault();

		});

	}

	function is_keyboard_combo_activated(){

		for (key in _keys){
			if(!_keys[key])
				return false;
		}
		return true;

	}

}

