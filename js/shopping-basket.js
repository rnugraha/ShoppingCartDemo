//
// A demo of simple Shopping Basket application
// using combination of Backbone and jQuery-UI.
//
// User: rnugraha
// Date: 12/27/12
// Time: 3:30 PM
//

$(document).ready(function() {

	// Action Button
	// -------------

	// Action button's model
	var Button = Backbone.Model.extend({

	});

	 // Action button's collection
	var ButtonList = Backbone.Collection.extend({
		model: Button
	});

	 // DOM element for a single action button
	var ButtonView = Backbone.View.extend({
		// is a button
		tagName: "button",

		// binding customized methods in the initialization
		initialize: function() {
			_.bindAll(this, "resetBasket", "submitOrder");
		},

		// invoked when reset button is clicked
		resetBasket: function() {
			// reset the order collection
			this.options.parent.collection.reset();
		},

		// invoked when submit button is clicked
		submitOrder: function() {
			// print out order in the console
			console.log(" ************** Following will be submitted **************");
			console.log(this.options.parent.collection.toJSON());
			console.log(" *********************************************************");
		},

		// render Button view
		render: function () {
			var view = this;

			// render button as jQuery-UI button
			$( this.el ).button({

				// use label from the associated model
				label: this.model.get('label')})

				// associate click event to invoke method
				// based on defined action in the button model
				.click(function (event, ui) {
					view[view.model.get('action')]();
				});
			return this;
		}
	});

	 // List of buttons
	var ButtonListView = Backbone.View.extend({
		// bind each button to <code>#buttonList</code>
		// <div> element in the HTML
		el: $("#buttonList"),

		// bind customized method to this view
		initialize: function(){
			_.bindAll(this, "renderButton");
		},

		// creation of each button
		// and append it to this view
		renderButton: function(model) {
			// create an button view with  associated model and parent's view
			var buttonView = new ButtonView({model: model, parent:this.options.parent});
			buttonView.render();
			$(this.el).append(buttonView.el);
		},

		// render each buttons defined the collection
		render: function () {
			this.collection.each(this.renderButton);
		}
	});

	// Product Category
	// ----------------

	// Category model
	var Category = Backbone.Model.extend({});

	// Category collection
	var CategoryCollection = Backbone.Collection.extend({
		// use Category model
		model: Category,
		// comparator to determine the sort order based on the <code>category_id</code>
		comparator: function (category)
		{
			return category.get("category_id");
		}
	});

	// Category view
	var CategoryView = Backbone.View.extend({
		// bind categories to <code>#categories</code>
		// element in the HTML
		el: $('#categories'),

		// HTML template for each category
		template: $('#prod-cat-tmpl').template(),

		// render Category view
		render: function(){
			// render categories as jQuery-UI selectable list
			$( "#categories" ).selectable({

				// action when a selectable is selected
				selected: function (event, ui) {

					// forced to only allow one selection
					// by removing selected <code>ui-selected</code> class
					// in the remaining selection when first item selected
					$(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");

					// empty the product list area
					$("#productList").empty();

					// define new collection for product items
					var items = new ItemCollection;

					// get collection of product item from
					// JSON data based on selected category
					items.url =  "data/" + $(".ui-selected").attr('label') + "_data.json";

					// fetch it synchronously
					items.fetch({async: false});

					// now, let's create the View for the product items
					// and render it
					var itemViewList = new ItemViewList({collection: items});
					itemViewList.render();
				}
			});

			// render each associated category model based on the template
			// and then append it to the main element
			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);

			return this;
		}
	});

	// Product Item
	// ------------

	// Product Item model
	var Item = Backbone.Model.extend({});

	// Product Item collection
	var ItemCollection = Backbone.Collection.extend({
		// use Item model
		model: Item,

		// comparator to determine the sort order based on the **product_id**
		comparator: function (product)
		{
			return product.get("product_id");
		}
	});

	// A single product item view
	// use default element (**div**)
	var ItemView = Backbone.View.extend({
		// class definitions for this view
		className: 'ui-widget-content draggable',

		// HTML template for each product item
		template: $('#prod-item-tmpl').template(),

		// initialization
		initialize: function () {
			// view is a jQuery-UI draggable
			// with semi transparent clone
			// when it's being dragged
			$(this.el).draggable({
				helper: 'clone',
				opacity: 0.65
			});

			// attach view as data to its element
			// so that later we can retrieve all
			// associated attributes of this view when we
			// want to do further processing to this view
			$(this.el).data("item-view", this);
		},

		// render Item view
		render: function() {
			// render template with associated model
			var html = $.tmpl(this.template, this.model);

			//then append it to view element
			$(this.el).append(html);
			return this;
		}
	});

	// Product item collection
	var ItemViewList = Backbone.View.extend({
		// main element to be bind to
		el: $('#productList'),

		// initialization
		initialize: function(){
			// bind customized method to this view
			_.bindAll(this, "renderItem");
		},

		// render a single product item based on
		// associated model and append it to the
		// main element
		renderItem: function(model){
			var itemView = new ItemView({model: model});
			itemView.render();
			$(this.el).append(itemView.el);
		},

		// render the collection of product items
		render: function() {
			this.collection.each(this.renderItem);
		}
	});

	// Product Item
	// ------------

	// Total price view
	var TotalPriceView = Backbone.View.extend({
		// define HTML element destination
		el: "#totalPrice",

		// HTML template for total price
		template: $('#total-price-tmpl').template(),

		// initialization
		initialize: function () {

			// bind customized method to this view
			_.bindAll(this, 'removeTotalPrice');
		},

		// remove total price from screen
		removeTotalPrice: function () {
			$(this.el).empty();
		},

		// render total price view
		render: function () {

			// get the total price from order collection
			var _totalPrice = this.collection.totalPrice;

			// start from clean slate
			$(this.el).empty();

			// render and append total price based on
			// newly created model
			$.tmpl(this.template, {totalPrice: _totalPrice}).appendTo(this.el);
			return this;
		}
	});

	// Order item collection that
	// will store selected product item
	var OrderItems = Backbone.Collection.extend({
		// user Item model
		model: Item,

		// initialization
		initialize: function () {
			// bind customized method to this view
			_.bindAll(this, "totalPrice");
		},

		// calculate total price
		totalPrice: function () {
			// underscore.js's **reduce** function is used
			return this.reduce(function(memo, value) { return memo + value.get("price") }, 0);
		}
	});

	// Representation of a single
	// selected product in the basket
	var OrderItemView = Backbone.View.extend({
		// use HTML element **li**
		tagName: 'li',

		// HTML template for single ordered product item
		template: $('#order-item-tmpl').template(),

		// bind click event to customized method
		events: {
			"click .removeItem"   : "removeItem"
		},

		// parent view
		parent: null,

		// initialization
		initialize: function (options) {
			// attach parent for this view
			this.parent = options.parent;
		},

		// remove a selected product item
		removeItem: function () {
			// will destroy associated model from ordered product item collection
			this.model.destroy();
		},

		// render this view
		render: function() {
			var _this = this;

			// generate element id
			// based on **category**, **product_id**, and model's **cid**
			var _id = 'order_item_' + _this.model.get('category') + '_' + _this.model.get('product_id') + '_' +  _this.model.cid;

			// render associated model using template and then append it to the
			// parent's element
			$(this.el).append($.tmpl(this.template, _this.model)).appendTo(_this.parent.el);

			// set element's id with the generated id
			$(this.el).attr('id', _id);

			// render **.removeItem** as jQuery-UI button
			// which has circle close icon without text
			$(".removeItem").button({
				icons: {
					primary: "ui-icon ui-icon-circle-close"
				},
				text: false
			});
			return this;
		}
	});


	// Container view for list of order item view
	// or we can call this simply shopping basket view
	var OrderItemViewList = Backbone.View.extend({
		// define HTML element destination
		el: $("#orderedProducts"),

		// this view has total price view
		totalView: null,

		// initialization
		initialize: function () {
			// bind all customized functions to this view
			_.bindAll(this, "render","addItem","removeItem","emptyBasket");

			// bind this collection events to customized functions
			this.collection.bind("add", this.addItem);
			this.collection.bind("remove", this.removeItem);
			this.collection.bind("reset", this.emptyBasket);

			// initialize total price view
			this.totalView = new TotalPriceView({collection: this.collection});
		},

		// empty basket view
		emptyBasket: function() {
			// show explanation panel
			$('#explanationTxtFrame').removeClass('hidden').addClass('showed');

			// remove total price from view
			this.totalView.removeTotalPrice();

			// empty main element
			$(this.el).empty();
		},

		// when an item is added
		addItem: function(item)
		{
			// create and render order item view based on associated model and
			// attach this view as its parent
			var itemView = new OrderItemView({model: item, parent: this});
			itemView.render();

			// finally render the total price view
			this.totalView.render();
		},

		// when an item is removed from the basket
		removeItem: function(item) {

			// let's find out which one is going to be removed by generate element id
			var _id = 'order_item_' + item.get('category') + '_' + item.get('product_id') + '_' + item.cid;

			// remove element from the screen
			$('#'+ _id).remove();

			// re-render total price to get new price
			this.totalView.render();

			// remove total price view and re-display explanation panel if basket empty
			if (this.collection.length < 1) {
				this.totalView.removeTotalPrice();
				$('#explanationTxtFrame').removeClass('hidden').addClass('showed');
			}

			// print the updated collection to the console
			console.log(this.collection.toJSON());
		},

		// render the view
		render: function () {

			// get this view so it's accessible
			var _view = this;

			// get parent's element and then
			// render it as droppable element
			$(_view.el).closest('div').droppable({
				// set droppable element as pointer tolerance
				// meaning draggable considered as hovering this view
				// when mouse pointer overlaps
				tolerance: 'pointer',

				// highlight basket when it's being hovered
				over: function( event, ui ) {
					$( this ).addClass( "basketHighlight" );
				},

				// and when an item is dropped
				drop: function( event, ui ) {
					// turn off the highlight color
					$( this ).removeClass( "basketHighlight" );

					// hide the explanation txt frame
					$('#explanationTxtFrame').removeClass('showed').addClass('hidden');

					// retrieved model from the dropped item view
					var model = $(ui.draggable).data("item-view").model;

					// then insert its clone to the order collection
					_view.collection.add(model.clone());

					// let's have a look how the order collection
					// after another item is dropped
					console.log(_view.collection.toJSON());

					// re-render the total price
					_view.totalView.render();
				}
			});
		}
	});

	// Main App View
	// -------------

	var AppView = Backbone.View.extend({

		// product categories
		_cat_data: null,
		_cat_items: null,
		_cat_view: null,

		// basket
		_basket_items:null,
		_basket_view: null,

		// action buttons
		_buttons_array: [
			{id:"resetButton", label:"Reset", action:"resetBasket"},
			{id:"submitButton", label:"Submit", action:"submitOrder"}
		],
		_buttons_list: null,
		_buttons_view: null,

		// initialization
		initialize: function (options)
		{
			// define this as local variable
			// so it's accessible in the lower
			// functions
			var _this = this;

			// retrieve product category list
			// from JSON file
			$.ajax({
				url: "data/ProductCategories_data.json",
				dataType: 'json',
				data: {},
				async: false,

				// when product category list is successfully retrieved
				success: function (data)
				{
					// build category list
					_this._cat_data = data;
					_this._cat_items = new CategoryCollection(data);
					_this._cat_view = new CategoryView({ model: _this._cat_items });
					_this._cat_view.render();

					// build basket
					_this._basket_items = new OrderItems;
					_this._basket_view = new OrderItemViewList({collection:_this._basket_items});
					_this._basket_view.render();

					// render buttons
					_this._buttons_list = new ButtonList(_this._buttons_array);
					_this._buttons_view = new ButtonListView({ collection: _this._buttons_list, parent: _this._basket_view});
					_this._buttons_view.render();

				}
			});

			return this;
		}
	});

	// Finally, we kick every things off by creating the App.
	var appView = new AppView;

});